#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Checking uv installation..."
uv --version

echo "==> Installing Python 3.12 & syncing dependencies..."
uv python install 3.12
uv sync --python 3.12

echo "==> Starting ChaseZero FastAPI server..."
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
