import { create } from 'zustand';

import { apiClient } from '../api/client';
import type {
  ApproveDispatchResponse,
  CasesSummary,
  DashboardMetrics,
  FilterTab,
  KycCaseDetail,
  LlmHealthStatus,
  ViewId,
  WorkflowStreamState,
} from '../types/chasezero';
import { telemetryAudio } from '../utils/audio';

interface ChaseStoreState {
  activeView: ViewId;
  summary: CasesSummary | null;
  selectedCaseId: number | null;
  selectedCase: KycCaseDetail | null;
  dashboardMetrics: DashboardMetrics | null;
  searchQuery: string;
  filterTab: FilterTab;
  audioEnabled: boolean;
  simulateCriticRejection: boolean;
  loadingCases: boolean;
  loadingCaseDetail: boolean;
  loadingMetrics: boolean;
  error: string | null;
  workflow: WorkflowStreamState;
  lastDispatchResult: ApproveDispatchResponse | null;
  llmStatus: LlmHealthStatus | null;

  setActiveView: (view: ViewId) => void;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: FilterTab) => void;
  toggleAudio: () => void;
  setSimulateCriticRejection: (val: boolean) => void;

  fetchCases: () => Promise<void>;
  selectCase: (caseId: number, navigateTo?: ViewId) => Promise<void>;
  fetchDashboardMetrics: () => Promise<void>;
  toggleDocumentStatus: (caseId: number, docId: number) => Promise<void>;
  resetCaseDemo: (caseId: number) => Promise<void>;
  updateCaseNote: (caseId: number, note: string) => Promise<void>;
  startLangGraphWorkflow: (
    caseId: number,
    options?: { navigateToDrafting?: boolean; simulateRejection?: boolean; tone?: string }
  ) => void;
  rescanCritic: (caseId: number, draftBody?: string, simulateFailure?: boolean) => Promise<void>;
  adjustTone: (caseId: number, tone: string) => Promise<void>;
  approveAndSend: (
    caseId: number,
    payload: { subject: string; body: string; notify_analyst: boolean; cc_emails?: string[] }
  ) => Promise<ApproveDispatchResponse>;
  clearLastDispatch: () => void;
  fetchLlmStatus: () => Promise<void>;
  reloadEnvStatus: () => Promise<void>;
}

const initialWorkflow: WorkflowStreamState = {
  isRunning: false,
  activeNode: 'idle',
  streamedText: '',
  streamedSubject: '',
  progress: 0,
  attempt: 0,
  isRetry: false,
  statusLabel: 'Awaiting Orchestrator Launch',
  rejectedReason: null,
  logs: [],
};

let activeEventSource: EventSource | null = null;

export const useChaseStore = create<ChaseStoreState>((set, get) => ({
  activeView: 'orchestrator-inbox',
  summary: null,
  selectedCaseId: 1,
  selectedCase: null,
  dashboardMetrics: null,
  searchQuery: '',
  filterTab: 'all',
  audioEnabled: true,
  simulateCriticRejection: false,
  loadingCases: false,
  loadingCaseDetail: false,
  loadingMetrics: false,
  error: null,
  workflow: initialWorkflow,
  lastDispatchResult: null,
  llmStatus: null,

  setActiveView: (view) => {
    telemetryAudio.playNodePing(get().audioEnabled);
    set({ activeView: view });
    if (view === 'executive-success-dashboard') {
      void get().fetchDashboardMetrics();
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    void get().fetchCases();
  },

  setFilterTab: (tab) => {
    set({ filterTab: tab });
    void get().fetchCases();
  },

  toggleAudio: () => {
    const next = !get().audioEnabled;
    set({ audioEnabled: next });
    if (next) telemetryAudio.playNodePing(true);
  },

  setSimulateCriticRejection: (val) => set({ simulateCriticRejection: val }),

  fetchCases: async () => {
    set({ loadingCases: true, error: null });
    try {
      const { searchQuery, filterTab, selectedCaseId } = get();
      const summary = await apiClient.getCases(searchQuery, filterTab);
      set({ summary, loadingCases: false });
      const currentSelected = selectedCaseId ?? summary.cases[0]?.id ?? null;
      if (currentSelected && !get().selectedCase) {
        await get().selectCase(currentSelected);
      }
    } catch (err) {
      set({
        loadingCases: false,
        error: err instanceof Error ? err.message : 'Failed to load KYC cases',
      });
    }
  },

  selectCase: async (caseId, navigateTo) => {
    set({ loadingCaseDetail: true, selectedCaseId: caseId, error: null });
    if (navigateTo) {
      telemetryAudio.playNodePing(get().audioEnabled);
      set({ activeView: navigateTo });
    }
    try {
      const detail = await apiClient.getCaseDetail(caseId);
      set({ selectedCase: detail, loadingCaseDetail: false });
    } catch (err) {
      set({
        loadingCaseDetail: false,
        error: err instanceof Error ? err.message : 'Failed to load case details',
      });
    }
  },

  fetchDashboardMetrics: async () => {
    set({ loadingMetrics: true });
    try {
      const metrics = await apiClient.getDashboardMetrics();
      set({ dashboardMetrics: metrics, loadingMetrics: false });
    } catch (err) {
      set({
        loadingMetrics: false,
        error: err instanceof Error ? err.message : 'Failed to load COO metrics',
      });
    }
  },

  toggleDocumentStatus: async (caseId, docId) => {
    try {
      const updated = await apiClient.toggleDocument(caseId, docId);
      set({ selectedCase: updated });
      void get().fetchCases();
      telemetryAudio.playNodePing(get().audioEnabled);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to toggle document' });
    }
  },

  resetCaseDemo: async (caseId) => {
    try {
      const updated = await apiClient.resetCaseDemo(caseId);
      set({ selectedCase: updated, workflow: initialWorkflow, lastDispatchResult: null });
      void get().fetchCases();
      telemetryAudio.playNodePing(get().audioEnabled);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reset case' });
    }
  },

  updateCaseNote: async (caseId, note) => {
    try {
      const updated = await apiClient.updateCaseNote(caseId, note);
      set({ selectedCase: updated });
      telemetryAudio.playNodePing(get().audioEnabled);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update case note' });
    }
  },

  startLangGraphWorkflow: (caseId, options = {}) => {
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }

    const simulateRejection = options.simulateRejection ?? get().simulateCriticRejection;
    const tone = options.tone ?? 'institutional';

    if (options.navigateToDrafting !== false) {
      set({ activeView: 'ai-drafting-agent' });
    }

    telemetryAudio.playNodePing(get().audioEnabled);

    set({
      selectedCaseId: caseId,
      workflow: {
        isRunning: true,
        activeNode: 'orchestrator',
        streamedText: '',
        streamedSubject: '',
        progress: 5,
        attempt: 1,
        isRetry: false,
        statusLabel: 'Orchestrator Node querying SQLite for SLA breaches...',
        rejectedReason: null,
        logs: ['[LangGraph] Starting StateGraph execution...'],
      },
    });

    const es = apiClient.openWorkflowStream(caseId, simulateRejection, tone);
    activeEventSource = es;

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as Record<string, unknown>;
        const audioOn = get().audioEnabled;
        const type = String(data.type ?? '');

        if (type === 'node_start') {
          const node = String(data.node ?? 'orchestrator') as WorkflowStreamState['activeNode'];
          const label = String(data.label ?? '');
          const attempt = Number(data.attempt ?? get().workflow.attempt ?? 1);
          const isRetry = Boolean(data.is_retry);
          telemetryAudio.playNodePing(audioOn);

          set((state) => ({
            workflow: {
              ...state.workflow,
              activeNode: node,
              attempt,
              isRetry,
              statusLabel: label,
              streamedText: node === 'drafter' ? '' : state.workflow.streamedText,
              progress: node === 'orchestrator' ? 15 : node === 'drafter' ? 40 : 85,
              logs: [...state.workflow.logs, `[${node.toUpperCase()}] ${label}`],
            },
          }));
        } else if (type === 'orchestrator_result') {
          const breached = Number(data.breached_count ?? 0);
          const missing = Number(data.missing_docs_count ?? 0);
          set((state) => ({
            workflow: {
              ...state.workflow,
              progress: 28,
              logs: [
                ...state.workflow.logs,
                `[ORCHESTRATOR] Found ${breached} SLA-breached cases (>3d); gathered ${missing} missing docs.`,
              ],
            },
          }));
        } else if (type === 'draft_token') {
          const chunk = String(data.chunk ?? '');
          const prog = Number(data.progress ?? 50);
          if (prog % 16 < 5) telemetryAudio.playDraftTick(audioOn);
          set((state) => ({
            workflow: {
              ...state.workflow,
              streamedText: state.workflow.streamedText + chunk,
              progress: Math.max(40, Math.min(82, 40 + Math.round(prog * 0.4))),
            },
          }));
        } else if (type === 'draft_complete') {
          const subject = String(data.subject ?? '');
          const body = String(data.body ?? '');
          set((state) => ({
            workflow: {
              ...state.workflow,
              streamedSubject: subject,
              streamedText: body,
              progress: 84,
              logs: [
                ...state.workflow.logs,
                `[DRAFTER] Completed draft v${data.attempt ?? 1} (${data.word_count ?? 0} words).`,
              ],
            },
          }));
        } else if (type === 'critic_result') {
          const passed = Boolean(data.passed);
          const feedback = String(data.feedback ?? '');
          const score = Number(data.score ?? 100);
          if (passed) {
            telemetryAudio.playCriticPass(audioOn);
          } else {
            telemetryAudio.playCriticReject(audioOn);
          }
          set((state) => ({
            workflow: {
              ...state.workflow,
              rejectedReason: passed ? state.workflow.rejectedReason : feedback,
              statusLabel: passed
                ? `Critic QA Passed (${score}/100) — Status set to Draft_Ready`
                : `Critic QA Rejected Draft v${data.attempt ?? 1} — Routing back to Drafter Node!`,
              logs: [
                ...state.workflow.logs,
                passed
                  ? `[CRITIC] PASSED (${score}/100) — ${feedback}`
                  : `[CRITIC] REJECTED (${score}/100) -> Routing back to Drafter: ${feedback}`,
              ],
            },
          }));
        } else if (type === 'workflow_complete') {
          const updatedCase = data.case as KycCaseDetail | undefined;
          es.close();
          activeEventSource = null;
          set((state) => ({
            selectedCase: updatedCase ?? state.selectedCase,
            workflow: {
              ...state.workflow,
              isRunning: false,
              activeNode: 'complete',
              progress: 100,
              statusLabel: 'Drafting & Compliance QA Complete — Ready for Review',
            },
          }));
          void get().fetchCases();
          void get().fetchDashboardMetrics();
        } else if (type === 'error') {
          es.close();
          activeEventSource = null;
          set((state) => ({
            error: String(data.message ?? 'Workflow stream error'),
            workflow: {
              ...state.workflow,
              isRunning: false,
              activeNode: 'error',
              statusLabel: 'Workflow Error',
            },
          }));
        }
      } catch {
        // Ignore malformed SSE ping
      }
    };

    es.onerror = () => {
      es.close();
      activeEventSource = null;
      set((state) => {
        if (!state.workflow.isRunning) return state;
        return {
          workflow: {
            ...state.workflow,
            isRunning: false,
            activeNode: 'error',
            statusLabel: 'SSE stream disconnected',
          },
        };
      });
    };
  },

  rescanCritic: async (caseId, draftBody, simulateFailure = false) => {
    try {
      const updated = await apiClient.rescanCritic(caseId, draftBody, simulateFailure);
      set({ selectedCase: updated });
      if (updated.critic_passed) {
        telemetryAudio.playCriticPass(get().audioEnabled);
      } else {
        telemetryAudio.playCriticReject(get().audioEnabled);
      }
      void get().fetchDashboardMetrics();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Critic scan failed' });
    }
  },

  adjustTone: async (caseId, tone) => {
    try {
      const updated = await apiClient.adjustTone(caseId, tone);
      set({ selectedCase: updated });
      telemetryAudio.playNodePing(get().audioEnabled);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Tone adjustment failed' });
    }
  },

  approveAndSend: async (caseId, payload) => {
    const res = await apiClient.approveAndSend(caseId, payload);
    telemetryAudio.playDispatchSuccess(get().audioEnabled);
    set({ selectedCase: res.case, lastDispatchResult: res });
    void get().fetchCases();
    void get().fetchDashboardMetrics();
    return res;
  },

  clearLastDispatch: () => set({ lastDispatchResult: null }),

  fetchLlmStatus: async () => {
    try {
      const llmStatus = await apiClient.getHealth();
      set({ llmStatus });
    } catch {
      // ignore initial health check failure
    }
  },

  reloadEnvStatus: async () => {
    try {
      const llmStatus = await apiClient.reloadEnv();
      set({ llmStatus });
      telemetryAudio.playNodePing(get().audioEnabled);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reload .env' });
    }
  },
}));
