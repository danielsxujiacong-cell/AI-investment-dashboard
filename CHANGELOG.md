# Changelog

## 2026-10-04

- V6 implementation: add Supabase email/password sign-in, user-owned cloud sync for Watchlist, Portfolio, Investment Memory, and Investment Notes, an explicit local-data import flow that only imports into an empty account, and local fallback on sign-out. Cloud activation and login acceptance await the existing Supabase SQL and public build variables.
- Add the app-specific Supabase SQL setup at `supabase/v6-setup.sql`; enable RLS with `auth.uid() = user_id`, table grants, `updated_at` triggers, and a user-scoped import RPC. No other app's tables are referenced.
- V5.4: replace the stock-detail Market Cap, P/E, and 52 Week High/Low mock snapshots with on-demand Finnhub fundamentals. Missing 52-week values fall back to a calculation over cached Massive 1Y daily candles; every value shows its real source or an explicit Unavailable state.
- Add a cached Cloudflare Worker fundamentals endpoint, keeping Finnhub credentials server-side and limiting requests to stock-detail views.

## 2026-09-30

- V5.2: replaced the homepage's simulated Daily Brief with a manual GLM generation flow through the existing Cloudflare Worker. It sends live Finnhub quotes, Massive 1M history summaries, Watchlist, local Portfolio, Investment Memory, and Investment Notes; successful output is cached locally with its generation time, and a failed refresh retries once while retaining the prior successful brief.
- Switched the configurable Worker AI endpoint to Zhipu `glm-4-flash-250414` and verified real chat and NVDA analysis responses; the API key remains a Cloudflare Worker Secret and portfolio context forwarding stays unchanged.
- V5 Stage 1: added a provider-neutral OpenAI-Compatible chat route to the Cloudflare Worker, with server-side API key handling, current Finnhub quotes, Portfolio, Investment Memory, Investment Notes, and recent conversation context.
- Updated the existing Assistant page with model/API status, Thinking state, API-error Mock fallback, and a notice explaining when local investment context is sent. At implementation time, provider acceptance was pending the user's Worker Secret setup; live acceptance was completed afterward.
- V4.1: load Massive history only for the selected period, share and reuse stock/range requests, and cache verified OHLC in memory plus sessionStorage across route changes and reloads. Use stale real history on rate limits, retry 429 once after a delay, and keep API errors out of ordinary UI copy.
- Aligned quote and history source labels. Finnhub supplies Current Price, Open, High, Low, and Previous Close; the static Market Cap, P/E, 52 Week High, and 52 Week Low snapshots remain labeled Mock Data.

## 2026-09-29

- Replaced the Overview / Watchlist mini curves and stock-detail history with real Finnhub candle requests through the Cloudflare Worker. Added 1D, 1W, 1M, 3M, and 1Y range controls; chart colors follow the returned price series, and failures never draw mock history.
- The Overview portfolio trend now derives from locally saved share counts and historical closes. The configured Finnhub credential returns HTTP 403 for GET /stock/candle (Premium Access Required), so chart panels show the exact unavailable state until the account plan is enabled.

## 2026-09-28

- Added V4 Personal Investment System: editable personal holdings with quote-based value, cost basis, and unrealized gain/loss; per-stock Investment Memory; and editable Investment Notes.
- Added a versioned localStorage store for personal data. The Mock AI Personal Context now displays and references holdings, saved investment memory, and the existing Watchlist without an external AI service.
- Added persistent Light / Dark themes with system preference on first visit, a top-bar toggle, and theme-aware charts and dashboard surfaces.
- Updated the Overview watchlist card to use the shared Finnhub hook, fallback status, and Last updated timestamp.
- Kept STEP 3 deferred; the existing Mock AI assistant remains unchanged until OPENAI_API_KEY is configured.

## 2026-09-27

- Added a Cloudflare Worker API proxy for Finnhub quotes while keeping the Finnhub key server-side.
- Verified the GitHub Pages deployment and all five public Finnhub quote endpoints. The existing Mock AI assistant remains; STEP 3 is deferred until OPENAI_API_KEY is configured.
## 2026-09-29

- Keep Finnhub current quotes and move historical OHLC, overview/watchlist mini charts, portfolio performance, and stock-detail candles to Massive through the server-side Worker.
- Keep Massive API credentials in ignored `.env.local` and Worker Secrets; never expose them to GitHub Pages.
- Show Massive Basic end-of-day recency separately from Finnhub current quotes, and remove empty Investment Memory records when cleared.
