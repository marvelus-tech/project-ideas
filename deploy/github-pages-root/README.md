---
cursor:
  subagentId: "bc-d43848a8-06ac-58eb-af88-7cf3de37d191"
---

# Ideas UI at marvelus-tech.github.io root

## Status

Implementation is complete locally on branch `cursor/ideas-root-homepage-d191` (commit `57d4266` in clone at `/tmp/marvelus-github-io`).

**Blocker:** `cursor[bot]` cannot push to `marvelus-tech/marvelus-tech.github.io` (403) and cannot fork the repo (403). Apply `ideas-root-homepage.patch` from a principal with write access, push the branch, then open the PR.

## What changed

| Path | Action |
|------|--------|
| `index.html` | Replaced pearl directory with project-ideas UI; `canonical` + `theme-color`; footer link to root |
| `data/ideas.json` | Added (copied from `project-ideas` main) |
| `project-ideas/index.html` | Redirect to `/` |

Unchanged: `sorted/`, `readiness/`, `claude-for-business/`, `versa-agent-portfolio/`, Vite `src/` tree.

## Apply patch

```bash
git clone git@github.com:marvelus-tech/marvelus-tech.github.io.git
cd marvelus-tech.github.io
git checkout -b cursor/ideas-root-homepage-d191
git am /path/to/ideas-root-homepage.patch
git push -u origin cursor/ideas-root-homepage-d191
```

## Local verify

```bash
python3 -m http.server 8765
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8765/data/ideas.json
```

Screenshots: `media/ideas-root-grid.webp`, `media/ideas-root-panel.webp`.
