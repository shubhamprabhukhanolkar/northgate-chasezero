export type ViewId =
  | 'orchestrator-inbox'
  | 'case-tracker'
  | 'ai-drafting-agent'
  | 'critic-compliance-qa'
  | 'human-in-the-loop-review'
  | 'executive-success-dashboard';

export type FilterTab = 'all' | 'breached' | 'draft_ready' | 'completed';

export interface DocumentItem {
  id: number;
  case_id: number;
  document_name: string;
  status: 'Missing' | 'Received' | 'Verified' | string;
  description: string;
  requirement_meta: string;
  assigned_to_or_verifier: string;
  doc_code: string;
}

export interface CriticCheckItem {
  key: string;
  title: string;
  badge: string;
  passed: boolean;
  summary: string;
  meta_left: string;
  meta_right: string;
}

export interface AgentActionItem {
  id: number;
  case_id: number;
  case_code?: string | null;
  client_name?: string | null;
  action_type: 'Draft_Generated' | 'Critic_Rejected' | 'RM_Approved' | string;
  timestamp: string;
  actor: string;
  details: string;
}

export interface KycCase {
  id: number;
  case_code: string;
  client_name: string;
  status: 'Missing_Docs' | 'Draft_Ready' | 'Completed' | string;
  days_open: number;
  last_contact_date: string;
  days_since_contact: number;
  sla_breached: boolean;
  sla_delay_days: number;
  chase_round_count: number;
  lei: string;
  entity_type: string;
  jurisdiction: string;
  desk: string;
  region: string;
  address: string;
  contact_name: string;
  contact_role: string;
  contact_email: string;
  assigned_rm: string;
  facility_value: string;
  relationship_notes: string;
  target_deadline_label: string;
  current_draft_subject?: string | null;
  current_draft_body?: string | null;
  critic_passed: boolean;
  critic_score: number;
  critic_feedback?: string | null;
  critic_checks: CriticCheckItem[];
  workflow_iterations: number;
  audit_hash?: string | null;
  documents: DocumentItem[];
  missing_count: number;
  verified_count: number;
}

export interface KycCaseDetail extends KycCase {
  actions: AgentActionItem[];
}

export interface CasesSummary {
  cases: KycCase[];
  total_active_cases: number;
  sla_breached_count: number;
  pending_rm_action_count: number;
  completed_count: number;
  avg_chase_latency_days: number;
  sla_buffer_health_pct: number;
}

export interface ApproveDispatchResponse {
  case: KycCaseDetail;
  tracking_id: string;
  audit_hash: string;
  message: string;
}

export interface DeskMetric {
  desk_name: string;
  accounts: number;
  adoption_rate: number;
  round_avg_days: number;
  status: string;
}

export interface DashboardMetrics {
  days_per_chase_round: number;
  baseline_days_per_round: number;
  target_days_per_round: number;
  velocity_delta_pct: number;
  case_days_saved_month: number;
  pilot_clients_count: number;
  rounds_per_client: number;
  days_saved_per_round: number;
  capital_enabled_gbp_m: number;
  rm_adoption_rate_pct: number;
  total_drafts_generated: number;
  total_critic_rejections: number;
  total_rm_approved: number;
  critic_intercept_rate_pct: number;
  avg_rm_review_seconds: number;
  baseline_onboarding_days: number;
  pilot_onboarding_days: number;
  baseline_chasing_days: number;
  pilot_chasing_days: number;
  baseline_unresponsive_pct: number;
  pilot_unresponsive_pct: number;
  escalations_avoided: number;
  desks: DeskMetric[];
  recent_actions: AgentActionItem[];
  extra: Record<string, number>;
}

export type ActiveNode = 'idle' | 'orchestrator' | 'drafter' | 'critic' | 'complete' | 'error';

export interface WorkflowStreamState {
  isRunning: boolean;
  activeNode: ActiveNode;
  streamedText: string;
  streamedSubject: string;
  progress: number;
  attempt: number;
  isRetry: boolean;
  statusLabel: string;
  rejectedReason: string | null;
  logs: string[];
}

export interface LlmHealthStatus {
  llm_configured: boolean;
  llm_provider: string;
  llm_model: string;
  env_file: string;
}
