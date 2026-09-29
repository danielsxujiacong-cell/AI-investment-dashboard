# Changelog

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
