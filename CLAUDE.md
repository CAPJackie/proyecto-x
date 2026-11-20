# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # http://localhost:3001
npm run validate  # lint + typecheck + build — final check
npm run format    # prettier (the edit hook already formats touched files)
```

Copy `.env.local.example` to `.env.local` and fill in `GROQ_API_KEY` before starting.

## Architecture

This is "Content Factory" — a 4-step AI pipeline that turns Google Trends data into digital product ideas. Single Next.js service; no sidecar.

**Pipeline steps (each triggered manually by the user):**

| Step | Route                | What it does                                                                                                                                       |
| ---- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `GET /api/trends`    | Fetches the Google `/trending/rss?geo=CO` RSS feed, parses `<title>` + `<ht:approx_traffic>` per item, returns top 10 keywords with numeric scores |
| 2    | `POST /api/rank`     | Pure math: normalizes scores 0–100, sorts and assigns rank numbers                                                                                 |
| 3    | `POST /api/classify` | Assigns Tier 1 (≥70), 2 (≥40), or 3 (<40) by normalizedScore                                                                                       |
| 4    | `POST /api/generate` | Calls Groq (`llama-3.1-8b-instant`) to generate a micro-product idea per keyword                                                                   |

State flows one-directionally through the UI: `rawTrends → rankedTrends → classified`. Each step feeds the next; re-running step 1 clears downstream state.

**Why RSS and not pytrends/the JSON API:** Google retired the `/trends/api/*` and `/trends/hottrends/*` endpoints in 2024 (all return 404). The `/trending/rss` feed is the only public surface that still works and already ships traffic numbers, so no follow-up scoring call is needed.

**Environment variables** (see `.env.local.example`):

- `GROQ_API_KEY` — from console.groq.com (free)

**Key dependencies:**

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4 (PostCSS-based, no `tailwind.config.js`)
- shadcn/ui components (`components/ui/`) backed by `radix-ui`
- `groq-sdk` for LLM calls
