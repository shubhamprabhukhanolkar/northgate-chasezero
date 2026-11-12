#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <GCP_PROJECT_ID> <GITHUB_OWNER/REPO> [REGION]"
  exit 1
fi

PROJECT_ID="$1"
GITHUB_REPO="$2"
REGION="${3:-us-central1}"

gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  --project="$PROJECT_ID"

gcloud artifacts repositories describe chasezero --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud artifacts repositories create chasezero \
    --repository-format=docker \
    --location="$REGION" \
    --description="ChaseZero KYC container images" \
    --project="$PROJECT_ID"

SA_NAME="chasezero-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="ChaseZero GitHub Actions Deployer" \
    --project="$PROJECT_ID"

for role in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" >/dev/null
done

POOL_ID="github-actions-pool"
PROVIDER_ID="github-oidc"

gcloud iam workload-identity-pools describe "$POOL_ID" --location=global --project="$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --location=global \
    --display-name="GitHub Actions Pool" \
    --project="$PROJECT_ID"

gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --workload-identity-pool="$POOL_ID" --location=global --project="$PROJECT_ID" >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" \
    --location=global \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
    --project="$PROJECT_ID"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}" >/dev/null

echo ""
echo "Setup complete! Add these to GitHub Repo -> Settings -> Secrets and variables -> Actions:"
echo "  Variable GCP_PROJECT_ID                 = ${PROJECT_ID}"
echo "  Variable GCP_REGION                     = ${REGION}"
echo "  Secret   GCP_WORKLOAD_IDENTITY_PROVIDER = ${WIF_PROVIDER}"
echo "  Secret   GCP_SERVICE_ACCOUNT            = ${SA_EMAIL}"
echo "  Secret   GOOGLE_API_KEY                 = <your Gemini API key>"
