# Nebari Nebi Pack — Docs

Static documentation site built with [Hugo](https://gohugo.io/) using the
[nebari-hugo-theme](https://github.com/nebari-dev/nebari-hugo-theme) Hugo Module.

## Required tools

| Tool | Minimum version | Purpose |
|------|-----------------|---------|
| [Hugo Extended](https://gohugo.io/installation/) | 0.158.0 | Static site generator (Extended variant required) |
| [Go](https://go.dev/dl/) | 1.25.0 | Hugo module resolution |

> **Note:** The standard Hugo variant will not work — Hugo Extended is required for the theme's asset pipeline.

## Commands

All commands must be run from the `docs/` directory.

| Command | Purpose |
|---------|---------|
| `hugo mod tidy` | Fetch or update the nebari-hugo-theme dependency |
| `hugo server` | Start local dev server with live reload at http://localhost:1313 |
| `hugo --minify` | Production build — output written to `docs/public/` |
| `hugo mod get -u && hugo mod tidy` | Upgrade theme to latest version |

## Adding content

Content lives in `docs/docs/`. Add Markdown files there; Hugo derives the URL from the filename.

- `docs/docs/_index.md` → served at `/` (the homepage)
- `docs/docs/install.md` → served at `/install/`

Add `[[params.sidebar]]` entries to `hugo.toml` to control sidebar navigation (see the [theme docs](https://github.com/nebari-dev/nebari-hugo-theme) for the expected format).
