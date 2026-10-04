# Handoff

## Current state

- Project status: **V6 COMPLETE**. Canonical checkout is `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- The existing `lanlan-cloud-pet` Supabase Project is reused. Its four app-specific tables are `investment_watchlist`, `investment_portfolio`, `investment_memories`, and `investment_notes`; owner RLS policies enforce `auth.uid() = user_id`.
- Signed-in users use Supabase as the primary source for all four collections. Guests continue using localStorage. The explicit local import is available only when all cloud collections are empty; local data remains as a backup. Sign-out returns to local data without exposing cloud state. Sync occurs on refresh; Realtime is out of scope.
- The user manually verified sign-in, local import, CRUD for all four collections, sign-out/re-login, and cross-device synchronization.
- AI Assistant and Daily Brief use the shared data provider. Finnhub, Massive, Stock Universe, Fundamentals, K-line behavior, and the Cloudflare Worker secret architecture remain unchanged. AI/Finnhub/Massive secrets stay server-side.
- Last application source deployed successfully at commit `6cf56ff`; its V6 configuration workflow and live routes/assets were smoke-checked. This handoff update is documentation-only and does not require another Pages build.

## Next action

No V6 setup or acceptance action remains. Future directions only: AI news/filings/real-time events, fuller Portfolio Health, and Daily/Morning Brief automation. Do not start these without a new request.
