# Handoff

## Current state

- Project status: **V6.1 major functionality complete; two Daily Brief acceptance items remain**. Canonical checkout is `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- The existing `lanlan-cloud-pet` Supabase Project is reused. Its four app-specific tables are `investment_watchlist`, `investment_portfolio`, `investment_memories`, and `investment_notes`; owner RLS policies enforce `auth.uid() = user_id`.
- Signed-in users use Supabase as the primary source for all four collections. Guests continue using localStorage. The explicit local import is available only when all cloud collections are empty; local data remains as a backup. Sign-out returns to local data without exposing cloud state. Sync occurs on refresh; Realtime is out of scope.
- The user manually verified sign-in, local import, CRUD for all four collections, sign-out/re-login, and cross-device synchronization.
- AI Assistant and Daily Brief use the shared data provider. Finnhub, Massive, Stock Universe, Fundamentals, K-line behavior, and the Cloudflare Worker secret architecture remain unchanged. AI/Finnhub/Massive secrets stay server-side.
- AI Assistant and Daily Brief now try same-origin `/api/assistant` routes on `invest.danielxu.cn`; a 404 falls back to the configured Worker until EdgeOne routing is added. Commit `4358f95` is deployed by Pages workflow `37880857833`. Live GLM two-turn history passed through the Worker, but production same-origin `/api/assistant/status` still returns 404; domestic mobile no-VPN acceptance remains pending.
- Portfolio and other stock lists use the shared static-export-safe stock route helper. Daily Brief cache keys are scoped to the authenticated Supabase user or the guest namespace; account changes hide the previous cache and abort in-flight generation.
- V6.1 source commit `b3d5017` was deployed by Pages workflow `37732629650`. The Overview, AMD/PLTR/MRVL query routes, NVDA legacy route, and Worker AMD search endpoint were checked online. The local checkout lacks `NEXT_PUBLIC_MARKET_API_BASE_URL` and `NEXT_PUBLIC_SUPABASE_*`; its Worker proxy is not running.
- Production browser acceptance on 2026-10-08 generated a real `GLM-4-FLASH` Brief at 2:20 PM. Signing out switched to Guest and showed `NOT GENERATED` without exposing the signed-in Brief; signing back into the same account restored the same Brief timestamp and content.
- Remaining Brief checks: (1) the visible previous-day label (no prior-date Brief was available, and no real cache was altered to simulate one); (2) isolation between two authorized accounts, including an account switch during generation (only one authorized account was available).

## Next action

Next action: add EdgeOne same-origin forwarding for `/api/assistant` and `/api/assistant/status` to the existing Worker, matching the `/api/market` proxy behavior and preserving the server-side key boundary. Verify the public status endpoint and two-turn chat from a domestic mobile device without VPN. Separately, when a prior-date Brief is naturally available or a disposable fixture can be used safely, verify its previous-day label; with a second authorized test account, verify account cache isolation and switching accounts during generation. Future directions only: AI news/filings/real-time events, fuller Portfolio Health, and Daily/Morning Brief automation.
