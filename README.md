# CNSTRCT

CNSTRCT spins up a real micro-business from almost nothing. You answer a short triage, pick the live home-services desk, and get a public site plus two agents. The agents draft tradie outreach and lead matches on their own computer. Nothing is emailed, posted, or spent until you approve it.

This app adapts the agent loop from [grokbot-clone](https://github.com/nickvasilescu/grokbot-clone) (MIT). Why that base, and how to add the next business type, is in [docs/architecture.md](docs/architecture.md). The MIT notice is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. No API keys are required.

```bash
pnpm test
pnpm build
```

The first request creates `data/cnstrct.db` and a sample public desk at `/b/harbor-tradie-desk`. That folder is gitignored.

## Demo

1. Start at `/` and open Start.
2. Answer the eight questions. City becomes the business name (`Austin` becomes Austin Tradie Desk).
3. The board shows three cards. Open the live one. Mobile detailing and estate clearance stay coming soon.
4. `/dashboard` shows Mara (tradie scout) and Jules (lead matcher). Each routine has already drafted an approval card and written notes on its computer.
5. Approve or reject. Approve writes `outbox/outreach.json` or `outbox/matches.json` inside that agent's sandbox. Reject does not.
6. Open the public site from the dashboard, or visit `/b/harbor-tradie-desk`. The lead form saves a request on the desk. It does not text or email anyone.

A new chat message closes an approval that is still open. Approve or reject before you type.

## What works with no keys

| Piece | Behavior |
| --- | --- |
| Triage, cards, site, leads | Stored in local sqlite |
| Auth | Demo session cookie (`cnstrct_sid`) |
| Agent chat and routines | Scripted model driving the real tool loop |
| Computer | A folder per agent under `data/sandboxes` |
| Outreach, match, spend | Approval card, then a local outbox file. No network |

## Env vars

Copy `.env.example` to `.env.local` only when you want a live provider. Every variable can stay empty.

| Variable | Effect |
| --- | --- |
| `XAI_API_KEY`, `XAI_MODEL` | Chat completions on xAI. Default model `grok-4.7`. Wins over OpenAI when both are set. A failed call falls back to the scripted model. |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` | Chat completions on OpenAI, or any compatible base URL. |
| `ORGO_API_KEY`, `ORGO_WORKSPACE_ID`, `ORGO_RAM_GB`, `ORGO_CPU` | Both key and workspace are required. Shell then runs on Orgo. If the call fails, the same command runs in the local folder. |
| Docker | Used only when the daemon answers `docker version` and Orgo is unset. The container is `alpine` with `--network none`. |
| `COMPOSIO_API_KEY` | Accepted so a later integration has a place to live. This MVP never calls Composio. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Email magic link. The template should land on `/auth/callback` with `token_hash` and `type`. Without the keys, the demo session is the path that always works. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin. Defaults to `http://localhost:3000`. |
| `CNSTRCT_DATA_DIR` | Where sqlite and sandboxes live. Defaults to `./data`. |

Token and computer-hour meters are a hardcoded demo cap: 50,000 tokens and 2 hours per agent.
