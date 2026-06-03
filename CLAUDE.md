# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
# Next.js frontend (runs on http://localhost:3001)
npm run dev
npm run build
npm run lint

# Python FastAPI sidecar (runs on http://localhost:8000)
cd python && source ../venv/bin/activate && uvicorn main:app --reload
```

Both services must be running for the full pipeline to work. Copy `.env.local.example` to `.env.local` and fill in the values before starting.

## Architecture

This is "Content Factory" — a 4-step AI pipeline that turns Google Trends data into digital product ideas.

**Two-service architecture:**

- **Next.js 16 app** (`app/`) — frontend + API routes. All AI logic runs inside Next.js route handlers.
- **Python FastAPI sidecar** (`python/main.py`) — sole purpose is fetching Google Trends via `pytrends`. Next.js proxies to it; the Python service is not exposed to the browser.

**Pipeline steps (each triggered manually by the user):**

| Step | Route | What it does |
|------|-------|-------------|
| 1 | `GET /api/trends` | Proxies to Python service → returns top 10 trending keywords with scores |
| 2 | `POST /api/rank` | Pure math: normalizes scores 0–100, sorts and assigns rank numbers |
| 3 | `POST /api/classify` | Assigns Tier 1 (≥70), 2 (≥40), or 3 (<40) by normalizedScore |
| 4 | `POST /api/generate` | Calls Groq (`llama-3.1-8b-instant`) to generate a micro-product idea per keyword |

State flows one-directionally through the UI: `rawTrends → rankedTrends → classified`. Each step feeds the next; re-running step 1 clears downstream state.

**Environment variables** (see `.env.local.example`):
- `GROQ_API_KEY` — from console.groq.com (free)
- `PYTHON_SERVICE_URL` — defaults to `http://localhost:8000`

**Key dependencies:**
- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4 (PostCSS-based, no `tailwind.config.js`)
- shadcn/ui components (`components/ui/`) backed by `radix-ui`
- `groq-sdk` for LLM calls
- `pytrends` + `fastapi` + `uvicorn` in the Python venv
