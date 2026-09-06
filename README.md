# Project Ideas

Parked business and project ideas for O'keito S. (Melbourne UX/product designer) with copyable AI jumpstart prompts.

**Live site**: https://marvelus-tech.github.io/project-ideas/

## Features

- Light-theme decision board for tracking parked, active, and completed projects
- Each idea includes title, status, summary, source link, tags, saved date, and AI jumpstart prompt
- Search functionality across titles, summaries, and tags
- Filter by status (parked/active/done) and tags
- Copy prompt button for each idea (works on HTTPS)
- Mobile-friendly responsive design

## How to Add a New Idea

1. Open `data/ideas.json`
2. Add a new object to the `ideas` array with the following structure:

```json
{
  "id": "unique-kebab-case-id",
  "title": "Your Idea Title",
  "status": "parked",
  "savedAt": "2026-09-06",
  "source": "https://source-url.com",
  "sourceLabel": "Source Name",
  "summary": "One-line summary of the idea.",
  "tags": ["tag1", "tag2", "tag3"],
  "jumpstartPrompt": "A comprehensive, copy-paste ready prompt an AI coding/product agent can use to jumpstart validation and MVP planning. Include specific research tasks, technical requirements, success criteria, and deliverables. No em dashes or en dashes in the prompt."
}
```

3. Save the file and commit
4. The site will automatically display the new idea

## Tag Taxonomy

**Primary categories:**
- `remote-mcp` - Remote MCP server products
- `webmcp` - WebMCP browser interaction demos
- `game` - Game mechanics and interactive experiences
- `commerce` - Shopping, payments, transactions
- `booth` - Conference booth demos

**Additional tags** for specific domains: `mobile`, `kids`, `edtech`, `app-store`, `subscriptions`, `finance`, `real-estate`, `support`, `education`, `inventory`, etc.

## Stack

Marvelus AI voice, Nolostsales, AI agents, App Store / micro products, land, sandwich boards

## Local Development

Simply open `index.html` in a browser. The site is static HTML/CSS/JS with no build process required.
