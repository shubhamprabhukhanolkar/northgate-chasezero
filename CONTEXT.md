# ChaseZero — Session Context & Handoff (`CONTEXT.md`)

This file captures the complete architecture, verified state, GCP discovery results, and pending next steps from our Antigravity build session so you can clone this repository on another machine and resume seamlessly.

---

## 1. Project Summary
**Northgate ChaseZero** is a functional multi-agent AI proto-demo automating KYC document chasing for **Northgate Bank**.

### Tech Stack
- **Backend**: Python 3.12+ managed via `uv`, FastAPI (REST + SSE), Async SQLAlchemy 2.0 + SQLite, LangGraph (`StateGraph`), multi-provider LangChain models (`openai`, `anthropic`, `google`).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, `lucide-react`, `zustand`.
- **UI/UX Source**: Translated from the 6 screens and design tokens in `design/` (`phantom_design_system/DESIGN.md`), including `.node-active-glow` / `.node-reject-glow` animations and Web Audio telemetry chimes (`frontend/src/utils/audio.ts`).

---

## 2. Repository Map
- **`ChaseZero.bat`** — Single-file Windows launcher (creates `.env` from `.env.example` if missing, syncs `backend/.venv` via `uv`, builds `frontend/dist` if missing, launches unified server on `http://127.0.0.1:8000`, opens browser).
- **`start-dev.ps1`** — Launches separate `uvicorn` (8000) and Vite HMR (5173) dev servers.
- **`.env.example`** — Template for LLM API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_MODEL=gemini-3.8-flash`). *(Actual `.env` is excluded via `.gitignore`.)*
- **`backend/app/`**:
  - `models.py`: SQLite tables `kyc_cases` (`Missing_Docs`, `Draft_Ready`, `Completed`), `missing_documents` (`Missing`, `Received`, `Verified`), and `agent_actions` (`Draft_Generated`, `Critic_Rejected`, `RM_Approved`).
  - `seed.py`: Seeds 8 Northgate Bank KYC cases (5 breaching the 3-day SLA) and baseline `agent_actions` telemetry.
  - `llm_config.py`: Loads non-empty keys from `.env` (`APP_DIR/.env` -> root `.env`) and instantiates OpenAI, OpenAI-compatible/Ollama, Anthropic, or Google Gemini (`gemini-3.8-flash`, `thinking_budget=0`, `timeout=15s`, `max_retries=1`).
  - `agent_graph.py`: LangGraph `StateGraph` (`orchestrator` -> `drafter` -> `critic` with conditional edge routing back to `drafter` if compliance fails). Falls back cleanly to a deterministic grounded synthesizer if no key is set or an API call times out/fails.
  - `main.py`: FastAPI endpoints (`/api/health`, `/api/settings/reload-env`, `/api/cases`, `/api/cases/{id}`, `/api/cases/{id}/note`, `/api/cases/{id}/documents/{doc_id}/toggle`, `/api/cases/{id}/workflow/stream` SSE, `/api/cases/{id}/workflow/run`, `/api/cases/{id}/critic/rescan`, `/api/cases/{id}/draft/tone`, `/api/cases/{id}/approve`, `/api/cases/{id}/reset`, `/api/actions`, `/api/dashboard/metrics`) + static serving of `frontend/dist`.
  - `paths.py`: Resolves `CHASEZERO_DB_PATH` and `CHASEZERO_FRONTEND_DIR` env overrides (used in Docker / Cloud Run).
  - `run_exe.py`: Unified launcher entry point used by `ChaseZero.bat`.
- **`frontend/src/`**:
  - `views/OrchestratorInbox.tsx`
  - `views/CaseTracker.tsx`
  - `views/DraftingAgentView.tsx`
  - `views/CriticAgentView.tsx`
  - `views/HitlReviewView.tsx`
  - `views/ExecutiveDashboard.tsx`
- **Cloud & CI/CD**:
  - `Dockerfile`, `.dockerignore`, `.gcloudignore`
  - `.github/workflows/deploy-cloudrun.yml` (CI tests + frontend build -> Artifact Registry `northgate-repo` in `asia-south1` -> Cloud Run deploy `northgate-chasezero` via `GCP_SA_KEY` + `$GITHUB_STEP_SUMMARY`)
  - `scripts/setup-gcp-cicd.ps1`, `scripts/setup-gcp-cicd.sh` (alternative Workload Identity Federation bootstrap scripts)
  - `DEPLOYMENT.md`

---

## 3. Verified Checks
- Frontend production build (`tsc -b && vite build`): **passed**.
- Backend workflow & SSE integration tests (`backend/tests/test_workflow.py`, `backend/tests/test_sse.py`): **passed**.
- `ChaseZero.bat --no-browser --port 8766` live probe: **passed** (`HTTP 200` on `/`, `8` cases, `5` breached, LangGraph status `Draft_Ready`).
- `.github/workflows/deploy-cloudrun.yml` YAML validation and `scripts/setup-gcp-cicd.ps1` PowerShell AST validation: **passed**.
- Note: Docker image build and live Cloud Run deploy have **not** been executed yet (`docker` is not installed locally and GCP API enablement awaits user approval).

---

## 4. Discovered GCP Environment State (Prior Machine)
- Authenticated `gcloud` account: `gcp.niituser34@slabspro.online`
- Organization: `slabspro.online` (`organizations/234853310318`)
- Accessible active GCP projects:
  1. **`slabspro-slabsuser37`** (Project Number `424664263792`) — Recommended target; currently has core APIs (`storage`, `logging`, `monitoring`, `bigquery`, `datastore`, `billingbudgets`), while `run.googleapis.com`, `cloudbuild.googleapis.com`, and `artifactregistry.googleapis.com` are **not enabled yet**.
  2. **`gen-lang-client-0778936265`** (`Default Gemini Project`, `406484465702`) — Only `generativelanguage.googleapis.com` enabled.

---

## 5. How to Resume on Your New Machine
1. **Clone & configure `.env`**:
   ```powershell
   git clone <YOUR_REPO_URL>
   cd <REPO_DIR>
   Copy-Item .env.example .env
   # Edit .env and add GOOGLE_API_KEY (or OPENAI_API_KEY / ANTHROPIC_API_KEY)
   ```
2. **Run locally**:
   Double-click `ChaseZero.bat` (or run `.\ChaseZero.bat` in PowerShell).
3. **Deploy to Google Cloud Run & Enable GitHub Actions CI/CD**:
   - Install Google Cloud CLI (`gcloud`) and run `gcloud auth login`.
   - Default workflow targets region `asia-south1`, Artifact Registry repository `northgate-repo`, and Cloud Run service `northgate-chasezero` on `slabspro-slabsuser37` (once `run.googleapis.com`, `cloudbuild.googleapis.com`, and `artifactregistry.googleapis.com` are enabled).
   - Either deploy directly via `gcloud run deploy northgate-chasezero --source . --region asia-south1 --project slabspro-slabsuser37` (see `DEPLOYMENT.md`), or configure GitHub Actions Secret `GCP_SA_KEY` (and optional `GOOGLE_API_KEY` / `GCP_REGION`) so pushes to `main` deploy automatically.
