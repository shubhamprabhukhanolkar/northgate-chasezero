<#
.SYNOPSIS
    Launches both the FastAPI LangGraph backend (port 8000) and the React Vite frontend (port 5173).
#>
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Starting ChaseZero FastAPI backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$backendProc = Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\backend'; uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
) -PassThru

Write-Host "Starting ChaseZero Vite frontend on http://localhost:5173 ..." -ForegroundColor Green
$frontendProc = Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\frontend'; npm run dev"
) -PassThru

Write-Host "ChaseZero launched! Backend PID: $($backendProc.Id), Frontend PID: $($frontendProc.Id)" -ForegroundColor Yellow
