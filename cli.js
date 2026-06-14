#!/usr/bin/env node
'use strict';

const { ghAvailable, getAllIssues, getIssuesForRepo, formatText, formatJSON, formatMarkdown, parseArgs } = require('./src/index');

const helpText = `gh-issues — see open issues across all your GitHub repos

Usage:
  gh-issues                    show open issues across your repos
  gh-issues --user <user>      check another user's repos
  gh-issues --repo <owner/repo> check a single repo
  gh-issues --label bug,help   filter by labels

Options:
  --user <user>       target GitHub user (default: authenticated user)
  --repo <owner/repo> check a single repository
  --top <n>           show only the top N oldest issues
  --label <labels>    filter by comma-separated label names
  --json              output as JSON
  --markdown, --md    output as markdown
  -h, --help          show this help

Examples:
  gh-issues                      # your repos, text output
  gh-issues --user torvalds      # someone else's repos
  gh-issues --repo nodejs/node   # single repo
  gh-issues --top 10             # oldest 10 issues
  gh-issues --label bug,enhancement  # only bug and enhancement issues
`;

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(helpText);
    process.exit(0);
  }

  if (!ghAvailable()) {
    console.error('Error: gh CLI not found. Install from https://cli.github.com');
    process.exit(2);
  }

  let issues;

  if (args.repo) {
    issues = getIssuesForRepo(args.repo);
  } else {
    const user = args.user || execSync('gh api user --jq .login', { encoding: 'utf-8' }).trim();
    issues = getAllIssues(user);
  }

  if (args.labels) {
    issues = issues.filter(i => args.labels.some(l => i.labels.includes(l)));
  }

  if (args.json) {
    console.log(formatJSON(issues));
  } else if (args.markdown) {
    console.log(formatMarkdown(issues));
  } else {
    console.log(formatText(issues, { top: args.top }));
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

const { execSync } = require('child_process');
main();
