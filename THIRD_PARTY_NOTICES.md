# Third-party notices

## grokbot-clone

The agent turn loop, approval policy, routine runner, and Orgo client in `src/lib/agent` are adapted from [grokbot-clone](https://github.com/nickvasilescu/grokbot-clone) by Nick Vasilescu, MIT License.

Copyright (c) 2026 Nick Vasilescu

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### What CNSTRCT changed

- Serial queue, pending approval batch, and resume live in `src/lib/agent/loop.ts` (from `server/src/agent/loop.ts`).
- Outbound tools ask, computer tools run (`src/lib/agent/policy.ts`, from `policyFor` in `server/src/agent/tools.ts`).
- Routines use `next_run_at` instead of croner (`src/lib/agent/scheduler.ts`, from `server/src/routines.ts`).
- Orgo stays optional (`src/lib/agent/orgo.ts`, from `server/src/orgo.ts`). A local folder sandbox, or Docker when the daemon answers, is the fallback.
- The model call accepts xAI or OpenAI chat completions, and a scripted model when no key is set.
- Dropped Composio, voice, the noVNC relay, groups, and subagents.
- Hardcoded demo caps: 50,000 tokens and 2 computer hours per agent.

Rakazo (https://github.com/elie222/rakazo, Apache-2.0) was read and not copied. See `docs/architecture.md`.
