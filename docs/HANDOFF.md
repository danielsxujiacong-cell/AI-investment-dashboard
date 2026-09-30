# Handoff

## Current state

- Canonical checkout: `D:\_Codex project\01_Active\AI-investment-dashboard`, branch `main`.
- V5 Stage 1 implementation adds a provider-neutral `/api/assistant` OpenAI-Compatible route to the Cloudflare Worker and `/api/assistant/status` for the existing static frontend.
- Assistant requests include the current question, recent chat turns, Watchlist, Portfolio with live quote-based valuation where available, successful Finnhub quotes, Investment Memory, and all Investment Notes.
- The Worker reads `AI_BASE_URL` and `AI_MODEL` variables plus the `AI_API_KEY` secret. Current candidate config is the Beijing Model Studio endpoint with `qwen-plus`; replace the three variables to switch providers.
- Mock responses remain the fallback when the Worker is unconfigured, rate-limited, times out, or receives an upstream error. The UI displays Thinking, API status, model name, and a notice when context is sent.
- User context stays in localStorage until a message is sent. The API Key has not yet been supplied/configured; do not request it in chat. Ask the user to create it in the already-open Model Studio API Key console, then have the user enter it through a private local/Cloudflare prompt.
- `npm run build` passes. Synthetic Worker checks cover status, payload forwarding for NVDA/Portfolio/Memory/Notes, API-key omission from responses, missing-key status, 429, and network failure. Wrangler dry-run validates the Worker bundle and environment variables.
- Push, Worker deployment, Pages deployment, and real-provider/live-context acceptance are still pending in this handoff.

## Next action

Finish focused validation and the requested build, inspect staged paths and ignore rules, then commit and push `main`. Deploy the Worker and let GitHub Actions publish Pages. Stop before sending the user's real portfolio, memory, notes, and quote context to the selected model until the user explicitly confirms that destination. Continue with the API Key and live acceptance after the user completes the console credential step.
