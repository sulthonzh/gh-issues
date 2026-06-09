'use strict';

const { execSync } = require('child_process');

function ghAvailable() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getRepos(user) {
  const args = ['gh', 'repo', 'list', user, '--limit', '500', '--json', 'nameWithOwner,isFork', '--jq', '.[] | select(.isFork == false) | .nameWithOwner'];
  const out = execSync(args.join(' '), { encoding: 'utf-8', timeout: 30000 });
  return out.trim().split('\n').filter(Boolean);
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / 86400000);
}

function getIssuesForRepo(repo) {
  const args = ['gh', 'issue', 'list', '--repo', repo, '--state', 'open', '--limit', '100', '--json', 'number,title,author,labels,createdAt,updatedAt,comments,assignees,milestone'];
  try {
    const out = execSync(args.join(' '), { encoding: 'utf-8', timeout: 15000 });
    return JSON.parse(out).map(issue => ({
      repo,
      number: issue.number,
      title: issue.title,
      author: issue.author?.login || 'unknown',
      labels: (issue.labels || []).map(l => l.name),
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      comments: issue.comments || 0,
      assignees: (issue.assignees || []).map(a => a.login),
      milestone: issue.milestone?.title || null,
      age: daysSince(issue.createdAt),
      stale: daysSince(issue.updatedAt) > 30
    }));
  } catch {
    return [];
  }
}

function getAllIssues(user) {
  const repos = getRepos(user);
  const all = [];
  for (const repo of repos) {
    const issues = getIssuesForRepo(repo);
    all.push(...issues);
  }
  return all;
}

function formatText(issues, opts = {}) {
  if (!issues.length) return 'No open issues across your repos 🎉';

  const lines = [];
  const top = opts.top || issues.length;

  // Sort by age descending (oldest first)
  const sorted = [...issues].sort((a, b) => b.age - a.age).slice(0, top);

  for (const issue of sorted) {
    const staleIcon = issue.stale ? ' 🕐 stale' : '';
    const labels = issue.labels.length ? ` [${issue.labels.join(', ')}]` : '';
    const milestone = issue.milestone ? ` 📌 ${issue.milestone}` : '';
    lines.push(`${issue.repo}#${issue.number} — ${issue.title}`);
    lines.push(`  by @${issue.author} · ${issue.age}d old · ${issue.comments} comments${staleIcon}${labels}${milestone}`);
    lines.push('');
  }

  lines.push(`Total: ${issues.length} open issue${issues.length !== 1 ? 's' : ''} across ${new Set(issues.map(i => i.repo)).size} repo${new Set(issues.map(i => i.repo)).size !== 1 ? 's' : ''}`);

  // Stale summary
  const staleCount = issues.filter(i => i.stale).length;
  if (staleCount > 0) {
    lines.push(`Stale (>30d no update): ${staleCount}`);
  }

  // Label breakdown
  const labelCounts = {};
  for (const i of issues) {
    for (const l of i.labels) {
      labelCounts[l] = (labelCounts[l] || 0) + 1;
    }
  }
  const topLabels = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topLabels.length) {
    lines.push(`Top labels: ${topLabels.map(([l, c]) => `${l} (${c})`).join(', ')}`);
  }

  return lines.join('\n');
}

function formatJSON(issues) {
  return JSON.stringify({ total: issues.length, issues }, null, 2);
}

function formatMarkdown(issues) {
  if (!issues.length) return '_No open issues across your repos_ 🎉';

  const lines = [`# Open Issues (${issues.length})`, ''];
  const byRepo = {};
  for (const i of issues) {
    (byRepo[i.repo] ||= []).push(i);
  }

  for (const [repo, repoIssues] of Object.entries(byRepo).sort()) {
    lines.push(`## ${repo}`);
    lines.push('');
    for (const i of repoIssues) {
      const stale = i.stale ? ' ⚠️ _stale_' : '';
      const labels = i.labels.length ? ` \`${i.labels.join('` `')}\`` : '';
      lines.push(`- [#${i.number}](https://github.com/${i.repo}/issues/${i.number}) ${i.title} — @${i.author} (${i.age}d)${stale}${labels}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { user: null, json: false, markdown: false, top: null, repo: null, labels: null };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--markdown' || arg === '--md') args.markdown = true;
    else if (arg === '--user' && argv[i + 1]) { args.user = argv[++i]; }
    else if (arg === '--top' && argv[i + 1]) { args.top = parseInt(argv[++i], 10); }
    else if (arg === '--repo' && argv[i + 1]) { args.repo = argv[++i]; }
    else if (arg === '--label' && argv[i + 1]) { args.labels = argv[++i].split(','); }
    else if (arg === '--help' || arg === '-h') {
      args.help = true;
      return args;
    }
  }

  return args;
}

module.exports = { ghAvailable, getRepos, daysSince, getIssuesForRepo, getAllIssues, formatText, formatJSON, formatMarkdown, parseArgs };
