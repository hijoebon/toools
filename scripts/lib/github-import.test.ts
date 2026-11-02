import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDirectory } from './directory';
import { GithubClient, type GithubRepository } from './github-client';
import { canonicalRepoUrl, identityKeys, normalizedToolUrl, publicHttpUrl } from './import-identity';
import { validateSources, verifiedOpenSource, repositorySkipReason } from './github-sources';
import { parseImportOptions } from './import-options';
import { ImportStore } from './import-store';
import { runGithubImport, repositoryCandidate } from './github-import';
import { NeonDbError } from '@neondatabase/serverless';
import { matchCategory } from './category-matcher';
import { IndeterminateWriteError, definiteDatabaseRejection, NeonHttpWriter } from './neon-http-writer';

export const repoFixture = (overrides: Partial<GithubRepository> = {}): GithubRepository => ({
  id: 101, name: 'Flow', full_name: 'team/flow', description: 'Workflow automation tool',
  html_url: 'https://github.com/team/flow', homepage: 'https://flow.example', topics: ['automation'],
  stargazers_count: 100, archived: false, disabled: false, fork: false, default_branch: 'trunk',
  license: { spdx_id: 'MIT' }, ...overrides,
});
const response = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init);
const noSleep = async () => {};

test('identity normalization matches GitHub case, .git, trackers and website aliases without dropping app queries', () => {
  assert.equal(canonicalRepoUrl('http://www.github.com/Team/Flow.git/'), 'https://github.com/team/flow');
  assert.equal(normalizedToolUrl('https://www.flow.example/?utm_source=github'), normalizedToolUrl('http://flow.example'));
  assert.notEqual(normalizedToolUrl('https://tools.example/?app=one'), normalizedToolUrl('https://tools.example/?app=two'));
  assert.equal(normalizedToolUrl('https://tools.example/?b=2&a=1#section'), 'tools.example?a=1&b=2');
  assert(identityKeys({ url: 'https://flow.example', github: 'https://github.com/team/flow', repositoryId: '101' }).includes('github-id:101'));
  for (const value of ['https://github.com/topics/automation', 'https://github.com/orgs/team', 'https://github.com/team/flow/tree/main/plugin', 'https://github.com.evil.example/team/flow']) assert.equal(canonicalRepoUrl(value), null);
  for (const value of ['javascript:alert(1)', 'https://user:password@flow.example', 'http://localhost:3000', 'http://127.0.0.1', 'http://[::1]', '/relative']) assert.equal(publicHttpUrl(value), null);
});

test('generic Markdown directory supports lists, tables, reference links and numbered items, preserving source lines', () => {
  const markdown = ['# Directory', '## Automation', '- **[Flow](https://flow.example)** — Workflow tool', '| [CLI](https://github.com/team/cli) | Terminal tool |', '+ [Notes][notes] - Write notes', '1. [Editor](https://editor.example) : Edit files', '- [Anchor](#local)', '- [Badge](https://shields.io/badge/demo)', '```md', '- [Fake](https://fake.example)', '```', '[notes]: https://notes.example'].join('\n');
  const entries = parseDirectory(markdown);
  assert.deepEqual(entries.map((item) => item.name), ['Flow', 'CLI', 'Notes', 'Editor']);
  assert.equal(entries[0].line, 3);
  assert.equal(entries[0].section, 'Automation');
  assert.equal(entries[0].description, 'Workflow tool');
  assert.equal(entries[1].github, 'https://github.com/team/cli');
  assert.equal(entries[1].description, 'Terminal tool');
  assert.equal(parseDirectory('- [Tool](https://tool.example/a_(b)) - Has parentheses')[0]?.url, 'https://tool.example/a_(b)');
});

test('JSON directories support arrays and tools objects, with explicit repo links and untrusted values filtered', () => {
  const valid = { name: 'Flow', url: 'https://flow.example', description: 'Automation', category: 'automation', github: 'https://github.com/TEAM/Flow.git' };
  for (const value of [[valid], { tools: [valid, { name: 'Bad', url: 'javascript:alert(1)' }, { url: 'https://bad.example' }] }]) {
    const entries = parseDirectory(JSON.stringify(value), 'json');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].github, 'https://github.com/team/flow');
    assert.equal(entries[0].section, 'automation');
  }
  assert.throws(() => parseDirectory('{"items":[]}', 'json'), /tools array/);
  assert.throws(() => parseDirectory('invalid', 'json'));
});

test('a reference-style tool link precedes inline documentation and empty hints never override its section', async () => {
  const content = '## Security\n- [Flow][flow] - Security tool ([Docs](https://docs.flow.example))\n[flow]: https://flow.example';
  const entries = parseDirectory(content);
  assert.equal(entries[0].name, 'Flow');
  assert.equal(entries[0].url, 'https://flow.example/');
  assert.equal(matchCategory(['', 'Security']), 'security-privacy');
  assert.equal(matchCategory(['  ', 'Security']), 'security-privacy');
  const received: string[] = [];
  const store = new ImportStore();
  const original = store.ingest.bind(store);
  store.ingest = async (candidate) => { received.push(matchCategory(candidate.categoryHints)); return original(candidate); };
  const client = new GithubClient({ sleep: noSleep, fetch: async () => response({ type: 'file', encoding: 'base64', content: Buffer.from(content).toString('base64'), html_url: 'https://github.com/team/catalog/blob/main/README.md', sha: 'abc' }) });
  await runGithubImport(client, store, validateSources({ directories: [{ owner: 'team', repo: 'catalog', path: 'README.md' }] }), { mode: 'directories', dryRun: true, limit: 10, maxPerSource: 10 });
  assert.deepEqual(received, ['security-privacy']);
});

test('source configuration rejects unsafe paths and malformed allowlists', () => {
  assert.equal(validateSources({ organizations: [{ owner: 'microsoft' }] }).minStars, 50);
  for (const value of [{ minStars: -1 }, { topics: [{ topic: 'ai agent' }] }, { organizations: [{ owner: '../outside' }] }, { directories: [{ owner: 'team', repo: 'repo', path: '../file.md' }] }, { directories: [{ owner: 'team', repo: 'repo', path: 'file.yml' }] }, { directories: [{ owner: 'team', repo: 'repo', path: 'README.md', source: 'MANUAL' }] }]) assert.throws(() => validateSources(value));
});

test('CLI enforces bounded budgets and has no auto-approval flag', () => {
  assert.equal(parseImportOptions(['--dry-run', '--mode', 'topics', '--limit', '10']).dryRun, true);
  assert.equal(parseImportOptions(['--new-limit', '500']).newLimit, 500);
  for (const args of [['--limit', '0'], ['--limit', 'NaN'], ['--new-limit', '0'], ['--new-limit', 'NaN'], ['--max-per-source', '1001'], ['--mode', 'trending'], ['--auto-approve']]) assert.throws(() => parseImportOptions(args));
});

test('repository filtering rejects non-tool discovery noise and does not treat unknown licenses as open source', () => {
  const config = validateSources({});
  assert.equal(repositorySkipReason(repoFixture(), config), null);
  for (const overrides of [{ private: true }, { fork: true }, { archived: true }, { disabled: true }, { is_template: true }, { stargazers_count: 1 }, { description: null }, { topics: ['sdk'] }, { name: 'awesome-tools' }]) assert(repositorySkipReason(repoFixture(overrides), config));
  assert(verifiedOpenSource('MIT'));
  assert(verifiedOpenSource('GPL-3.0-or-later'));
  for (const spdx of [null, 'NOASSERTION', 'LicenseRef-Custom', 'BUSL-1.1']) assert.equal(verifiedOpenSource(spdx), false);
  const candidate = repositoryCandidate(repoFixture({ license: null }), { source: 'GITHUB_REPOSITORY', method: 'topic', sourceKey: 'topic:automation', sourceUrl: 'https://github.com/topics/automation' });
  assert.equal(candidate.isOpenSource, false);
  assert.equal(candidate.discovery.metadata?.pricingNeedsReview, true);
});

test('repository descriptions recover SEO and GEO purpose when GitHub topics omit it', () => {
  const discovery = { source: 'GITHUB_REPOSITORY' as const, method: 'keyword', sourceKey: 'crawler', sourceUrl: 'https://github.com/search?q=crawler' };
  for (const metadata of [
    { name: 'Site Auditor', topics: ['crawler', 'golang'], description: 'A self-hosted SEO crawler for technical audits and broken-link reports' },
    { name: 'Search Visibility', topics: ['ai', 'llm', 'gpt', 'sdk', 'typescript'], description: 'Measure AI search visibility and optimize brand presence in generative search' },
    { name: 'Campaign Manager', topics: [], description: 'Self-hosted newsletter and email campaign manager' },
  ]) {
    const candidate = repositoryCandidate(repoFixture(metadata), discovery);
    assert.equal(candidate.categorySlug, undefined);
    assert(candidate.categoryHints.includes(metadata.description));
    assert.equal(matchCategory(candidate.categoryHints), 'seo-marketing', metadata.name);
  }
});

test('description fallback does not force generic crawlers or geographic GEO projects into marketing', () => {
  const discovery = { source: 'GITHUB_REPOSITORY' as const, method: 'topic', sourceKey: 'crawler', sourceUrl: 'https://github.com/topics/crawler' };
  for (const metadata of [
    { topics: ['crawler', 'framework'], description: 'A crawler framework for extracting structured data from websites' },
    { topics: ['geo', 'geospatial'], description: 'Geospatial indexing and geometry calculations for mapping applications' },
  ]) {
    const candidate = repositoryCandidate(repoFixture(metadata), discovery);
    assert.deepEqual(candidate.categoryHints, metadata.topics);
    assert.notEqual(matchCategory(candidate.categoryHints), 'seo-marketing');
  }
  const curated = repositoryCandidate(repoFixture({ topics: ['framework'], description: 'A framework with SEO integrations' }), discovery, 'development');
  assert.equal(curated.categorySlug, 'development');
  assert.deepEqual(curated.categoryHints, ['development', 'framework']);
});

test('GitHub search paginates with a fixed page size, never duplicating the final partial page', async () => {
  const seen: number[] = [];
  const client = new GithubClient({ sleep: noSleep, fetch: async (input, init) => {
    const url = new URL(String(input));
    const page = Number(url.searchParams.get('page'));
    const size = Number(url.searchParams.get('per_page'));
    seen.push(size);
    assert.equal(init?.redirect, 'manual');
    return response({ total_count: 250, incomplete_results: false, items: Array.from({ length: size }, (_, i) => repoFixture({ id: (page - 1) * size + i + 1 })) });
  } });
  const repos = await client.search('topic:automation', 150);
  assert.deepEqual(seen, [100, 100]);
  assert.equal(repos.length, 150);
  assert.equal(new Set(repos.map((r) => r.id)).size, 150);
  assert.equal(repos[149].id, 150);
});

test('GitHub API rejects incomplete search and permanent failures, and retries short rate limits', async () => {
  await assert.rejects(new GithubClient({ sleep: noSleep, fetch: async () => response({ incomplete_results: true, items: [], total_count: 1 }) }).search('topic:automation', 10), /Incomplete/);
  let attempts = 0;
  const waits: number[] = [];
  const client = new GithubClient({ token: 'private-test-token', sleep: async (ms) => { waits.push(ms); }, fetch: async (_input, init) => {
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer private-test-token');
    if (++attempts === 1) return response({}, { status: 429, headers: { 'retry-after': '2' } });
    return response(repoFixture());
  } });
  assert.equal((await client.repository('team', 'flow')).id, 101);
  assert.equal(attempts, 2);
  assert(waits.includes(2000));
  await assert.rejects(new GithubClient({ fetch: async () => response({}, { status: 401 }) }).repository('team', 'flow'), /401/);
  await assert.rejects(new GithubClient({ sleep: noSleep, fetch: async () => response({}, { status: 429, headers: { 'retry-after': '3600' } }) }).repository('team', 'flow'), /quota resets/);
});

test('repository redirects remain inside GitHub API and never send tokens to external hosts', async () => {
  const requests: string[] = [];
  const client = new GithubClient({ token: 'private-test-token', sleep: noSleep, fetch: async (input) => {
    requests.push(String(input));
    return requests.length === 1 ? response({}, { status: 301, headers: { location: 'https://api.github.com/repositories/101' } }) : response(repoFixture());
  } });
  assert.equal((await client.repository('old-owner', 'flow')).id, 101);
  assert.deepEqual(requests, ['https://api.github.com/repos/old-owner/flow', 'https://api.github.com/repositories/101']);
  let externalRequests = 0;
  const unsafe = new GithubClient({ token: 'private-test-token', fetch: async () => { externalRequests++; return response({}, { status: 301, headers: { location: 'https://external.example/steal' } }); } });
  await assert.rejects(unsafe.repository('team', 'flow'), /Unsafe/);
  assert.equal(externalRequests, 1);
});

test('topic, keyword, allowlisted organization and directory discoveries resolve to one PENDING candidate', async () => {
  const paths: string[] = [];
  const client = new GithubClient({ sleep: noSleep, fetch: async (input) => {
    const url = new URL(String(input)); paths.push(url.pathname);
    if (url.pathname === '/search/repositories') return response({ total_count: 1, incomplete_results: false, items: [repoFixture()] });
    if (url.pathname === '/orgs/team/repos') return response([repoFixture()]);
    if (url.pathname === '/repos/team/catalog/contents/README.md') return response({ type: 'file', encoding: 'base64', content: Buffer.from('## Automation\n- [Flow](https://github.com/team/flow) - Workflow automation').toString('base64'), html_url: 'https://github.com/team/catalog/blob/trunk/README.md', sha: 'abc' });
    throw new Error(`Unexpected API path ${url.pathname}`);
  } });
  const config = validateSources({ topics: [{ topic: 'automation' }], keywords: [{ query: 'workflow' }], organizations: [{ owner: 'team' }], directories: [{ owner: 'team', repo: 'catalog', path: 'README.md' }] });
  const report = await runGithubImport(client, new ImportStore(), config, { mode: 'all', dryRun: true, limit: 10, maxPerSource: 10 });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.records.map((r) => r.outcome), ['created', 'updated', 'updated', 'updated']);
  assert(report.records.every((r) => r.status === 'PENDING'));
  assert.equal(new Set(report.records.map((r) => r.toolId)).size, 1);
  assert.equal(paths.length, 4);
  assert.equal(report.records[3].sourceUrl, 'https://github.com/team/catalog/blob/trunk/README.md#L2');
});

test('run budget stops API discovery and source failures remain visible in the report', async () => {
  let calls = 0;
  const config = validateSources({ topics: [{ topic: 'automation' }, { topic: 'productivity' }] });
  const client = new GithubClient({ sleep: noSleep, fetch: async () => { calls++; return response({ total_count: 1, incomplete_results: false, items: [repoFixture()] }); } });
  const report = await runGithubImport(client, new ImportStore(), config, { mode: 'all', dryRun: true, limit: 1, maxPerSource: 10 });
  assert.equal(calls, 1);
  assert.equal(report.budgetReached, true);
  const failed = await runGithubImport(new GithubClient({ sleep: noSleep, fetch: async () => response({}, { status: 404 }) }), new ImportStore(), config, { mode: 'topics', dryRun: true, limit: 10, maxPerSource: 10 });
  assert.equal(failed.errors.length, 2);
  assert.equal(failed.records.length, 0);
});

test('dry-run catches unrelated repositories sharing the same website', async () => {
  const store = new ImportStore();
  const discovery = { source: 'GITHUB_REPOSITORY' as const, method: 'topic', sourceKey: 'automation', sourceUrl: 'https://github.com/topics/automation' };
  await store.ingest(repositoryCandidate(repoFixture(), discovery));
  await assert.rejects(store.ingest(repositoryCandidate(repoFixture({ id: 102, html_url: 'https://github.com/team/unrelated' }), discovery)), /Identity conflict/);
});

test('new-tool cap ignores duplicates and filtered repositories and stops before an extra insert', async () => {
  const one = repoFixture();
  const two = repoFixture({ id: 102, name: 'Second', full_name: 'team/second', html_url: 'https://github.com/team/second', homepage: 'https://second.example' });
  const three = repoFixture({ id: 103, name: 'Third', full_name: 'team/third', html_url: 'https://github.com/team/third', homepage: 'https://third.example' });
  const client = new GithubClient({ sleep: noSleep, fetch: async () => response({ total_count: 5, incomplete_results: false, items: [one, one, repoFixture({ fork: true }), two, three] }) });
  const report = await runGithubImport(client, new ImportStore(), validateSources({ topics: [{ topic: 'automation' }] }), { mode: 'topics', dryRun: true, limit: 10, maxPerSource: 10, newLimit: 2 });
  assert.deepEqual(report.records.map(r => r.outcome), ['created', 'updated', 'skipped', 'created']);
  assert.equal(report.newToolLimitReached, true);
  assert(report.records.filter(r => r.outcome === 'created').every(r => r.status === 'PENDING'));
});


test('an indeterminate committed write stops all later candidates and source families', async () => {
  let attempts = 0;
  let requests = 0;
  const store = new ImportStore();
  store.ingest = async () => { attempts++; throw new IndeterminateWriteError(); };
  const client = new GithubClient({ sleep: noSleep, fetch: async () => {
    requests++;
    return response({ total_count: 2, incomplete_results: false, items: [repoFixture(), repoFixture({ id: 102, name: 'Next', homepage: 'https://next.example' })] });
  } });
  const config = validateSources({ topics: [{ topic: 'automation' }, { topic: 'productivity' }], organizations: [{ owner: 'microsoft' }], directories: [{ owner: 'team', repo: 'catalog', path: 'README.md' }] });
  const report = await runGithubImport(client, store, config, { mode: 'all', dryRun: false, limit: 100, newLimit: 1, maxPerSource: 10 });
  assert.equal(attempts, 1);
  assert.equal(requests, 1);
  assert.equal(report.writeIndeterminate, true);
  assert.equal(report.records.length, 1);
  assert.equal(report.errors.length, 1);
  assert.equal(report.newToolLimitReached, false);
});


test('gateway and malformed responses remain indeterminate while SQL rejections are definite', () => {
  for (const message of ['Server error (HTTP status 504): Gateway Timeout', 'Server error (HTTP status 502): Bad Gateway', 'Unexpected token in JSON', 'unexpected result format']) {
    assert.equal(definiteDatabaseRejection(new NeonDbError(message)), false);
  }
  const rejection = new NeonDbError('Identity conflict');
  rejection.code = 'P0001';
  assert.equal(definiteDatabaseRejection(rejection), true);
  for (const code of ['08007', '40003', '57P01', '57P02']) { rejection.code = code; assert.equal(definiteDatabaseRejection(rejection), false); }
});


test('a rejected replay cannot disprove an earlier indeterminate commit', async () => {
  const writer = new NeonHttpWriter('postgresql://test:test@ep-test.neon.tech/test');
  let attempts = 0;
  const rejection = new NeonDbError('Identity conflict'); rejection.code = 'P0001';
  Object.assign(writer, { sql: {
    query: () => undefined,
    transaction: async () => { if (++attempts === 1) throw new NeonDbError('Server error (HTTP status 504): Gateway Timeout'); throw rejection; },
  } });
  const candidate = repositoryCandidate(repoFixture(), { source: 'GITHUB_REPOSITORY', method: 'topic', sourceKey: 'automation', sourceUrl: 'https://github.com/topics/automation' });
  await assert.rejects(writer.persist(candidate, identityKeys(candidate), [], [], 'test-category', 'flow'), IndeterminateWriteError);
  assert.equal(attempts, 2);
});


test('GitHub reads retry network timeouts and keep small request pages bounded', async () => {
  let attempts = 0;
  const client = new GithubClient({ sleep: noSleep, fetch: async (input) => {
    assert.equal(new URL(String(input)).searchParams.get('per_page'), '50');
    if (++attempts === 1) throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    return response({ total_count: 1, incomplete_results: false, items: [repoFixture()] });
  } });
  assert.equal((await client.search('topic:automation',50)).length,1);
  assert.equal(attempts,2);
});
