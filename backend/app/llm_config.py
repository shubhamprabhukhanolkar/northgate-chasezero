"""Environment (.env) loader and multi-provider LLM factory for LangGraph agents."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Any, Optional

from dotenv import dotenv_values

from app.paths import APP_DIR, ENV_CANDIDATES


@dataclass
class LlmStatus:
    configured: bool
    provider: str
    model: str
    env_file: str


def load_env_files() -> str:
    """Load non-empty keys from .env in priority order (APP_DIR/.env highest)."""
    winning_path = ""
    # Apply lowest-priority candidate first so highest-priority candidate wins
    for candidate in reversed(ENV_CANDIDATES):
        if candidate.exists():
            winning_path = str(candidate)
            values = dotenv_values(candidate)
            for key, val in values.items():
                if val is not None and val.strip() != "":
                    os.environ[key] = val.strip()
    if not winning_path:
        winning_path = str(APP_DIR / ".env")
    return winning_path


ACTIVE_ENV_FILE = load_env_files()


def reload_env_files() -> str:
    """Reload .env from disk (e.g. if user edits .env while server is running)."""
    global ACTIVE_ENV_FILE
    ACTIVE_ENV_FILE = load_env_files()
    return ACTIVE_ENV_FILE


def get_llm_status() -> LlmStatus:
    """Return current LLM configuration status without exposing secret keys."""
    reload_env_files()
    pref = os.getenv("LLM_PROVIDER", "auto").strip().lower()

    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    openai_base = os.getenv("OPENAI_BASE_URL", "").strip()
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    google_key = (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()

    if pref in ("openai", "openai_compatible") and (openai_key or openai_base):
        return LlmStatus(
            configured=True,
            provider="openai_compatible" if openai_base else "openai",
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini",
            env_file=ACTIVE_ENV_FILE,
        )
    if pref == "anthropic" and anthropic_key:
        return LlmStatus(
            configured=True,
            provider="anthropic",
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest").strip()
            or "claude-3-5-sonnet-latest",
            env_file=ACTIVE_ENV_FILE,
        )
    if pref in ("google", "gemini") and google_key:
        return LlmStatus(
            configured=True,
            provider="google",
            model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip() or "gemini-3.8-flash",
            env_file=ACTIVE_ENV_FILE,
        )

    # Auto-detect order
    if openai_key or openai_base:
        return LlmStatus(
            configured=True,
            provider="openai_compatible" if openai_base else "openai",
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini",
            env_file=ACTIVE_ENV_FILE,
        )
    if anthropic_key:
        return LlmStatus(
            configured=True,
            provider="anthropic",
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest").strip()
            or "claude-3-5-sonnet-latest",
            env_file=ACTIVE_ENV_FILE,
        )
    if google_key:
        return LlmStatus(
            configured=True,
            provider="google",
            model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip() or "gemini-3.8-flash",
            env_file=ACTIVE_ENV_FILE,
        )

    return LlmStatus(
        configured=False,
        provider="deterministic-fallback",
        model="ChaseZero-Grounded-Engine",
        env_file=ACTIVE_ENV_FILE,
    )


def get_chat_model(temperature: float = 0.2) -> tuple[Optional[Any], LlmStatus]:
    """Instantiate the configured LangChain ChatModel, or (None, status) if unconfigured."""
    status = get_llm_status()
    if not status.configured:
        return None, status

    if status.provider in ("openai", "openai_compatible"):
        from langchain_openai import ChatOpenAI

        api_key = os.getenv("OPENAI_API_KEY", "").strip() or "ollama"
        base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
        llm = ChatOpenAI(
            model=status.model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            streaming=True,
            timeout=15.0,
            max_retries=1,
        )
        return llm, status

    if status.provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        llm = ChatAnthropic(
            model=status.model,
            api_key=os.getenv("ANTHROPIC_API_KEY", "").strip(),
            temperature=temperature,
            streaming=True,
            timeout=15.0,
            max_retries=1,
        )
        return llm, status

    if status.provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()
        llm = ChatGoogleGenerativeAI(
            model=status.model,
            google_api_key=api_key,
            temperature=temperature,
            timeout=15.0,
            max_retries=1,
            thinking_budget=0,
        )
        return llm, status

    return None, status
