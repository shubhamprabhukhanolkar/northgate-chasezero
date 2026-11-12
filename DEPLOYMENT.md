# Deploying Northgate ChaseZero to Google Cloud Run

ChaseZero is packaged as a single container (`Dockerfile` at the repo root) that builds the React/Vite UI and serves both the UI and the FastAPI + LangGraph backend on port `8080`.

---

## Option 1: Direct Deploy from Your CLI (`gcloud run deploy --source`)

Prerequisites:
- Google Cloud CLI (`gcloud`) installed and logged in (`gcloud auth login`)
- Target GCP project with billing linked and Cloud Run / Cloud Build / Artifact Registry APIs enabled:
  `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`

Run from the repository root:

```bash
gcloud config set project YOUR_GCP_PROJECT_ID --quiet

gcloud run deploy northgate-chasezero \
  --source . \
  --region asia-south1 \
  --project YOUR_GCP_PROJECT_ID \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --quiet \
  --set-env-vars "ENVIRONMENT=production,LLM_PROVIDER=auto,GEMINI_MODEL=gemini-3.8-flash,CHASEZERO_DB_PATH=/tmp/chasezero.db"
```

If you want live LLM generation on Cloud Run instead of the deterministic fallback, also add `GOOGLE_API_KEY=...` (or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`), or store it in Secret Manager (`--set-secrets`).

---

## Option 2: Automated CI/CD via GitHub Actions

`.github/workflows/deploy-cloudrun.yml` runs on every push or PR to `main` (plus manual `workflow_dispatch`):
1. **`test` job**: Syncs `backend/` with `uv sync --extra dev`, runs `uv run pytest -v`, and builds `./frontend` (`npm ci || npm install && npm run build`).
2. **`deploy` job** (on `main` pushes / manual runs): Authenticates with `GCP_SA_KEY`, ensures Artifact Registry Docker repository `northgate-repo` exists in `asia-south1`, builds and pushes the root `Dockerfile` image, deploys Cloud Run service `northgate-chasezero`, and posts the live endpoint table to `$GITHUB_STEP_SUMMARY`.

### Required GitHub Repository Configuration
Go to **GitHub Repo -> Settings -> Secrets and variables -> Actions**:

- **Secrets**
  - `GCP_SA_KEY` — Service account JSON key with `roles/run.admin`, `roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser` (`google-github-actions/auth@v2` reads the Project ID automatically from this JSON key)
  - `GOOGLE_API_KEY` *(optional)* — Gemini API key (`GEMINI_MODEL=gemini-3.8-flash`)
  - `OPENAI_API_KEY` *(optional)* — OpenAI API key
  - `ANTHROPIC_API_KEY` *(optional)* — Anthropic API key
- **Variables *(optional overrides)***
  - `GCP_REGION` — Defaults to `asia-south1` if unset

> **Note:** On Cloud Run, `/tmp/chasezero.db` is ephemeral per container instance (`--min-instances 0`, `--max-instances 5`), so seeded Northgate Bank demo data resets cleanly on cold starts.
