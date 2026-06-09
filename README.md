# gh-issues

See open issues across all your GitHub repos at a glance.

Ever wanted a quick view of what's open across your repos without clicking through GitHub one by one? This does that.

## Why

You maintain multiple open-source repos. Issues pile up. Some go stale. You lose track. `gh-issues` gives you a single view of everything open, sorted by age, with label breakdowns and stale detection.

## Quick Start

```bash
npm install -g gh-issues
gh-issues
```

That's it. It uses your existing `gh` CLI auth — no tokens, no config.

## Usage

```bash
# All your repos
gh-issues

# Someone else's repos
gh-issues --user torvalds

# Single repo
gh-issues --repo nodejs/node

# Oldest 10 issues only
gh-issues --top 10

# Filter by labels
gh-issues --label bug,enhancement

# JSON output (pipe to jq, scripts, etc.)
gh-issues --json

# Markdown (paste into docs, PRs)
gh-issues --markdown
```

## What You Get

**Text output** (default):
```
user/repo#42 — Fix memory leak in worker pool
  by @dev · 45d old · 3 comments 🕐 stale [bug]

user/repo#38 — Add dark mode support
  by @contrib · 12d old · 1 comments [enhancement]

Total: 2 open issues across 1 repo
Stale (>30d no update): 1
Top labels: bug (1), enhancement (1)
```

**Stale detection**: Issues with no updates in 30+ days get flagged so you can triage.

**Label breakdown**: See which labels dominate your backlog at a glance.

## Requirements

- [gh CLI](https://cli.github.com) installed and authenticated
- Node.js 18+

## Exit Codes

- `0` — no open issues found (clean!)
- `1` — issues found (useful for CI checks)
- `2` — error (gh not found, auth issue, etc.)

## As a Module

```js
const { getAllIssues, getIssuesForRepo, formatText } = require('gh-issues');

// Get all issues for a user
const issues = await getAllIssues('torvalds');

// Get issues for a specific repo
const repoIssues = getIssuesForRepo('torvalds/linux');

// Format output
console.log(formatText(issues));
```

## License

MIT
