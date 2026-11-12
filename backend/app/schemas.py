"""Pydantic v2 request and response schemas for ChaseZero API."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    document_name: str
    status: str
    description: str
    requirement_meta: str
    assigned_to_or_verifier: str
    doc_code: str


class AgentActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    case_code: Optional[str] = None
    client_name: Optional[str] = None
    action_type: str
    timestamp: datetime
    actor: str
    details: str


class CriticCheckItem(BaseModel):
    key: str
    title: str
    badge: str
    passed: bool
    summary: str
    meta_left: str
    meta_right: str


class KycCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_code: str
    client_name: str
    status: str
    days_open: int
    last_contact_date: datetime
    days_since_contact: float
    sla_breached: bool
    sla_delay_days: float
    chase_round_count: int
    lei: str
    entity_type: str
    jurisdiction: str
    desk: str
    region: str
    address: str
    contact_name: str
    contact_role: str
    contact_email: str
    assigned_rm: str
    facility_value: str
    relationship_notes: str
    target_deadline_label: str
    current_draft_subject: Optional[str] = None
    current_draft_body: Optional[str] = None
    critic_passed: bool
    critic_score: int
    critic_feedback: Optional[str] = None
    critic_checks: list[CriticCheckItem] = Field(default_factory=list)
    workflow_iterations: int
    audit_hash: Optional[str] = None
    documents: list[DocumentOut] = Field(default_factory=list)
    missing_count: int = 0
    verified_count: int = 0


class KycCaseDetailOut(KycCaseOut):
    actions: list[AgentActionOut] = Field(default_factory=list)


class CasesSummaryOut(BaseModel):
    cases: list[KycCaseOut]
    total_active_cases: int
    sla_breached_count: int
    pending_rm_action_count: int
    completed_count: int
    avg_chase_latency_days: float
    sla_buffer_health_pct: float


class WorkflowRunRequest(BaseModel):
    simulate_critic_rejection: bool = False
    tone: str = "institutional"


class DraftToneRequest(BaseModel):
    tone: str = "institutional"  # institutional | casual | urgent | calendar | baseline
    current_body: Optional[str] = None


class CaseNoteRequest(BaseModel):
    relationship_notes: str


class CriticRescanRequest(BaseModel):
    draft_body: Optional[str] = None
    simulate_failure: bool = False


class ApproveDispatchRequest(BaseModel):
    subject: str
    body: str
    notify_analyst: bool = True
    actor: str = "Sarah Jenkins"
    cc_emails: list[str] = Field(default_factory=list)


class ApproveDispatchResponse(BaseModel):
    case: KycCaseDetailOut
    tracking_id: str
    audit_hash: str
    message: str


class DeskMetric(BaseModel):
    desk_name: str
    accounts: int
    adoption_rate: float
    round_avg_days: float
    status: str


class DashboardMetricsOut(BaseModel):
    days_per_chase_round: float
    baseline_days_per_round: float
    target_days_per_round: float
    velocity_delta_pct: float
    case_days_saved_month: int
    pilot_clients_count: int
    rounds_per_client: int
    days_saved_per_round: float
    capital_enabled_gbp_m: float
    rm_adoption_rate_pct: float
    total_drafts_generated: int
    total_critic_rejections: int
    total_rm_approved: int
    critic_intercept_rate_pct: float
    avg_rm_review_seconds: int
    baseline_onboarding_days: float
    pilot_onboarding_days: float
    baseline_chasing_days: float
    pilot_chasing_days: float
    baseline_unresponsive_pct: float
    pilot_unresponsive_pct: float
    escalations_avoided: int
    desks: list[DeskMetric]
    recent_actions: list[AgentActionOut]
    extra: dict[str, Any] = Field(default_factory=dict)
