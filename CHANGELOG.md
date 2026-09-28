# Changelog

## 2026-09-28

- Added persistent Light / Dark themes with system preference on first visit, a top-bar toggle, and theme-aware charts and dashboard surfaces.
- Updated the Overview watchlist card to use the shared Finnhub hook, fallback status, and Last updated timestamp.
- Kept STEP 3 deferred; the existing Mock AI assistant remains unchanged until OPENAI_API_KEY is configured.

## 2026-09-27

- Added a Cloudflare Worker API proxy for Finnhub quotes while keeping the Finnhub key server-side.
- Verified the GitHub Pages deployment and all five public Finnhub quote endpoints. The existing Mock AI assistant remains; STEP 3 is deferred until OPENAI_API_KEY is configured.
