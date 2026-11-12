<#
.SYNOPSIS
    Beginner-friendly 1-time GCP & GitHub Actions setup script for ChaseZero on Cloud Run.
.DESCRIPTION
    Creates Artifact Registry repo, enables required GCP APIs, configures Workload Identity
    Federation for GitHub Actions (keyless CI/CD), and optionally deploys immediately.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [string]$GitHubRepo, # format: "username/repo-name"

    [string]$Region = "us-central1",

    [switch]$DeployNow
)

$ErrorActionPreference = "Stop"

Write-Host "==> 1/6 Setting active GCP project to $ProjectId..." -ForegroundColor Cyan
gcloud config set project $ProjectId

Write-Host "==> 2/6 Enabling Cloud Run, Artifact Registry, Cloud Build, and IAM APIs..." -ForegroundColor Cyan
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    iam.googleapis.com `
    iamcredentials.googleapis.com `
    --project=$ProjectId

function Test-GcloudResource {
    param([scriptblock]$Command)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $Command *> $null
    $ok = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prev
    return $ok
}

Write-Host "==> 3/6 Creating Artifact Registry Docker repository 'chasezero'..." -ForegroundColor Cyan
if (-not (Test-GcloudResource { gcloud artifacts repositories describe chasezero --location=$Region --project=$ProjectId })) {
    gcloud artifacts repositories create chasezero `
        --repository-format=docker `
        --location=$Region `
        --description="ChaseZero KYC container images" `
        --project=$ProjectId
}

Write-Host "==> 4/6 Creating deployer Service Account & IAM roles..." -ForegroundColor Cyan
$saName = "chasezero-deployer"
$saEmail = "$saName@$ProjectId.iam.gserviceaccount.com"
if (-not (Test-GcloudResource { gcloud iam service-accounts describe $saEmail --project=$ProjectId })) {
    gcloud iam service-accounts create $saName `
        --display-name="ChaseZero GitHub Actions Deployer" `
        --project=$ProjectId
}

foreach ($role in @("roles/run.admin", "roles/artifactregistry.writer", "roles/iam.serviceAccountUser")) {
    gcloud projects add-iam-policy-binding $ProjectId `
        --member="serviceAccount:$saEmail" `
        --role=$role | Out-Null
}

Write-Host "==> 5/6 Configuring keyless GitHub OIDC Workload Identity Federation..." -ForegroundColor Cyan
$poolId = "github-actions-pool"
$providerId = "github-oidc"

if (-not (Test-GcloudResource { gcloud iam workload-identity-pools describe $poolId --location="global" --project=$ProjectId })) {
    gcloud iam workload-identity-pools create $poolId `
        --location="global" `
        --display-name="GitHub Actions Pool" `
        --project=$ProjectId
}

if (-not (Test-GcloudResource { gcloud iam workload-identity-pools providers describe $providerId --workload-identity-pool=$poolId --location="global" --project=$ProjectId })) {
    gcloud iam workload-identity-pools providers create-oidc $providerId `
        --workload-identity-pool=$poolId `
        --location="global" `
        --issuer-uri="https://token.actions.githubusercontent.com" `
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
        --attribute-condition="assertion.repository=='$GitHubRepo'" `
        --project=$ProjectId
}

$projectNumber = (gcloud projects describe $ProjectId --format="value(projectNumber)").Trim()
$wifProvider = "projects/$projectNumber/locations/global/workloadIdentityPools/$poolId/providers/$providerId"

gcloud iam service-accounts add-iam-policy-binding $saEmail `
    --project=$ProjectId `
    --role="roles/iam.workloadIdentityUser" `
    --member="principalSet://iam.googleapis.com/projects/$projectNumber/locations/global/workloadIdentityPools/$poolId/attribute.repository/$GitHubRepo" | Out-Null

Write-Host ""
Write-Host "==> 6/6 GCP Setup Complete!" -ForegroundColor Green

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    Write-Host "==> Detected GitHub CLI (gh). Syncing Actions variables and secrets to $GitHubRepo..." -ForegroundColor Cyan
    gh variable set GCP_PROJECT_ID --body $ProjectId --repo $GitHubRepo
    gh variable set GCP_REGION --body $Region --repo $GitHubRepo
    gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body $wifProvider --repo $GitHubRepo
    gh secret set GCP_SERVICE_ACCOUNT --body $saEmail --repo $GitHubRepo

    $envFile = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"
    if (Test-Path $envFile) {
        $googleKeyLine = Get-Content $envFile | Where-Object { $_ -match "^GOOGLE_API_KEY=(.+)$" } | Select-Object -First 1
        if ($googleKeyLine -and $Matches[1].Trim()) {
            gh secret set GOOGLE_API_KEY --body $Matches[1].Trim() --repo $GitHubRepo
            Write-Host "    Synced GOOGLE_API_KEY from .env to GitHub Secrets." -ForegroundColor Green
        }
    }
} else {
    Write-Host "Add these to GitHub Repo -> Settings -> Secrets and variables -> Actions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [Variables]" -ForegroundColor Yellow
    Write-Host "    GCP_PROJECT_ID = $ProjectId"
    Write-Host "    GCP_REGION     = $Region"
    Write-Host ""
    Write-Host "  [Secrets]" -ForegroundColor Yellow
    Write-Host "    GCP_WORKLOAD_IDENTITY_PROVIDER = $wifProvider"
    Write-Host "    GCP_SERVICE_ACCOUNT            = $saEmail"
    Write-Host "    GOOGLE_API_KEY                 = <your Gemini API key>"
}
Write-Host ""

if ($DeployNow) {
    Write-Host "==> Running immediate Cloud Run deploy from source..." -ForegroundColor Cyan
    gcloud run deploy chasezero `
        --source (Split-Path -Parent $PSScriptRoot) `
        --region $Region `
        --allow-unauthenticated `
        --port 8080 `
        --memory 1Gi `
        --project $ProjectId
}
