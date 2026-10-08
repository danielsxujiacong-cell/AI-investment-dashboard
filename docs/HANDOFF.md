# Handoff

## Current state

- Project status: **V6.1 implementation and deployment complete; two-account Brief acceptance pending**. Canonical checkout is `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- The existing `lanlan-cloud-pet` Supabase Project is reused. Its four app-specific tables are `investment_watchlist`, `investment_portfolio`, `investment_memories`, and `investment_notes`; owner RLS policies enforce `auth.uid() = user_id`.
- Signed-in users use Supabase as the primary source for all four collections. Guests continue using localStorage. The explicit local import is available only when all cloud collections are empty; local data remains as a backup. Sign-out returns to local data without exposing cloud state. Sync occurs on refresh; Realtime is out of scope.
- The user manually verified sign-in, local import, CRUD for all four collections, sign-out/re-login, and cross-device synchronization.
- AI Assistant and Daily Brief use the shared data provider. Finnhub, Massive, Stock Universe, Fundamentals, K-line behavior, and the Cloudflare Worker secret architecture remain unchanged. AI/Finnhub/Massive secrets stay server-side.
- Portfolio and other stock lists use the shared static-export-safe stock route helper. Daily Brief cache keys are scoped to the authenticated Supabase user or the guest namespace; account changes hide the previous cache and abort in-flight generation.
- V6.1 build, focused local browser checks, push, Pages workflow, and key live routes were verified for the release commit recorded by Git. The local checkout lacks `NEXT_PUBLIC_MARKET_API_BASE_URL` and `NEXT_PUBLIC_SUPABASE_*`; its Worker proxy is not running. Account-scoped cache keys and stale-request cancellation were code-checked, but authenticated login/logout and two-user Brief isolation were not browser-tested.

## Next action

Next action: in a configured local session with two dedicated test accounts, verify login/logout, each account's current/previous Brief cache, and that switching accounts during generation cannot display or write the other account's Brief. Future directions only: AI news/filings/real-time events, fuller Portfolio Health, and Daily/Morning Brief automation.
