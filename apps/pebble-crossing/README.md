# Pebble Crossing (RevEDU playtest)

Week-1 **Level 6** web prototype: `sh` planks with reset-on-miss, four within-10 math posts, decodable sentence read-aloud, child done state, and parent one-sentence report.

**Live site (monorepo Pages):** https://marvelus-tech.github.io/project-ideas/pebble-crossing/

**Standalone repo (when created):** https://marvelus-tech.github.io/pebble-crossing/

This is a RevEDU kitchen-table playtest, not the Edu Period parent-gate product.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/pebble-crossing/ (Vite `base` matches GitHub Pages).

## Playtest query params

| Param | Purpose |
| --- | --- |
| `?maxMinutes=3` | Shorten the 10-minute session cap (default 10) |
| `?mic=off` | Force practice-sign path and abstaining parent fluency line |

Example: https://marvelus-tech.github.io/pebble-crossing/?maxMinutes=3&mic=off

## Parent report

Child screen: press and hold **Pebble Crossing** for ~1s, or visit [/parent](https://marvelus-tech.github.io/pebble-crossing/parent).

**Mic check off** on the parent screen forces the spec’s “no fluency claim” sentence for scenario 4.

## Scripts

- `npm run build` — production build to `dist/`
- `npm run test` — vitest (includes anti-cycling miss rule on `ship`)
- `npm run preview` — serve `dist/`

## Spec alignment

Implements Grade 1 MVP spec Level 6 session flow (phonics, math, sentence, done, parent template). Voice uses browser `speechSynthesis`; optional conservative `webkitSpeechRecognition` on read-aloud.

Product context docs live in the RevEDU Project store (`grade-1-mvp-spec.md`).