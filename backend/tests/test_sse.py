"""Tests for SSE LangGraph streaming, Critic rescan, tone tuning, and document toggle."""

import json
import os
from pathlib import Path
import tempfile

os.environ.setdefault("CHASEZERO_DB_PATH", str(Path(tempfile.gettempdir()) / "chasezero_test.db"))

from fastapi.testclient import TestClient

from app.main import app


def test_sse_workflow_stream_and_auxiliary_endpoints():
    with TestClient(app) as client:
        # Reset case 1 so we test a fresh SLA-breached run
        reset_res = client.post("/api/cases/1/reset")
        assert reset_res.status_code == 200
        assert reset_res.json()["status"] == "Missing_Docs"

        # Stream LangGraph workflow with critic rejection enabled
        events = []
        with client.stream(
            "GET",
            "/api/cases/1/workflow/stream?simulate_critic_rejection=true&tone=institutional",
        ) as response:
            assert response.status_code == 200
            for line in response.iter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[6:]))

        event_types = [e["type"] for e in events]
        assert "node_start" in event_types
        assert "orchestrator_result" in event_types
        assert "draft_token" in event_types
        assert "draft_complete" in event_types
        assert "critic_result" in event_types
        assert "workflow_complete" in event_types

        critic_events = [e for e in events if e["type"] == "critic_result"]
        assert len(critic_events) == 2
        assert critic_events[0]["passed"] is False
        assert critic_events[0]["routing_to"] == "drafter"
        assert critic_events[1]["passed"] is True
        assert critic_events[1]["routing_to"] == "end"

        # Test tone adjustment
        tone_res = client.post("/api/cases/1/draft/tone", json={"tone": "urgent"})
        assert tone_res.status_code == 200
        assert "Time-Sensitive Onboarding Update" in tone_res.json()["current_draft_body"]

        # Test manual critic hallucination simulation failure
        fail_res = client.post(
            "/api/cases/1/critic/rescan",
            json={"simulate_failure": True},
        )
        assert fail_res.status_code == 200
        assert fail_res.json()["critic_passed"] is False
        assert fail_res.json()["critic_score"] < 100

        # Test document status toggle
        docs = fail_res.json()["documents"]
        doc_id = docs[0]["id"]
        orig_status = docs[0]["status"]
        tog_res = client.post(f"/api/cases/1/documents/{doc_id}/toggle")
        assert tog_res.status_code == 200
        new_doc = next(d for d in tog_res.json()["documents"] if d["id"] == doc_id)
        assert new_doc["status"] != orig_status

        # Test health & reload-env endpoint
        health_res = client.get("/api/health")
        assert health_res.status_code == 200
        assert "llm_configured" in health_res.json()
        assert "env_file" in health_res.json()

        reload_res = client.post("/api/settings/reload-env")
        assert reload_res.status_code == 200
        assert "llm_provider" in reload_res.json()

        # Test PATCH /api/cases/1/note
        note_res = client.patch(
            "/api/cases/1/note",
            json={"relationship_notes": "Verified board ratification deadline with Alistair."},
        )
        assert note_res.status_code == 200
        assert "Verified board ratification deadline" in note_res.json()["relationship_notes"]

        # Cycle doc back and reset case 1 cleanly for demo readiness
        client.post(f"/api/cases/1/documents/{doc_id}/toggle")
        client.post(f"/api/cases/1/documents/{doc_id}/toggle")
        client.post("/api/cases/1/reset")
