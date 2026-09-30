# Handoff

## Current state

- Canonical checkout: `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- V5 Stage 1 implementation adds a provider-neutral `/api/assistant` OpenAI-Compatible route to the Cloudflare Worker and `/api/assistant/status` for the existing static frontend.
- Assistant requests include the current question, recent chat turns, Watchlist, Portfolio with live quote-based valuation where available, successful Finnhub quotes, Investment Memory, and all Investment Notes.
- The Worker reads `AI_BASE_URL` and `AI_MODEL` variables plus the `AI_API_KEY` secret. Current candidate config is the Beijing Model Studio endpoint with `qwen-plus`; replace the three variables to switch providers.
- Mock responses remain the fallback when the Worker is unconfigured, rate-limited, times out, or receives an upstream error. The UI displays Thinking, API status, model name, and a notice when context is sent.
- User context stays in localStorage until a message is sent. The API Key has not yet been supplied/configured; do not request it in chat. Ask the user to create it in the already-open Model Studio API Key console, then have the user enter it through a private local/Cloudflare prompt.
- `npm run build` passes. Synthetic Worker checks cover status, payload forwarding for NVDA/Portfolio/Memory/Notes, API-key omission from responses, missing-key status, 429, and network failure. Wrangler dry-run validates the Worker bundle and environment variables.
- Commits `9c64968` and `fd38e76` are pushed to `origin/main`. Cloudflare Worker `ai-investment-dashboard-api` is deployed at `https://ai-investment-dashboard-api.ai-investment-dashboard.workers.dev` (version `e3b73ecb-f5b0-4323-87af-a01e615e4da2`).
- GitHub Pages run `36661552504` completed successfully. The home, Assistant, Portfolio, and Watchlist routes each returned HTTP 200.
- Online Worker status reports model `qwen-plus` but `available: false`; a synthetic chat request returns 503 without contacting the model provider because `AI_API_KEY` is not configured. Mock fallback is therefore active.
- The Alibaba Cloud Model Studio Beijing API Key console is open in the Codex browser. User must complete sign-in/verification and key creation personally; do not ask them to send the key in chat. No personal Portfolio, quote, Memory, or Notes data has been sent to Alibaba.

## Next action

Have the user create the Beijing API Key and enter it through a private local/Cloudflare secret prompt. Before real acceptance, confirm that the user wants their question, Portfolio, Finnhub quotes, Investment Memory, and Investment Notes sent to Alibaba Cloud Model Studio and agree on a maximum test spend. Then run the three requested real prompts, verify the replies use their context, and confirm the online site and Worker status.
