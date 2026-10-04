# Handoff

## Current state

- Canonical checkout: `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- V6 frontend code now supports Supabase email/password sign-in and user-scoped refresh-after-write synchronization for Watchlist, Portfolio, Investment Memory, and Investment Notes. Logged-out mode remains local; sign-out reloads local data without copying the signed-in cloud data into localStorage.
- Setup SQL: `supabase/v6-setup.sql`. It creates only the four `investment_*` tables, owner RLS policies, update triggers, and an atomic import RPC that refuses to write if any cloud collection already contains data.
- Cloud activation is pending: execute the SQL in the existing `lanlan-cloud-pet` project's SQL Editor, set `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in local `.env.local` and GitHub Repository Variables, then redeploy Pages.
- Do not place a `service_role` key, database password, or other secret in the client build. The public URL and publishable/anon key are intended for browser use with RLS enabled.
- Remaining acceptance: login, all four CRUD flows, reload, logout and re-login, empty-account local import, AI Assistant/Daily Brief context, second account isolation, build, Pages, and online route verification. Do not mark V6 fully active until the SQL and build variables are configured and these checks pass.

## Next action

Complete available local guest-mode checks and `npm run build`, review the staged files and `.gitignore`, commit and push `main`, then verify Pages. After the user applies the SQL and sets the public variables, finish authenticated cross-device and RLS acceptance.
