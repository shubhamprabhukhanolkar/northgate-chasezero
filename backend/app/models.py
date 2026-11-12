"""SQLAlchemy 2.0 ORM models for ChaseZero KYC orchestration."""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    """Return timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


class KycCase(Base):
    """Corporate onboarding KYC case tracked by the ChaseZero orchestrator."""

    __tablename__ = "kyc_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="Missing_Docs"
    )  # Missing_Docs | Draft_Ready | Completed
    days_open: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_contact_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    chase_round_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Enterprise KYC metadata for the 6 UI views
    lei: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    jurisdiction: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    desk: Mapped[str] = mapped_column(String(128), nullable=False, default="FX & Rates Desk")
    region: Mapped[str] = mapped_column(String(64), nullable=False, default="EMEA / UK")
    address: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    contact_name: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    contact_role: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    assigned_rm: Mapped[str] = mapped_column(String(128), nullable=False, default="Sarah Jenkins")
    facility_value: Mapped[str] = mapped_column(String(64), nullable=False, default="£25,000,000")
    relationship_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target_deadline_label: Mapped[str] = mapped_column(
        String(64), nullable=False, default="November 1st"
    )

    # Draft & Critic workflow state
    current_draft_subject: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_draft_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    critic_passed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    critic_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    critic_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    critic_checks_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    workflow_iterations: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    audit_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    documents: Mapped[List["MissingDocument"]] = relationship(
        back_populates="kyc_case",
        cascade="all, delete-orphan",
        order_by="MissingDocument.id",
    )
    actions: Mapped[List["AgentAction"]] = relationship(
        back_populates="kyc_case",
        cascade="all, delete-orphan",
        order_by="AgentAction.timestamp.desc()",
    )


class MissingDocument(Base):
    """KYC checklist document belonging to a case."""

    __tablename__ = "missing_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("kyc_cases.id", ondelete="CASCADE"), nullable=False
    )
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="Missing"
    )  # Missing | Received | Verified
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    requirement_meta: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    assigned_to_or_verifier: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    doc_code: Mapped[str] = mapped_column(String(64), nullable=False, default="")

    kyc_case: Mapped["KycCase"] = relationship(back_populates="documents")


class AgentAction(Base):
    """Telemetry log of agent and RM actions for the COO Executive Dashboard."""

    __tablename__ = "agent_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("kyc_cases.id", ondelete="CASCADE"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # Draft_Generated | Critic_Rejected | RM_Approved
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    actor: Mapped[str] = mapped_column(String(128), nullable=False, default="ChaseZero Agent")
    details: Mapped[str] = mapped_column(Text, nullable=False, default="")

    kyc_case: Mapped["KycCase"] = relationship(back_populates="actions")
