import type {
  AgentActionItem,
  ApproveDispatchResponse,
  CasesSummary,
  DashboardMetrics,
  KycCaseDetail,
  LlmHealthStatus,
} from '../types/chasezero';

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  getHealth(): Promise<LlmHealthStatus> {
    return request<LlmHealthStatus>('/health');
  },

  reloadEnv(): Promise<LlmHealthStatus> {
    return request<LlmHealthStatus>('/settings/reload-env', { method: 'POST' });
  },

  getCases(search = '', filterTab = 'all'): Promise<CasesSummary> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filterTab) params.set('filter_tab', filterTab);
    return request<CasesSummary>(`/cases?${params.toString()}`);
  },

  getCaseDetail(caseId: number): Promise<KycCaseDetail> {
    return request<KycCaseDetail>(`/cases/${caseId}`);
  },

  toggleDocument(caseId: number, docId: number): Promise<KycCaseDetail> {
    return request<KycCaseDetail>(`/cases/${caseId}/documents/${docId}/toggle`, {
      method: 'POST',
    });
  },

  rescanCritic(
    caseId: number,
    draftBody?: string,
    simulateFailure = false
  ): Promise<KycCaseDetail> {
    return request<KycCaseDetail>(`/cases/${caseId}/critic/rescan`, {
      method: 'POST',
      body: JSON.stringify({
        draft_body: draftBody ?? null,
        simulate_failure: simulateFailure,
      }),
    });
  },

  adjustTone(caseId: number, tone: string): Promise<KycCaseDetail> {
    return request<KycCaseDetail>(`/cases/${caseId}/draft/tone`, {
      method: 'POST',
      body: JSON.stringify({ tone }),
    });
  },

  approveAndSend(
    caseId: number,
    payload: {
      subject: string;
      body: string;
      notify_analyst: boolean;
      actor?: string;
      cc_emails?: string[];
    }
  ): Promise<ApproveDispatchResponse> {
    return request<ApproveDispatchResponse>(`/cases/${caseId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resetCaseDemo(caseId: number): Promise<KycCaseDetail> {
    return request<KycCaseDetail>(`/cases/${caseId}/reset`, {
      method: 'POST',
    });
  },

  updateCaseNote(caseId: number, note: string): Promise<KycCaseDetail> {
    return request<KycCaseDetail>(`/cases/${caseId}/note`, {
      method: 'PATCH',
      body: JSON.stringify({ relationship_notes: note }),
    });
  },

  getDashboardMetrics(): Promise<DashboardMetrics> {
    return request<DashboardMetrics>('/dashboard/metrics');
  },

  getActions(limit = 50): Promise<AgentActionItem[]> {
    return request<AgentActionItem[]>(`/actions?limit=${limit}`);
  },

  openWorkflowStream(
    caseId: number,
    simulateCriticRejection: boolean,
    tone = 'institutional'
  ): EventSource {
    const params = new URLSearchParams({
      simulate_critic_rejection: String(simulateCriticRejection),
      tone,
    });
    return new EventSource(`${API_BASE}/cases/${caseId}/workflow/stream?${params.toString()}`);
  },
};
