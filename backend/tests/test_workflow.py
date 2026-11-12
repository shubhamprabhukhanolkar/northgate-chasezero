"""Integration tests for ChaseZero SQLite schema, FastAPI endpoints, and LangGraph StateGraph."""

import asyncio
import os
from pathlib import Path
import tempfile

os.environ.setdefault("CHASEZERO_DB_PATH", str(Path(tempfile.gettempdir()) / "chasezero_test.db"))

from fastapi.testclient import TestClient

from app.database import DB_PATH, engine
from app.main import app


def test_full_kyc_langgraph_and_hitl_workflow():
    # Use a fresh SQLite DB for deterministic verification
    asyncio.run(engine.dispose())
    if Path(DB_PATH).exists():
        Path(DB_PATH).unlink()

    with TestClient(app) as client:
        # 1. Health & Seeded Cases
        health = client.get("/api/health")
        assert health.status_code == 200
        assert int(health.json()["cases_loaded"]) >= 8

        inbox = client.get("/api/cases").json()
        assert inbox["sla_breached_count"] >= 3
        apex = next(c for c in inbox["cases"] if c["case_code"] == "NCZ-2024-8841")
        assert apex["sla_breached"] is True
        assert apex["status"] == "Missing_Docs"
        case_id = apex["id"]

        # 2. LangGraph Critic Rejection -> Drafter Retry Loop
        retry_res = client.post(
            f"/api/cases/{case_id}/workflow/run",
            json={"simulate_critic_rejection": True, "tone": "institutional"},
        )
        assert retry_res.status_code == 200
        retry_case = retry_res.json()
        assert retry_case["status"] == "Draft_Ready"
        assert retry_case["critic_passed"] is True
        assert retry_case["workflow_iterations"] == 2
        assert "Ultimate Beneficial Ownership" in retry_case["current_draft_body"]
        assert "Certified Trust Deed" in retry_case["current_draft_body"]

        action_types = [a["action_type"] for a in retry_case["actions"]]
        assert "Critic_Rejected" in action_types
        assert "Draft_Generated" in action_types

        # 3. HITL Approve & Send
        before_metrics = client.get("/api/dashboard/metrics").json()
        approve_res = client.post(
            f"/api/cases/{case_id}/approve",
            json={
                "subject": retry_case["current_draft_subject"],
                "body": retry_case["current_draft_body"],
                "notify_analyst": True,
                "actor": "Sarah Jenkins",
            },
        )
        assert approve_res.status_code == 200
        approved_payload = approve_res.json()
        assert approved_payload["case"]["status"] == "Completed"
        assert approved_payload["case"]["chase_round_count"] == apex["chase_round_count"] + 1

        # 4. COO Dashboard metrics reflect RM_Approved increment from agent_actions
        after_metrics = client.get("/api/dashboard/metrics").json()
        assert after_metrics["total_rm_approved"] == before_metrics["total_rm_approved"] + 1
        assert after_metrics["days_per_chase_round"] <= before_metrics["days_per_chase_round"]
