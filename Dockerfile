# Stage 1: Build React 18 + Vite + Tailwind CSS v4 frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python 3.12 + uv + FastAPI + LangGraph runtime
FROM python:3.12-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CHASEZERO_FRONTEND_DIR=/app/frontend_dist \
    CHASEZERO_DB_PATH=/tmp/chasezero.db

COPY backend/pyproject.toml backend/README.md ./
RUN uv pip install --system --no-cache -r pyproject.toml

COPY backend/app ./app
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist

EXPOSE 8080

# Cloud Run injects $PORT (default 8080)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
