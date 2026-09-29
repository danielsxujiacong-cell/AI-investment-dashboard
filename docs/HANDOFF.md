# Handoff

## Current state

- Canonical checkout: `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- V4 Personal Investment System is implemented on top of the existing static Next.js app and Finnhub Worker integration.
- Personal holdings, per-symbol Investment Memory, and Investment Notes use one versioned localStorage store. Data stays on the current device.
- Portfolio values use current quotes and retain their Mock Data fallback. Overview and Watchlist mini charts plus stock detail request real history through the Worker; detail ranges are 1D / 1W / 1M / 3M / 1Y. No history chart falls back to mock prices.
- AI Assistant remains Mock AI and can read the portfolio, Investment Memory, and existing Watchlist from Personal Context. No OpenAI API, Supabase, login, or trading integration was added.
- `npm run build` passed. Browser acceptance covered Overview, Watchlist search, live quotes, history error states, detail ranges, holding add/edit/delete and calculations, Investment Memory, Investment Notes, AI Personal Context/reply, refresh persistence, theme persistence, API failure fallback, 390 px layout on all routes, and an empty browser console error log.
- README, product, technical stack, roadmap, changelog, and this handoff describe V4 behavior.
- The deployed Worker now exposes the protected /api/market/candles/:symbol?range= route alongside quotes. Live checks for all five ranges return 403 history_premium_required: Finnhub GET /stock/candle requires Premium Access on the configured key. Quote endpoints remain live.
- Enable a Finnhub plan with Stock Candles access (simplest path) or select a separately licensed historical-price provider before claiming the charts display candles. The UI deliberately reports the restriction and never fabricates a series.
- V4 commit `d973a11e85c67f7b141be31340cc9754a1da6d5c` is pushed to `origin/main`. GitHub Pages deployment run `36372016362` completed successfully; the home, portfolio, assistant, and NVDA detail routes returned HTTP 200 with their V4 markers.

## Next action

Next: enable a Finnhub plan that includes Stock Candles or configure a separately licensed historical-data provider; then recheck each chart range. Keep `.env.local` and `api-proxy/.dev.vars` out of Git. OpenAI API, Supabase, login, and trading remain out of scope.
