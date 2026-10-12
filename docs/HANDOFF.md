# Handoff

## Current state

- Project status: **V6.2 Market-first Homepage implementation complete; GitHub Pages release verification pending. V6.1 still has two Daily Brief acceptance items remaining.** Canonical checkout is `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- V6.2 replaces the personal-asset-first `/` view with the Northstar market search, eight featured technology stocks, real Finnhub quotes, cached Massive 1M trends, the existing guest/account-scoped GLM Brief, and compact Watchlist / Portfolio / Assistant links. Search reuses `/api/market/stocks`; stock links use the shared static-export-safe route helper. Missing prices and trends show Unavailable.
- The real one-month portfolio history now appears on Portfolio, next to its existing value and gain/loss summaries. Portfolio CRUD and personal-data sync code were not changed. Homepage and Portfolio history requests remain limited to the curated list or up to eight held symbols.
- `BUILD_FOR_GITHUB_PAGES=true npm run build` and focused ESLint passed. The local desktop and 390px / 320px mobile layouts were reviewed. The local market proxy was not running, so live data, directory search, and the GLM request still need production verification.
- The existing `lanlan-cloud-pet` Supabase Project is reused. Its four app-specific tables are `investment_watchlist`, `investment_portfolio`, `investment_memories`, and `investment_notes`; owner RLS policies enforce `auth.uid() = user_id`.
- Signed-in users use Supabase as the primary source for all four collections. Guests continue using localStorage. The explicit local import is available only when all cloud collections are empty; local data remains as a backup. Sign-out returns to local data without exposing cloud state. Sync occurs on refresh; Realtime is out of scope.
- The user manually verified sign-in, local import, CRUD for all four collections, sign-out/re-login, and cross-device synchronization.
- AI Assistant and Daily Brief use the shared data provider. Finnhub, Massive, Stock Universe, Fundamentals, K-line behavior, and the Cloudflare Worker secret architecture remain unchanged. AI/Finnhub/Massive secrets stay server-side.
- AI Assistant and Daily Brief use same-origin `/api/assistant` routes on `invest.danielxu.cn`; `edge-functions/api/assistant/index.js` and `edge-functions/api/assistant/status.js` forward chat and status to the existing Worker, preserving POST bodies. Client requests do not fall back to direct Worker URLs.
- Portfolio and other stock lists use the shared static-export-safe stock route helper. Daily Brief cache keys are scoped to the authenticated Supabase user or the guest namespace; account changes hide the previous cache and abort in-flight generation.
- V6.1 source commit `b3d5017` was deployed by Pages workflow `37732629650`. The Overview, AMD/PLTR/MRVL query routes, NVDA legacy route, and Worker AMD search endpoint were checked online. The local checkout lacks `NEXT_PUBLIC_MARKET_API_BASE_URL` and `NEXT_PUBLIC_SUPABASE_*`; its Worker proxy is not running.
- Production browser acceptance on 2026-10-08 generated a real `GLM-4-FLASH` Brief at 2:20 PM. Signing out switched to Guest and showed `NOT GENERATED` without exposing the signed-in Brief; signing back into the same account restored the same Brief timestamp and content.
- Remaining Brief checks: (1) the visible previous-day label (no prior-date Brief was available, and no real cache was altered to simulate one); (2) isolation between two authorized accounts, including an account switch during generation (only one authorized account was available).

## Next action

Next action: commit and push the V6.2 source to `main`, wait for the GitHub Pages workflow, then check the public homepage, live quotes, Stock Universe search, and representative stock routes. The existing EdgeOne status/chat checks and V6.1 previous-day/two-account Brief acceptance remain separate follow-up items. Future directions only: AI news/filings/real-time events, fuller Portfolio Health, and Daily/Morning Brief automation.
