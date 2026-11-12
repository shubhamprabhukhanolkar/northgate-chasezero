# Northgate ChaseZero — Autonomous Enterprise KYC Chasing Platform

Functional multi-agent AI proto-demo automating KYC document chasing for **Northgate Bank**, built with **FastAPI**, **Async SQLAlchemy 2.0 + SQLite**, **LangGraph (`StateGraph`)**, **React 18 + Vite**, **Tailwind CSS v4**, **lucide-react**, and **Zustand**.

## Single Executable Launcher (`ChaseZero.bat`)

Double-click **[ChaseZero.bat](ChaseZero.bat)** (or run `.\ChaseZero.bat` in PowerShell/CMD) to launch the complete application — FastAPI, LangGraph, SQLite, and the React UI — on `http://127.0.0.1:8000` and open your browser automatically.

## LLM API Keys (`.env`)

Put your LLM API key in **[.env](.env)** at the project root (`c:\Users\v69-labuser445619\Desktop\prototype\.env`):

- **OpenAI / OpenAI-compatible (Ollama, OpenRouter, Groq)**: `OPENAI_API_KEY`, `OPENAI_MODEL`, optional `OPENAI_BASE_URL`
- **Anthropic Claude**: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- **Google Gemini**: `GOOGLE_API_KEY`, `GEMINI_MODEL`

When any key is present, both the LangGraph **Drafter Node** (live token streaming over SSE) and **Critic Node** (compliance audit) execute against that LLM. Without a key, ChaseZero uses a deterministic grounded synthesizer so the demo works offline. You can hot-reload `.env` anytime via the refresh button in the **AI Drafting Agent** view without restarting.
