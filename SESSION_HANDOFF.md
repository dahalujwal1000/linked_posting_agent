# SignalPost session handoff

Last updated: 2026-09-21 (Asia/Kathmandu) — revised after the dashboard UI pass.

## User goal

Build a production-ready, mobile-responsive AI LinkedIn Content Agent for a full-stack developer/cybersecurity. student. It should discover source material, score and deduplicate it, generate three source-grounded LinkedIn drafts, review claims and quality, support approval/editing/scheduling, notify by email, and optionally publish through LinkedIn's official API after explicit approval.

The product must never invent personal experience, achievements, statistics, quotations, or facts. LinkedIn browser automation and unofficial posting are prohibited.

## Chosen configuration

- Project: `C:\Users\Ujwal\Desktop\projects(026)\Linked_posting_agent`
- Package manager: npm
- Authentication: Supabase email/password
- Database and auth: Supabase
- Primary AI provider: Gemini
- AI fallback: OpenRouter
- Notifications: Resend email
- Default content: full-stack development, cybersecurity, AI tooling, and career learning
- Default timezone: Asia/Kathmandu
- LinkedIn official API: disabled until credentials are available
- Demo mode: required when external credentials are unavailable

## Credential handling

- Local values are stored in `.env`, which is ignored by Git.
- The public template is `.env.example`.
- No secret values are recorded in this handoff.
- LinkedIn client ID and client secret remain unset.

## Work completed

- Initialized Next.js 16 App Router with TypeScript, React 19, Tailwind CSS 4, and npm.
- Added shadcn-compatible Radix primitives and shared button/card components.
- Added a responsive dashboard shell, a horizontally scrollable mobile nav covering all eight routes, and a class-driven dark theme with a no-flash inline resolution script.
- Added environment validation and demo-mode detection.
- Added a Supabase service client helper (defined but not yet called anywhere).
- Added a PostgreSQL migration with the requested core tables, enums, indexes, ownership columns, RLS policies, trigger-created user profiles/settings, duplicate hashes, and schedule idempotency fields.
- Added configurable weighted scoring and duplicate fingerprints.
- Added SSRF URL validation.
- Added a provider-independent AI interface with structured Zod validation, retry classification, timeout handling, retry, and provider fallback.
- Added live discovery over Hacker News (Algolia), dev.to, and two RSS feeds, with parallel fetching, topic guessing, freshness decay, content-fingerprint deduplication, and SSRF-checked links.
- Added Gemini and OpenRouter (three models) HTTP adapters behind the provider interface.
- Added `/api/news` (GET, live discovery) and `/api/generate` (POST, Zod-validated, returns a single structured draft plus a provider-attempt log).
- Added all eight dashboard routes. Seven of them read from `src/lib/mock-data.ts` fixtures and return HTTP 200.
- Added UI primitives: `badge`, `card`, `button`, `tabs` (Radix), `select` (Radix), `tooltip` (Radix), `dialog` (Radix), `score-bar`, and `theme-toggle`.
- Added Sonner toasts for every action.
- Added unit tests for scoring, duplicate hashing, SSRF checks, and provider fallback.
- Fixed a production build error caused by Phosphor icons being loaded from a Server Component by adding a client entry boundary.
- Corrected `NEXT_PUBLIC_SUPABASE_URL` by removing an erroneous `/rest/v1/` suffix.
- Removed `src/lib/demo-data.ts` after confirming zero references (its types changed and it was dead code).

## Verification results

Last verified with a clean `npm run build` on 2026-09-21.

- `npm test`: 3 test files, 6 tests passed.
- `npm run typecheck`: passed (exit 0).
- `npm run lint`: fully clean — no errors and no warnings.
- `npm run build`: passed. All 11 routes compile; the 7 fixture-backed pages prerender as static content.
- Runtime check against `next start`: `/`, `/ideas`, `/drafts`, `/review`, `/calendar`, `/published`, `/analytics`, `/settings` all returned HTTP 200 with their expected content present in the HTML.
- Bundle check: no `node:crypto` or `createHash` in `.next/static/chunks` — the `import type` in `src/lib/types.ts` is correctly erased, so no server-only code reaches the browser.
- Gemini credential: accepted through a read-only models request.
- OpenRouter credential: accepted through a read-only key request.
- Supabase Auth endpoint: HTTP 200 after correcting the project URL.
- Supabase REST/database: HTTP 401, `Invalid API key`.
- Resend: HTTP 401; the configured key has the expected `re_` prefix but is invalid, revoked, or otherwise not accepted.
- LinkedIn: disabled, with credentials missing as expected.
- `/api/generate` was observed returning HTTP 502 after ~105s during earlier manual testing, before these changes.


## Credentials still needing correction

- Replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the anon/publishable key from the same project as `NEXT_PUBLIC_SUPABASE_URL`.
- Replace `SUPABASE_SERVICE_ROLE_KEY` with the service-role/secret key from that same project.
- Replace `RESEND_API_KEY` with an active Resend API key.
- Keep `LINKEDIN_API_ENABLED=false` until official LinkedIn OAuth is configured.

## Current limitations

All eight pages exist and respond, but seven of them render fixtures from `src/lib/mock-data.ts`. Nothing
is persisted, so every action resets on refresh. Concretely:

- No Supabase reads or writes exist. `getServiceSupabase()` has zero call sites.
- No authentication: no sign-in/sign-up screens, no `middleware.ts`, no session handling.
- Readability/JSDOM extraction is not wired to any fetch pipeline; `@mozilla/readability` and `jsdom` are installed but imported nowhere.
- Discovery runs live but its output is never stored, so the DB dedup columns (`url_hash`, `content_hash`, `duplicate_of`) are unused and dedup is an in-memory per-request `Set`.
- Discovery hardcodes its feeds, its scoring inputs (relevance 70 / value 65 / credibility 70), and `MAX_AGE_DAYS = 7` rather than reading `sources`, `user_settings.scoring_weights`, and `max_article_age_days`.
- `/api/generate` produces one `educational` draft; the three-version requirement (educational/opinion/discussion) and the separate structured review pass into `draft_reviews` are not implemented.
- Approve, reject, schedule, publish, and save-settings are local-state only. No write path exists.
- Cron, pause enforcement, publication idempotency, Resend notifications, and LinkedIn OAuth/Posts API are not implemented. `CRON_SECRET`, `RESEND_*`, and `LINKEDIN_*` are validated but unused.
- No rate limiting or caching on `/api/news` or `/api/generate`; every Visit hits three external services and can spend provider quota.
- `@radix-ui/react-dropdown-menu` remains installed and unused.
- Tests cover scoring, hashing, SSRF, and provider fallback only. No API-route, validation, extraction, scheduling, publish-approval, or end-to-end tests.
- `README.md` is still a single line.

## Important files

- `.env` — private local credentials; never commit or copy values into documentation
- `.env.example` — public environment-variable template
- `SESSION_HANDOFF.md` — this file
- `supabase/migrations/202609200001_initial_schema.sql` — the database schema
- `src/lib/mock-data.ts` — every fixture the seven new pages read; replace with real queries
- `src/lib/types.ts` — shared types, aligned to the migration column names
- `src/app/layout.tsx` — root layout plus the no-flash theme script
- `src/components/app-shell.tsx` — shell, nav, tooltip provider, toaster
- `src/components/ui/` — local primitives built on the installed Radix packages
- `src/lib/ai/provider.ts` — provider interface and fallback logic
- `src/lib/ai/adapters.ts` — Gemini and OpenRouter HTTP adapters
- `src/lib/discovery.ts` — live discovery, scoring, and dedup
- `src/lib/scoring.ts` — weighted scoring and hashes
- `src/lib/security/safe-url.ts` — URL safety checks
- `tests/unit/` — current automated tests

## Recommended continuation order

1. Correct and retest the Supabase and Resend credentials.
2. Apply the Supabase migration and add the four missing RLS policies (`candidate_scores`, `article_extractions`, `draft_versions`, `draft_reviews`).
3. Implement email/password authentication, session middleware, and authenticated data access.
4. Persist discovery output: `content_candidates`, `candidate_scores`, `agent_runs`, `provider_usage`.
5. Persist drafts: `drafts` and `draft_versions`, replacing the fixture imports on `/drafts`.
6. Extend `/api/generate` to emit three versions and add the separate structured review pass into `draft_reviews`.
7. Wire the remaining write paths: approve, reject, schedule, settings, and pause.
8. Build the Readability/JSDOM extraction pipeline into `article_extractions`, with redirect and DNS-rebinding SSRF enforcement.
9. Implement scheduling, cron protection, idempotent publishing, and Resend notifications.
10. Implement manual publishing into `published_posts`, then verify current official LinkedIn documentation before adding OAuth and Posts API support behind the existing feature flag.
11. Add the remaining tests, write the README/deployment documentation, and run final lint/type/test/build/E2E verification.

