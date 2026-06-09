import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { daysSince, formatText, formatJSON, formatMarkdown, parseArgs } from '../src/index.js';

describe('daysSince', () => {
  it('returns 0 for today', () => {
    assert.equal(daysSince(new Date().toISOString()), 0);
  });

  it('returns correct days for past date', () => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    assert.equal(daysSince(d.toISOString()), 5);
  });

  it('returns Infinity for null', () => {
    assert.equal(daysSince(null), Infinity);
  });
});

describe('formatText', () => {
  it('shows no-issues message when empty', () => {
    const out = formatText([]);
    assert.ok(out.includes('No open issues'));
  });

  it('formats issues with details', () => {
    const issues = [{
      repo: 'user/repo', number: 42, title: 'Bug fix needed',
      author: 'dev', labels: ['bug'], createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), comments: 3, assignees: [],
      milestone: null, age: 0, stale: false
    }];
    const out = formatText(issues);
    assert.ok(out.includes('user/repo#42'));
    assert.ok(out.includes('Bug fix needed'));
    assert.ok(out.includes('[bug]'));
    assert.ok(out.includes('Total: 1'));
  });

  it('shows stale indicator for stale issues', () => {
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const issues = [{
      repo: 'u/r', number: 1, title: 'Old',
      author: 'a', labels: [], createdAt: old.toISOString(),
      updatedAt: old.toISOString(), comments: 0, assignees: [],
      milestone: null, age: 60, stale: true
    }];
    const out = formatText(issues);
    assert.ok(out.includes('stale'));
    assert.ok(out.includes('Stale'));
  });

  it('respects top option', () => {
    const issues = [1, 2, 3].map(i => ({
      repo: 'u/r', number: i, title: `Issue ${i}`,
      author: 'a', labels: [], createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), comments: 0, assignees: [],
      milestone: null, age: i, stale: false
    }));
    const out = formatText(issues, { top: 2 });
    assert.ok(out.includes('Total: 3'));
    // Should only show 2 issue details
    const matches = out.match(/u\/r#\d+ —/g);
    assert.equal(matches.length, 2);
  });
});

describe('formatJSON', () => {
  it('outputs valid JSON with issues', () => {
    const issues = [{ repo: 'u/r', number: 1, title: 'T', author: 'a', labels: [], createdAt: '', updatedAt: '', comments: 0, assignees: [], milestone: null, age: 0, stale: false }];
    const parsed = JSON.parse(formatJSON(issues));
    assert.equal(parsed.total, 1);
    assert.equal(parsed.issues[0].repo, 'u/r');
  });

  it('handles empty issues', () => {
    const parsed = JSON.parse(formatJSON([]));
    assert.equal(parsed.total, 0);
  });
});

describe('formatMarkdown', () => {
  it('shows celebration for no issues', () => {
    assert.ok(formatMarkdown([]).includes('No open issues'));
  });

  it('groups issues by repo', () => {
    const issues = [
      { repo: 'a/r1', number: 1, title: 'One', author: 'a', labels: [], createdAt: '', updatedAt: '', comments: 0, assignees: [], milestone: null, age: 0, stale: false },
      { repo: 'a/r2', number: 2, title: 'Two', author: 'b', labels: ['bug'], createdAt: '', updatedAt: '', comments: 0, assignees: [], milestone: null, age: 0, stale: false }
    ];
    const md = formatMarkdown(issues);
    assert.ok(md.includes('## a/r1'));
    assert.ok(md.includes('## a/r2'));
    assert.ok(md.includes('[#1]'));
    assert.ok(md.includes('`bug`'));
  });

  it('shows stale warning', () => {
    const issues = [{ repo: 'u/r', number: 1, title: 'Old', author: 'a', labels: [], createdAt: '', updatedAt: '', comments: 0, assignees: [], milestone: null, age: 60, stale: true }];
    assert.ok(formatMarkdown(issues).includes('stale'));
  });
});

describe('parseArgs', () => {
  it('parses no args as defaults', () => {
    const args = parseArgs(['node', 'cli']);
    assert.equal(args.user, null);
    assert.equal(args.json, false);
    assert.equal(args.markdown, false);
    assert.equal(args.top, null);
    assert.equal(args.repo, null);
  });

  it('parses --json', () => {
    assert.ok(parseArgs(['node', 'cli', '--json']).json);
  });

  it('parses --markdown', () => {
    assert.ok(parseArgs(['node', 'cli', '--markdown']).markdown);
  });

  it('parses --md as markdown', () => {
    assert.ok(parseArgs(['node', 'cli', '--md']).markdown);
  });

  it('parses --user', () => {
    assert.equal(parseArgs(['node', 'cli', '--user', 'torvalds']).user, 'torvalds');
  });

  it('parses --top', () => {
    assert.equal(parseArgs(['node', 'cli', '--top', '10']).top, 10);
  });

  it('parses --repo', () => {
    assert.equal(parseArgs(['node', 'cli', '--repo', 'nodejs/node']).repo, 'nodejs/node');
  });

  it('parses --label', () => {
    const args = parseArgs(['node', 'cli', '--label', 'bug,enhancement']);
    assert.deepEqual(args.labels, ['bug', 'enhancement']);
  });

  it('parses --help', () => {
    assert.ok(parseArgs(['node', 'cli', '--help']).help);
  });
});
