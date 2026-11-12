<#
.SYNOPSIS
    Sets up the ChaseZero Python 3.12+ backend environment using uv and starts the FastAPI server.
#>
param(
    [switch]$RunServer
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Checking uv installation..." -ForegroundColor Cyan
uv --version

Write-Host "==> Ensuring Python 3.12 environment via uv..." -ForegroundColor Cyan
uv python install 3.12
uv sync --python 3.12

Write-Host "==> Verifying database & FastAPI imports..." -ForegroundColor Cyan
uv run python -c "import fastapi, sqlalchemy, langgraph, aiosqlite; print('Backend dependencies verified!')"

if ($RunServer) {
    Write-Host "==> Starting ChaseZero FastAPI server on http://127.0.0.1:8000 ..." -ForegroundColor Green
    uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
}
