# SignalPost — LinkedIn Content Agent

A source-grounded LinkedIn content assistant for a full-stack developer and cybersecurity student. It
discovers technical news, scores and deduplicates it, generates drafts grounded in the source material,
reviews every claim against that source, and supports approval, scheduling, and publishing.

The hard rule: **the product never invents personal experience, achievements, statistics, quotations, or
facts.** A draft may only claim what its cited source supports. LinkedIn browser automation and
unofficial posting are prohibited — publishing is manual copy/paste, or the official Posts API behind a
feature flag.

## Status

Early. The interface is complete and the discovery and generation APIs work against live providers, but
**nothing is persisted yet** — the seven dashboard pages read fixtures from `src/lib/mock-data.ts`, and
every action resets on refresh. The database migration exists but has not been applied.

| Area | State |
| --- | --- |
| Dashboard UI (8 routes) | Complete, fixture-backed |
| Discovery and scoring (`/api/news`) | Working against live sources |
| AI generation (`/api/generate`) | Working, but emits one version instead of three |
| Database persistence | Not wired; migration unapplied |
| Auth, extraction, scheduling, publishing, notifications | Not started |

## Requirements

- Node.js 20+ (developed on 24.16.0)
- npm 10+ (developed on 11.17.0)

No credentials are needed to run the interface.

## Getting started

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Then open http://localhost:3000. With `.env` left blank, the app runs entirely on local fixtures.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config, next/core-web-vitals) |

## How it works

```
                 ┌───────────────────────────────────────────┐
  Hacker News ──▶│  /api/news                                │
  dev.to ───────▶│  fetch in parallel → normalize → dedupe   │──▶ top 12 candidates
  RSS feeds ────▶│  → score → sort                           │
                 └───────────────────────────────────────────┘
                                     │
                                     ▼
                 ┌───────────────────────────────────────────┐
  Gemini ───────▶│  /api/generate                            │──▶ one grounded draft
  OpenRouter ───▶│  prompt → structured JSON → Zod validate  │    + provider attempt log
  (fallbacks)    │  retry → fall through on failure          │
                 └───────────────────────────────────────────┘
```

**Discovery** (`src/lib/discovery.ts`) fetches every source in parallel with a 10s timeout, normalizes
each item into a candidate, drops anything older than the freshness window, removes duplicates by content
fingerprint, ranks by weighted score, and returns the top 12. Every link passes through the SSRF guard
before it is accepted.

**Scoring** (`src/lib/scoring.ts`) is a weighted 0–100 total over relevance (30), freshness (20), value
(20), discussion (15), and credibility (15). The weights must total exactly 100 and the function throws
otherwise. Freshness decays linearly to zero across the article-age window.

**Generation** (`src/lib/ai/provider.ts` and `adapters.ts`) tries each configured provider in order,
twice per provider, with a per-attempt timeout. HTTP 400/401/403 are treated as permanent and abort that
provider immediately; 429 and 5xx are retryable. Responses are parsed as JSON and validated against a Zod
schema before being returned, so a malformed model response falls through to the next provider rather than
reaching the UI.

## Project structure

```
src/
  app/
    layout.tsx              Root layout plus the no-flash theme script
    page.tsx                Client boundary re-exporting the dashboard
    globals.css             Tailwind 4 entry, theme variables, class-based dark variant
    ideas|drafts|review|calendar|published|analytics|settings/
      page.tsx              Two-line client boundaries re-exporting their component
    api/
      news/route.ts         GET  live discovery
      generate/route.ts     POST grounded draft generation
  components/
    app-shell.tsx           Sidebar, mobile nav, header, tooltip provider, toaster
    *-page.tsx              One component per route
    ui/                     badge, button, card, dialog, score-bar, select, tabs,
                            theme-toggle, tooltip
  lib/
    ai/provider.ts          Provider interface, fallback, error classification
    ai/adapters.ts          Gemini and OpenRouter HTTP adapters
    discovery.ts            Fetch, normalize, dedupe, score
    scoring.ts              Weighted scoring and hashes
    security/safe-url.ts    SSRF guard
    supabase/server.ts      Service-role client (not yet called)
    env.ts                  Zod-validated environment and demo-mode detection
    mock-data.ts            Fixtures backing the seven UI pages
    types.ts                Shared types, aligned to the migration column names
supabase/migrations/        Postgres schema
tests/unit/                 Vitest suites
```

Conventions: App Router with a client boundary at every route, shared UI in `src/components`, domain
logic in `src/lib`, the `@/*` path alias mapping to `./src/*`, and strict TypeScript.

## Environment variables

Server secrets stay server-side; only `NEXT_PUBLIC_*` values reach the browser. See `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | for live data | Supabase project URL, with no `/rest/v1/` suffix |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for auth | Public anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | for live data | Server-only key for background writes |
| `CRON_SECRET` | for cron | Bearer secret guarding the scheduled job endpoint, min 24 characters |
| `APP_URL` | no | Base URL, defaults to `http://localhost:3000` |
| `GEMINI_API_KEY` | for generation | Primary provider |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.5-flash` |
| `OPENROUTER_API_KEY` | no | Enables the three OpenRouter fallbacks |
| `OPENROUTER_MODEL_1..3` | no | Fallback model ids, tried in order |
| `RESEND_API_KEY`, `RESEND_FROM` | no | Approval email notifications |
| `LINKEDIN_API_ENABLED` | no | Must remain `false` until OAuth is configured |
| `LINKEDIN_CLIENT_ID`, `_SECRET`, `_REDIRECT_URI` | no | Official Posts API credentials |

`src/lib/env.ts` validates all of these with Zod and derives `isDemoMode`. Leave the Supabase values
blank to force demo mode.

## Database setup

The schema in `supabase/migrations/202609200001_initial_schema.sql` has **not been applied**. To apply it:

1. Open the Supabase dashboard for your project.
2. Go to **SQL Editor → New query**.
3. Paste the entire migration file and run it.

It creates 15 tables, four enums, supporting indexes, row-level security policies for 11 of those tables,
and a trigger that creates a `users` row plus default `user_settings` for every new auth user.

Caveat: `candidate_scores`, `article_extractions`, `draft_versions`, and `draft_reviews` do **not** have
RLS enabled yet. Add policies before storing real data.

## Content rules

These are encoded in the generation prompt and are not negotiable:

- Never invent personal experience, achievements, statistics, quotations, or facts.
- Only claim what the cited source supports, and frame the post as what the author learned from it.
- No hype and no emoji; thoughtful, practical, professional tone.
- 120–200 words, ending in one genuine discussion question.
- No LinkedIn browser automation and no unofficial posting.

## Testing

```bash
npm test
```

Six unit tests across three suites: weighted scoring and hashing, SSRF rejection, and provider fallback.
There are no API-route, component, or end-to-end tests yet.

## Known limitations

- Nothing is persisted. Discovery results and generated drafts live in React state and are lost on refresh.
- No authentication: no sign-in/sign-up screens, no `middleware.ts`, no session handling.
- `/api/generate` returns a single `educational` draft. The three-version requirement
  (educational / opinion / discussion) and the separate review pass are not implemented.
- No article extraction pipeline. `@mozilla/readability` and `jsdom` are installed but imported nowhere,
  so redirect and DNS-rebinding SSRF hardening is incomplete.
- Discovery hardcodes its feeds, its scoring inputs, and the 7-day freshness window instead of reading
  `sources` and `user_settings`.
- No cron, scheduling, pause enforcement, publication idempotency, email notifications, or LinkedIn
  publishing. `CRON_SECRET`, `RESEND_*`, and `LINKEDIN_*` are validated but unused.
- No rate limiting or caching on `/api/news` or `/api/generate`.
- `@radix-ui/react-dropdown-menu` is installed but unused.
- `NOTIFICATION_EMAIL` exists in `.env` but is not declared in `env.ts` or `.env.example`.

## Roadmap

1. Apply the migration, fix the anon key, and regenerate the Resend key.
2. Persist discovery output and drafts, replacing the fixture imports.
3. Emit three draft versions and add the structured review pass.
4. Add authentication and session middleware.
5. Build the extraction pipeline and the remaining write paths.
6. Add scheduling, cron protection, notifications, and manual publishing.
7. Add OAuth and Posts API support behind `LINKEDIN_API_ENABLED`.
8. Fill in the remaining tests and the deployment documentation.

## License

ISC




