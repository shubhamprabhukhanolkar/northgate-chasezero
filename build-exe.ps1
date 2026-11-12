<#
.SYNOPSIS
    Builds the React production bundle and packages the entire ChaseZero stack
    (FastAPI + LangGraph + SQLite + React UI) into a single Windows executable: dist\ChaseZero.exe
#>
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$backendDir = Join-Path $root "backend"
$distOut = Join-Path $root "dist"

Write-Host "==> 1/3 Building React + Tailwind CSS v4 frontend..." -ForegroundColor Cyan
Push-Location $frontendDir
npm run build
Pop-Location

$frontendDist = Join-Path $frontendDir "dist"
if (-not (Test-Path (Join-Path $frontendDist "index.html"))) {
    throw "Frontend build missing index.html at $frontendDist"
}

Write-Host "==> 2/3 Packaging single-file ChaseZero.exe via PyInstaller..." -ForegroundColor Cyan
Push-Location $backendDir
$pyinstallerExe = Join-Path $backendDir ".venv\Scripts\pyinstaller.exe"
if (-not (Test-Path $pyinstallerExe)) {
    throw "PyInstaller not found at $pyinstallerExe. Run 'uv sync --extra build' inside backend\ first."
}

$workPath = Join-Path $backendDir "build_exe"
if (Test-Path $workPath) { Remove-Item $workPath -Recurse -Force }

& $pyinstallerExe `
    --noconfirm `
    --clean `
    --onefile `
    --name "ChaseZero" `
    --distpath $distOut `
    --workpath $workPath `
    --specpath $workPath `
    --paths $backendDir `
    --add-data "$frontendDist;frontend_dist" `
    --collect-all "langgraph" `
    --collect-all "langchain_core" `
    --collect-all "langchain_openai" `
    --collect-all "langchain_anthropic" `
    --collect-all "langchain_google_genai" `
    --collect-all "tiktoken_ext" `
    --hidden-import "aiosqlite" `
    --hidden-import "sqlite3" `
    --hidden-import "sqlalchemy.dialects.sqlite" `
    --hidden-import "sqlalchemy.dialects.sqlite.aiosqlite" `
    --hidden-import "uvicorn.logging" `
    --hidden-import "uvicorn.loops" `
    --hidden-import "uvicorn.loops.auto" `
    --hidden-import "uvicorn.protocols" `
    --hidden-import "uvicorn.protocols.http" `
    --hidden-import "uvicorn.protocols.http.auto" `
    --hidden-import "uvicorn.protocols.websockets" `
    --hidden-import "uvicorn.protocols.websockets.auto" `
    --hidden-import "uvicorn.lifespan" `
    --hidden-import "uvicorn.lifespan.on" `
    --hidden-import "dotenv" `
    (Join-Path $backendDir "run_exe.py")

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "PyInstaller failed with exit code $LASTEXITCODE"
}
Pop-Location

Write-Host "==> 3/3 Copying .env & .env.example alongside ChaseZero.exe..." -ForegroundColor Cyan
Copy-Item (Join-Path $root ".env.example") (Join-Path $distOut ".env.example") -Force
if ((Test-Path (Join-Path $root ".env")) -and -not (Test-Path (Join-Path $distOut ".env"))) {
    Copy-Item (Join-Path $root ".env") (Join-Path $distOut ".env") -Force
}

Write-Host "==> Build complete: $(Join-Path $distOut 'ChaseZero.exe')" -ForegroundColor Green
