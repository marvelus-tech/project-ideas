# Architecture

## Which base, and why

Both repos were read before this app was written (14 Nov 2026).

[Rakazo](https://github.com/elie222/rakazo) (Apache-2.0) is a full Grok Bot alternative: routines, approvals with spending limits, a per-bot computer, group chats, and a chat UI inside `packages/chat-ui`. Computers are pluggable. The README lists Docker, E2B, Novita, Daytona, CreateOS, Boat, Boxd, Instabox, and Railway. Orgo is not one of them. Local development wants Node.js 24.15 or newer, pnpm 12, Postgres, and Docker. The product is apps for web, API, worker, Electron, and Expo. We did not copy Rakazo source.

[grokbot-clone](https://github.com/nickvasilescu/grokbot-clone) (MIT) is a smaller web app: a Hono server and a React chat. The parts that match CNSTRCT are already isolated:

- `server/src/agent/loop.ts`: one queue per bot, tool calls in order, a pending batch that pauses on an approval card and resumes when the owner answers.
- `server/src/agent/tools.ts`: the bot's own computer and shell run freely. Composio writes pause for approval.
- `server/src/routines.ts` and `proactive.ts`: scheduled work and check-ins that report back in chat.
- `server/src/orgo.ts`, `computer.ts`, `vnc.ts`: one Orgo computer, a screen per bot, and a viewer.
- `web/src/components/ChatView.tsx` and `ComputerViewer.tsx`: the chat and computer surface.

It does not boot without `XAI_API_KEY`, `ORGO_API_KEY`, and `COMPOSIO_API_KEY`, and it has no local sandbox. The server runtime is about 2,500 lines.

CNSTRCT adapts grokbot-clone.

1. This demo has to run on Node 22 with no Docker and no API keys. Rakazo's own quick start does not.
2. The computer CNSTRCT asked for is Orgo first, then a local or Docker fallback. grokbot already speaks the Orgo API. Rakazo's provider list does not include Orgo.
3. The approval card, the routine fire, and the per-agent computer are small enough to sit inside a Next.js dashboard this week. Rakazo's versions sit behind Postgres, a worker, and desktop and mobile clients.
4. Neither project is keyless out of the box. Wrapping grokbot's loop with a scripted model and a folder sandbox keeps the control flow and still demos. Forking Rakazo would mean standing up a platform we cannot boot here.

The MIT notice and the list of changes are in `THIRD_PARTY_NOTICES.md`.

## How a turn works

`enqueue` in `src/lib/agent/loop.ts` runs one turn at a time per agent.

1. A user message or a routine is stored.
2. The model returns text and zero or more tool calls. With no `XAI_API_KEY` or `OPENAI_API_KEY`, `mockModel` follows the home-services script. With a key, the server calls that vendor's chat completions API and falls back to the script if the call fails.
3. Computer tools (`shell`, `write_file`, `read_file`, `list_files`, `screenshot`) run immediately, same as grokbot's own computer.
4. `send_outreach`, `send_match`, and `spend` call `policyFor`. The default is ask. The loop writes an approval card and stores the batch in `pending_turns`.
5. Approve runs the tool. Reject writes a refusal into the transcript and tells the model not to retry. Always allow stores a policy so that tool stops asking.
6. A newer user message expires an open card, matching grokbot, so only one batch is pending.

Nothing in those three gated tools opens a network socket. Approve writes `outbox/*.json` with `network: false`.

## The computer

`configuredProvider()` picks Orgo when both Orgo env vars are set, otherwise Docker if `docker version` succeeds, otherwise a folder under `data/sandboxes/<agentId>`.

The local sandbox allows a short command list (`ls`, `cat`, `mkdir`, and similar) plus `cnstrct-search`, which reads a built-in tradie directory. Pipes, redirects, curl, and interpreters are rejected. The dashboard computer view is that folder: terminal log, files, and the note the agent wrote. It is not a fake screenshot of a desktop the process never had.

Orgo, when configured, uses the ported client for `bash`. If the call fails, the same command runs locally and the terminal says so.

## Routines

Each agent is created with a routine:

- Mara, tradie scout: "Weekday tradie sweep" (labeled weekdays at 8:00).
- Jules, lead matcher: "New lead check" (labeled every morning).

Opening the desk runs both immediately, so the dashboard already has approval cards. After that, `src/instrumentation.ts` starts a 30 second timer. A routine whose `next_run_at` has passed fires the same path. grokbot used croner. CNSTRCT stores an interval so the demo has no extra dependency. "Run now" uses that same function.

## Tenancy and auth

A user owns a profile, one business, that business's public site at `/b/[slug]`, and that business's agents. The sample desk `harbor-tradie-desk` belongs to `user_sample` and is not the signed-in demo user.

With no Supabase keys, `POST /api/session` sets an httpOnly `cnstrct_sid` cookie and a row in sqlite. With `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `POST /api/auth/magic` asks Supabase to email a link, and `POST /api/auth/verify` accepts `token_hash` from `/auth/callback`. The email template has to land on that page with `token_hash` and `type`. The demo cookie still works when those keys are absent.

Sqlite lives in `data/cnstrct.db` (or `CNSTRCT_DATA_DIR`). There is no hosted database in the default demo.

## Product flow

1. `/` explains the product and links to triage and the sample desk.
2. `/triage` asks eight questions, one at a time, and stores a profile.
3. `/opportunities` shows three cards from `src/lib/templates.ts`. Home services is live and the copy comes from the profile. Mobile detailing and estate clearance are coming soon.
4. Opening the live card creates the business, the site, Mara, Jules, an example lead, and runs both routines.
5. `/dashboard` shows chat, the approval card, the computer, routines, leads, and the token and computer-hour meters (50,000 tokens and 2 hours, hardcoded).
6. `/b/[slug]` is the public site: hero, how it works, lead form, about, contact, link back to the dashboard.

## Adding a business type

1. Add a template in `src/lib/templates.ts` with `live: false` until the prompts exist.
2. Add card copy in the opportunities route. Personalize from the profile the way `liveCardCopy` does.
3. When it is ready, teach `openDesk` to branch on `templateId`: site fields, agent instructions, routines, and which tools those routines call.
4. Keep outbound tools on the approval policy. Do not add a path that sends or spends without a card.
5. Flip `live` to true. The board already renders whatever the catalog marks live. Leave the other cards non-selectable.

Do not add billing or custom domains here.

## Next templates

Same shape as home services: a public page, one or two agents, routines, and approval before anything leaves the machine. All three can start with almost no cash.

1. **Mobile detailing booking desk.** A page that takes a driveway and a time. One agent drafts partnerships with detailers who already own the gear. One matches jobs. Capital is a hose and a borrowed driveway. The margin is on the booking.
2. **Estate-clearance resale desk.** A page for families clearing a house. One agent drafts pickup-partner notes. One drafts marketplace listings. Approval before a listing is posted. Capital is a tape measure and a storage corner.
3. **After-school tutoring match.** A page for parents. One agent drafts tutor outreach. One drafts the introduction. Approval before anyone is connected. Capital is a phone and a calendar.

Detailing and estate clearance are the two coming-soon cards. Tutoring is the third to add after those.

## Mocked vs live

| Piece | No keys | With keys |
| --- | --- | --- |
| Triage, cards, site, leads | Live, stored in sqlite | Same |
| Agent chat and routines | Scripted model, real tool loop | xAI if `XAI_API_KEY` is set, else OpenAI |
| Computer | Local folder. Docker if the daemon answers | Orgo when both Orgo vars are set, else the fallback |
| Email, match intro, spend | Approval card, then a local outbox file. No network | Same. Composio is not wired up |
| Auth | Demo session cookie | Supabase magic link when both public vars are set |
