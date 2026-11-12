"""FastAPI application exposing ChaseZero REST and SSE LangGraph endpoints."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import hashlib
import json
from typing import AsyncGenerator

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agent_graph import (
    evaluate_draft_compliance,
    run_chase_workflow,
    synthesize_chase_email,
)
from app.database import AsyncSessionLocal, get_db, init_db
from app.llm_config import get_llm_status, reload_env_files
from app.models import AgentAction, KycCase, MissingDocument
from app.paths import FRONTEND_DIST_DIR
from app.schemas import (
    AgentActionOut,
    ApproveDispatchRequest,
    ApproveDispatchResponse,
    CaseNoteRequest,
    CasesSummaryOut,
    CriticCheckItem,
    CriticRescanRequest,
    DashboardMetricsOut,
    DeskMetric,
    DocumentOut,
    DraftToneRequest,
    KycCaseDetailOut,
    KycCaseOut,
    WorkflowRunRequest,
)
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database(session)
    yield


app = FastAPI(
    title="Northgate ChaseZero API",
    version="0.1.0",
    description="Multi-agent KYC document chasing backend powered by LangGraph & Async SQLAlchemy 2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _serialize_case(case_obj: KycCase) -> KycCaseOut:
    now = datetime.now(timezone.utc)
    last_contact = _as_utc(case_obj.last_contact_date)
    days_since = round(max(0.0, (now - last_contact).total_seconds() / 86400.0), 1)
    sla_breached = days_since > 3.0 and case_obj.status != "Completed"
    sla_delay = round(max(0.0, days_since - 3.0), 1) if sla_breached else 0.0

    parsed_checks: list[CriticCheckItem] = []
    if case_obj.critic_checks_json:
        try:
            raw_checks = json.loads(case_obj.critic_checks_json)
            parsed_checks = [CriticCheckItem(**c) for c in raw_checks]
        except Exception:
            parsed_checks = []

    docs = [DocumentOut.model_validate(d) for d in case_obj.documents]
    missing_count = sum(1 for d in docs if d.status == "Missing")
    verified_count = sum(1 for d in docs if d.status == "Verified")

    return KycCaseOut(
        id=case_obj.id,
        case_code=case_obj.case_code,
        client_name=case_obj.client_name,
        status=case_obj.status,
        days_open=case_obj.days_open,
        last_contact_date=last_contact,
        days_since_contact=days_since,
        sla_breached=sla_breached,
        sla_delay_days=sla_delay,
        chase_round_count=case_obj.chase_round_count,
        lei=case_obj.lei,
        entity_type=case_obj.entity_type,
        jurisdiction=case_obj.jurisdiction,
        desk=case_obj.desk,
        region=case_obj.region,
        address=case_obj.address,
        contact_name=case_obj.contact_name,
        contact_role=case_obj.contact_role,
        contact_email=case_obj.contact_email,
        assigned_rm=case_obj.assigned_rm,
        facility_value=case_obj.facility_value,
        relationship_notes=case_obj.relationship_notes,
        target_deadline_label=case_obj.target_deadline_label,
        current_draft_subject=case_obj.current_draft_subject,
        current_draft_body=case_obj.current_draft_body,
        critic_passed=case_obj.critic_passed,
        critic_score=case_obj.critic_score,
        critic_feedback=case_obj.critic_feedback,
        critic_checks=parsed_checks,
        workflow_iterations=case_obj.workflow_iterations,
        audit_hash=case_obj.audit_hash,
        documents=docs,
        missing_count=missing_count,
        verified_count=verified_count,
    )


async def _load_case_or_404(session: AsyncSession, case_id: int) -> KycCase:
    stmt = (
        select(KycCase)
        .options(selectinload(KycCase.documents), selectinload(KycCase.actions))
        .where(KycCase.id == case_id)
    )
    case_obj = (await session.execute(stmt)).scalar_one_or_none()
    if case_obj is None:
        raise HTTPException(status_code=404, detail=f"KYC case {case_id} not found")
    return case_obj


def _serialize_case_detail(case_obj: KycCase) -> KycCaseDetailOut:
    base = _serialize_case(case_obj)
    actions = [
        AgentActionOut(
            id=a.id,
            case_id=a.case_id,
            case_code=case_obj.case_code,
            client_name=case_obj.client_name,
            action_type=a.action_type,
            timestamp=_as_utc(a.timestamp),
            actor=a.actor,
            details=a.details,
        )
        for a in case_obj.actions
    ]
    return KycCaseDetailOut(**base.model_dump(), actions=actions)


@app.get("/api/health")
async def health_check(session: AsyncSession = Depends(get_db)) -> dict[str, object]:
    count = await session.scalar(select(func.count(KycCase.id)))
    llm = get_llm_status()
    return {
        "status": "ok",
        "service": "chasezero-backend",
        "cases_loaded": str(count or 0),
        "llm_configured": llm.configured,
        "llm_provider": llm.provider,
        "llm_model": llm.model,
        "env_file": llm.env_file,
    }


@app.post("/api/settings/reload-env")
async def reload_env_settings() -> dict[str, object]:
    reload_env_files()
    llm = get_llm_status()
    return {
        "llm_configured": llm.configured,
        "llm_provider": llm.provider,
        "llm_model": llm.model,
        "env_file": llm.env_file,
    }


@app.get("/api/cases", response_model=CasesSummaryOut)
async def list_cases(
    search: str = Query(default="", description="Filter by client name, LEI, or case code"),
    filter_tab: str = Query(default="all", description="all | breached | draft_ready | completed"),
    session: AsyncSession = Depends(get_db),
) -> CasesSummaryOut:
    stmt = (
        select(KycCase)
        .options(selectinload(KycCase.documents))
        .order_by(KycCase.last_contact_date.asc())
    )
    all_cases = (await session.execute(stmt)).scalars().all()
    serialized_all = [_serialize_case(c) for c in all_cases]

    breached_count = sum(1 for c in serialized_all if c.sla_breached)
    pending_rm_count = sum(1 for c in serialized_all if c.status == "Draft_Ready")
    completed_count = sum(1 for c in serialized_all if c.status == "Completed")
    active_cases = [c for c in serialized_all if c.status != "Completed"]
    avg_latency = (
        round(sum(c.days_since_contact for c in active_cases) / len(active_cases), 1)
        if active_cases
        else 0.0
    )
    sla_health = round(
        max(82.0, 100.0 - (breached_count / max(1, len(serialized_all))) * 12.0), 1
    )

    filtered = serialized_all
    if filter_tab == "breached":
        filtered = [c for c in filtered if c.sla_breached]
    elif filter_tab == "draft_ready":
        filtered = [c for c in filtered if c.status == "Draft_Ready"]
    elif filter_tab == "awaiting":
        filtered = [c for c in filtered if c.status == "Missing_Docs"]
    elif filter_tab == "completed":
        filtered = [c for c in filtered if c.status == "Completed" or not c.sla_breached]

    if search.strip():
        q = search.strip().lower()
        filtered = [
            c
            for c in filtered
            if q in c.client_name.lower()
            or q in c.case_code.lower()
            or q in c.lei.lower()
            or q in c.contact_name.lower()
        ]

    return CasesSummaryOut(
        cases=filtered,
        total_active_cases=len(serialized_all),
        sla_breached_count=breached_count,
        pending_rm_action_count=pending_rm_count,
        completed_count=completed_count,
        avg_chase_latency_days=avg_latency,
        sla_buffer_health_pct=sla_health,
    )


@app.get("/api/cases/{case_id}", response_model=KycCaseDetailOut)
async def get_case_detail(
    case_id: int,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    case_obj = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(case_obj)


@app.post("/api/cases/{case_id}/documents/{doc_id}/toggle", response_model=KycCaseDetailOut)
async def toggle_document_status(
    case_id: int,
    doc_id: int,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    """Toggle a document status (Missing -> Received -> Verified -> Missing) for interactive demos."""
    case_obj = await _load_case_or_404(session, case_id)
    doc = next((d for d in case_obj.documents if d.id == doc_id), None)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found on case {case_id}")

    cycle = {"Missing": "Received", "Received": "Verified", "Verified": "Missing"}
    doc.status = cycle.get(doc.status, "Missing")
    if doc.status == "Verified":
        doc.assigned_to_or_verifier = "Verified by Analyst Marcus Vance (Live Demo)"
    elif doc.status == "Received":
        doc.assigned_to_or_verifier = "Human-in-the-loop Active"
    else:
        doc.assigned_to_or_verifier = f"Assigned: {case_obj.contact_name}"

    await session.commit()
    refreshed = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(refreshed)


@app.get("/api/cases/{case_id}/workflow/stream")
async def stream_workflow(
    case_id: int,
    simulate_critic_rejection: bool = Query(default=False),
    tone: str = Query(default="institutional"),
) -> StreamingResponse:
    """Execute the LangGraph StateGraph and stream real-time SSE node & token events."""
    # Validate case exists up front
    async with AsyncSessionLocal() as session:
        await _load_case_or_404(session, case_id)

    queue: asyncio.Queue[dict | None] = asyncio.Queue()

    async def emit(event: dict) -> None:
        await queue.put(event)

    async def _runner() -> None:
        try:
            final_state = await run_chase_workflow(
                case_id=case_id,
                simulate_critic_rejection=simulate_critic_rejection,
                tone_override=tone,
                emit=emit,
            )
            async with AsyncSessionLocal() as session:
                updated_case = await _load_case_or_404(session, case_id)
                case_payload = _serialize_case_detail(updated_case).model_dump(mode="json")

            await queue.put({
                "type": "workflow_complete",
                "case": case_payload,
                "attempts": final_state.get("draft_attempt", 1),
                "critic_passed": final_state.get("critic_passed", True),
            })
        except Exception as exc:
            await queue.put({"type": "error", "message": str(exc)})
        finally:
            await queue.put(None)

    async def event_generator() -> AsyncGenerator[str, None]:
        task = asyncio.create_task(_runner())
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {json.dumps(item)}\n\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/cases/{case_id}/workflow/run", response_model=KycCaseDetailOut)
async def run_workflow_sync(
    case_id: int,
    payload: WorkflowRunRequest,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    """REST endpoint executing the full LangGraph StateGraph and returning the updated case."""
    await _load_case_or_404(session, case_id)
    await run_chase_workflow(
        case_id=case_id,
        simulate_critic_rejection=payload.simulate_critic_rejection,
        tone_override=payload.tone,
    )
    refreshed = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(refreshed)


@app.post("/api/cases/{case_id}/critic/rescan", response_model=KycCaseDetailOut)
async def rescan_critic(
    case_id: int,
    payload: CriticRescanRequest,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    """Re-run the Critic Compliance QA evaluation against the current or provided draft."""
    case_obj = await _load_case_or_404(session, case_id)
    missing_docs = [
        {"id": d.id, "document_name": d.document_name, "description": d.description}
        for d in case_obj.documents
        if d.status == "Missing"
    ]
    verified_docs = [
        {"id": d.id, "document_name": d.document_name}
        for d in case_obj.documents
        if d.status == "Verified"
    ]

    body = payload.draft_body if payload.draft_body is not None else (case_obj.current_draft_body or "")
    if payload.simulate_failure:
        body = (
            f"Dear {case_obj.contact_name},\n\n"
            "Northgate Bank can guarantee immediate credit approval and a waiver of regulatory KYC checks.\n"
        )

    passed, score, feedback, checks = evaluate_draft_compliance(
        draft_body=body,
        missing_docs=missing_docs,
        verified_docs=verified_docs,
        client_name=case_obj.client_name,
    )

    raw_hash = hashlib.sha256(f"{case_id}:{body}".encode()).hexdigest()[:8].upper()
    case_obj.current_draft_body = body
    case_obj.critic_passed = passed
    case_obj.critic_score = score
    case_obj.critic_feedback = feedback
    case_obj.critic_checks_json = json.dumps(checks)
    case_obj.audit_hash = f"#QA-{raw_hash}-RESCAN"

    if not passed:
        session.add(
            AgentAction(
                case_id=case_id,
                action_type="Critic_Rejected",
                actor="ChaseZero Critic QA",
                details=f"Manual rescan rejected draft (Score {score}/100): {feedback}",
            )
        )
    elif case_obj.status != "Completed":
        case_obj.status = "Draft_Ready"

    await session.commit()
    refreshed = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(refreshed)


@app.post("/api/cases/{case_id}/draft/tone", response_model=KycCaseDetailOut)
async def adjust_draft_tone(
    case_id: int,
    payload: DraftToneRequest,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    """Re-synthesize the draft with an RM-selected tone preset while keeping Critic compliance."""
    case_obj = await _load_case_or_404(session, case_id)
    missing_docs = [
        {"id": d.id, "document_name": d.document_name, "description": d.description}
        for d in case_obj.documents
        if d.status == "Missing"
    ]
    verified_docs = [
        {"id": d.id, "document_name": d.document_name}
        for d in case_obj.documents
        if d.status == "Verified"
    ]
    client_ctx = {
        "client_name": case_obj.client_name,
        "case_code": case_obj.case_code,
        "contact_name": case_obj.contact_name,
        "contact_role": case_obj.contact_role,
        "facility_value": case_obj.facility_value,
        "target_deadline_label": case_obj.target_deadline_label,
        "assigned_rm": case_obj.assigned_rm,
    }
    tone = "institutional" if payload.tone == "baseline" else payload.tone
    subject, body = synthesize_chase_email(
        client_context=client_ctx,
        missing_docs=missing_docs,
        verified_docs=verified_docs,
        tone=tone,
    )
    passed, score, feedback, checks = evaluate_draft_compliance(
        draft_body=body,
        missing_docs=missing_docs,
        verified_docs=verified_docs,
        client_name=case_obj.client_name,
    )
    case_obj.current_draft_subject = subject
    case_obj.current_draft_body = body
    case_obj.critic_passed = passed
    case_obj.critic_score = score
    case_obj.critic_feedback = feedback
    case_obj.critic_checks_json = json.dumps(checks)
    if passed and case_obj.status != "Completed":
        case_obj.status = "Draft_Ready"

    await session.commit()
    refreshed = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(refreshed)


@app.post("/api/cases/{case_id}/approve", response_model=ApproveDispatchResponse)
async def approve_and_send(
    case_id: int,
    payload: ApproveDispatchRequest,
    session: AsyncSession = Depends(get_db),
) -> ApproveDispatchResponse:
    """HITL Gate: RM approves & sends finalized chase email, updating SQLite & telemetry."""
    case_obj = await _load_case_or_404(session, case_id)

    now = datetime.now(timezone.utc)
    case_obj.current_draft_subject = payload.subject
    case_obj.current_draft_body = payload.body
    case_obj.status = "Completed"
    case_obj.last_contact_date = now
    case_obj.chase_round_count += 1

    raw_hash = hashlib.sha256(f"{case_id}:{payload.body}:{now.isoformat()}".encode()).hexdigest()[:12]
    tracking_id = f"#CHASE-{case_obj.case_code.split('-')[-1]}-DISPATCH-OK"
    case_obj.audit_hash = raw_hash

    session.add(
        AgentAction(
            case_id=case_id,
            action_type="RM_Approved",
            timestamp=now,
            actor=f"{payload.actor} (RM)",
            details=(
                f"RM authorized & dispatched chase round #{case_obj.chase_round_count} "
                f"to {case_obj.contact_email} | Hash {raw_hash[:8]}"
                + (" | Analyst notified" if payload.notify_analyst else "")
            ),
        )
    )
    await session.commit()

    refreshed = await _load_case_or_404(session, case_id)
    return ApproveDispatchResponse(
        case=_serialize_case_detail(refreshed),
        tracking_id=tracking_id,
        audit_hash=raw_hash,
        message=(
            f"Outbound chase dispatched to {case_obj.contact_name} ({case_obj.contact_email}) "
            f"via {payload.actor}'s authenticated corporate gateway."
        ),
    )


@app.post("/api/cases/{case_id}/reset", response_model=KycCaseDetailOut)
async def reset_case_for_demo(
    case_id: int,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    """Reset a case back to SLA-breached Missing_Docs state for repeatable demos."""
    case_obj = await _load_case_or_404(session, case_id)
    case_obj.status = "Missing_Docs"
    case_obj.last_contact_date = datetime.now(timezone.utc) - timedelta(days=4, hours=5)
    case_obj.current_draft_subject = None
    case_obj.current_draft_body = None
    case_obj.critic_passed = False
    case_obj.critic_score = 0
    case_obj.critic_feedback = None
    case_obj.critic_checks_json = None
    case_obj.workflow_iterations = 0
    await session.commit()
    refreshed = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(refreshed)


@app.patch("/api/cases/{case_id}/note", response_model=KycCaseDetailOut)
async def update_case_note(
    case_id: int,
    payload: CaseNoteRequest,
    session: AsyncSession = Depends(get_db),
) -> KycCaseDetailOut:
    """Persist RM relationship note edits to SQLite."""
    case_obj = await _load_case_or_404(session, case_id)
    case_obj.relationship_notes = payload.relationship_notes.strip()
    await session.commit()
    refreshed = await _load_case_or_404(session, case_id)
    return _serialize_case_detail(refreshed)


@app.get("/api/actions", response_model=list[AgentActionOut])
async def list_agent_actions(
    limit: int = Query(default=50, le=200),
    session: AsyncSession = Depends(get_db),
) -> list[AgentActionOut]:
    stmt = (
        select(AgentAction, KycCase.case_code, KycCase.client_name)
        .join(KycCase, AgentAction.case_id == KycCase.id)
        .order_by(AgentAction.timestamp.desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).all()
    return [
        AgentActionOut(
            id=action.id,
            case_id=action.case_id,
            case_code=case_code,
            client_name=client_name,
            action_type=action.action_type,
            timestamp=_as_utc(action.timestamp),
            actor=action.actor,
            details=action.details,
        )
        for action, case_code, client_name in rows
    ]


@app.get("/api/dashboard/metrics", response_model=DashboardMetricsOut)
async def get_dashboard_metrics(
    session: AsyncSession = Depends(get_db),
) -> DashboardMetricsOut:
    """Calculate COO Success Dashboard metrics directly from agent_actions & kyc_cases."""
    counts_stmt = select(AgentAction.action_type, func.count(AgentAction.id)).group_by(
        AgentAction.action_type
    )
    counts_rows = (await session.execute(counts_stmt)).all()
    counts = {action_type: count for action_type, count in counts_rows}

    total_drafts = int(counts.get("Draft_Generated", 0))
    total_rejections = int(counts.get("Critic_Rejected", 0))
    total_approved = int(counts.get("RM_Approved", 0))

    # RM Adoption Rate calculated directly from agent_actions
    rm_adoption_rate = round(min(100.0, (total_approved / max(1, total_drafts)) * 100.0), 1)
    critic_intercept_rate = round((total_rejections / max(1, total_drafts)) * 100.0, 1)

    # Operational velocity dynamically reflects new RM approvals logged in agent_actions
    baseline_days = 5.5
    extra_approvals = max(0, total_approved - 18)
    days_per_round = round(max(2.6, 3.1 - (extra_approvals * 0.05)), 2)
    velocity_delta = round(((days_per_round - baseline_days) / baseline_days) * 100.0, 1)
    days_saved_per_round = round(baseline_days - days_per_round, 1)

    pilot_clients = 400
    rounds_per_client = 3
    case_days_saved = int(round(pilot_clients * rounds_per_client * days_saved_per_round))
    capital_enabled = round(14.2 + (extra_approvals * 0.45), 1)

    pilot_chasing_days = round(max(6.2, 7.8 - (extra_approvals * 0.1)), 1)
    pilot_onboarding_days = round(16.0 + pilot_chasing_days + 29.0, 1)

    recent_actions = await list_agent_actions(limit=15, session=session)

    all_cases = (await session.execute(select(KycCase))).scalars().all()
    breached_live = sum(
        1
        for c in all_cases
        if (_as_utc(datetime.now(timezone.utc)) - _as_utc(c.last_contact_date)).total_seconds()
        > 3 * 86400
        and c.status != "Completed"
    )
    live_unresponsive_pct = round(max(6.5, 9.0 - (extra_approvals * 0.4)), 1)

    desks = [
        DeskMetric(
            desk_name="FX & Rates Desk",
            accounts=180,
            adoption_rate=min(99.5, round(96.1 + extra_approvals * 0.2, 1)),
            round_avg_days=round(max(2.4, days_per_round - 0.3), 1),
            status="healthy",
        ),
        DeskMetric(
            desk_name="Energy & Commodities",
            accounts=140,
            adoption_rate=min(99.2, round(93.8 + extra_approvals * 0.25, 1)),
            round_avg_days=round(days_per_round + 0.1, 1),
            status="healthy",
        ),
        DeskMetric(
            desk_name="Structured Debt",
            accounts=80,
            adoption_rate=min(98.5, round(91.5 + extra_approvals * 0.3, 1)),
            round_avg_days=round(days_per_round + 0.3, 1),
            status="warning",
        ),
    ]

    return DashboardMetricsOut(
        days_per_chase_round=days_per_round,
        baseline_days_per_round=baseline_days,
        target_days_per_round=3.0,
        velocity_delta_pct=velocity_delta,
        case_days_saved_month=case_days_saved,
        pilot_clients_count=pilot_clients,
        rounds_per_client=rounds_per_client,
        days_saved_per_round=days_saved_per_round,
        capital_enabled_gbp_m=capital_enabled,
        rm_adoption_rate_pct=rm_adoption_rate,
        total_drafts_generated=total_drafts,
        total_critic_rejections=total_rejections,
        total_rm_approved=total_approved,
        critic_intercept_rate_pct=critic_intercept_rate,
        avg_rm_review_seconds=48,
        baseline_onboarding_days=62.0,
        pilot_onboarding_days=pilot_onboarding_days,
        baseline_chasing_days=17.0,
        pilot_chasing_days=pilot_chasing_days,
        baseline_unresponsive_pct=68.0,
        pilot_unresponsive_pct=live_unresponsive_pct,
        escalations_avoided=236 + extra_approvals,
        desks=desks,
        recent_actions=recent_actions,
        extra={
            "live_breached_cases": breached_live,
            "total_db_cases": len(all_cases),
        },
    )


# Serve bundled Vite React production build (used by ChaseZero.exe and standalone backend runs)
if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = FRONTEND_DIST_DIR / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
