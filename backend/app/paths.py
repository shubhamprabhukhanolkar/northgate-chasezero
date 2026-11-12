"""Runtime path resolution supporting source dev mode, Docker/Cloud Run, and PyInstaller."""

import os
from pathlib import Path
import sys


def is_frozen() -> bool:
    """Return True when running inside a PyInstaller bundle."""
    return bool(getattr(sys, "frozen", False))


def get_bundle_dir() -> Path:
    """Return directory containing bundled read-only assets (e.g. frontend_dist)."""
    if is_frozen():
        return Path(getattr(sys, "_MEIPASS"))
    return Path(__file__).resolve().parent.parent.parent


def get_app_dir() -> Path:
    """Return writable directory for SQLite DB and user .env file."""
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


APP_DIR = get_app_dir()
BUNDLE_DIR = get_bundle_dir()

DB_PATH = Path(os.getenv("CHASEZERO_DB_PATH", str(APP_DIR / "chasezero.db")))

FRONTEND_DIST_DIR = Path(
    os.getenv(
        "CHASEZERO_FRONTEND_DIR",
        str(BUNDLE_DIR / "frontend_dist" if is_frozen() else BUNDLE_DIR / "frontend" / "dist"),
    )
)

ENV_CANDIDATES = [
    APP_DIR / ".env",
    APP_DIR.parent / ".env",
    BUNDLE_DIR / ".env",
]
