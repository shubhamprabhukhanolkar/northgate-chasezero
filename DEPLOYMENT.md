# Deploying ChaseZero to Google Cloud Run (Docker + GitHub Actions CI/CD)

This guide gets ChaseZero live on **Google Cloud Run** even if you have never used GCP before.

## What Was Generated
- **[Dockerfile](Dockerfile)** — Multi-stage container build (Node 22 builds React/Tailwind v4 -> Python 3.12 + `uv` serves FastAPI + LangGraph + UI on `$PORT`).
- **[.dockerignore](.dockerignore)** — Keeps local `.venv`, `node_modules`, `.env`, and SQLite files out of Docker images.
- **[.github/workflows/deploy-cloudrun.yml](.github/workflows/deploy-cloudrun.yml)** — Runs backend/frontend CI tests on every PR/push, then builds & pushes the Docker image to GCP Artifact Registry and deploys to Cloud Run on `main`.
- **[scripts/setup-gcp-cicd.ps1](scripts/setup-gcp-cicd.ps1)** (and [setup-gcp-cicd.sh](scripts/setup-gcp-cicd.sh)) — 1-time automated script that sets up GCP APIs, Artifact Registry, IAM, and keyless GitHub Actions authentication.

---

## Step 1: Install & Sign In to Google Cloud CLI
1. Install Google Cloud CLI (`gcloud`): https://cloud.google.com/sdk/docs/install
2. Open PowerShell and sign in:
   ```powershell
   gcloud auth login
   ```
3. Create (or pick) a GCP project with billing enabled:
   ```powershell
   gcloud projects list
   # Or create a new one:
   gcloud projects create chasezero-prod-demo --name="ChaseZero KYC"
   ```

## Step 2: Run the 1-Time GCP + GitHub CI/CD Bootstrap Script
Replace `<YOUR_PROJECT_ID>` and `<GITHUB_USER>/<REPO_NAME>`:
```powershell
.\scripts\setup-gcp-cicd.ps1 -ProjectId "<YOUR_PROJECT_ID>" -GitHubRepo "<GITHUB_USER>/<REPO_NAME>" -DeployNow
```
- `-DeployNow` immediately builds and deploys your app to Cloud Run right from your machine and prints your live `https://chasezero-....run.app` URL.
- The script also prints **2 GitHub Variables** (`GCP_PROJECT_ID`, `GCP_REGION`) and **3 GitHub Secrets** (`GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `GOOGLE_API_KEY`).

## Step 3: Enable Automated CI/CD on GitHub Push
In your GitHub repository:
1. Go to **Settings -> Secrets and variables -> Actions**.
2. Under **Variables**, add:
   - `GCP_PROJECT_ID`
   - `GCP_REGION` (e.g. `us-central1`)
3. Under **Secrets**, add:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_SERVICE_ACCOUNT`
   - `GOOGLE_API_KEY` (or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
4. Push to `main`:
   ```powershell
   git init
   git add .
   git commit -m "Deploy ChaseZero with Docker and Cloud Run CI/CD"
   git branch -M main
   git remote add origin https://github.com/<GITHUB_USER>/<REPO_NAME>.git
   git push -u origin main
   ```
Every push to `main` now runs tests, builds the Docker container, and deploys automatically to Google Cloud Run.
