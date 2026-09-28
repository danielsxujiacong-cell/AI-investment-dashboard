# Changelog

## 2026-09-28

- Added V4 Personal Investment System: editable personal holdings with quote-based value, cost basis, and unrealized gain/loss; per-stock Investment Memory; and editable Investment Notes.
- Added a versioned localStorage store for personal data. The Mock AI Personal Context now displays and references holdings, saved investment memory, and the existing Watchlist without an external AI service.
- Added persistent Light / Dark themes with system preference on first visit, a top-bar toggle, and theme-aware charts and dashboard surfaces.
- Updated the Overview watchlist card to use the shared Finnhub hook, fallback status, and Last updated timestamp.
- Kept STEP 3 deferred; the existing Mock AI assistant remains unchanged until OPENAI_API_KEY is configured.

## 2026-09-27

- Added a Cloudflare Worker API proxy for Finnhub quotes while keeping the Finnhub key server-side.
- Verified the GitHub Pages deployment and all five public Finnhub quote endpoints. The existing Mock AI assistant remains; STEP 3 is deferred until OPENAI_API_KEY is configured.
