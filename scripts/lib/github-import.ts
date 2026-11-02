import { type Prisma } from '@prisma/client';
import { IndeterminateWriteError } from './neon-http-writer';
import { type GithubClient, type GithubRepository } from './github-client';
import { parseDirectory } from './directory';
import { repositorySkipReason, verifiedOpenSource, type GithubSources } from './github-sources';
import { canonicalRepoUrl, publicHttpUrl } from './import-identity';
import { type ImportStore, type ImportCandidate, type ImportResult } from './import-store';
import { parseGithubRepoUrl } from './github';
import { hasSeoMarketingIntent } from './category-matcher';

export type ImportMode = 'all' | 'topics' | 'keywords' | 'organizations' | 'directories';
export type RunOptions = { mode: ImportMode; limit: number; newLimit?: number; maxPerSource: number; dryRun: boolean };
export interface ImportReport {
  startedAt: string;
  finishedAt?: string;
  dryRun: boolean;
  mode: ImportMode;
  limits: { total: number; perSource: number; newTools?: number };
  budgetReached: boolean;
  newToolLimitReached: boolean;
  writeIndeterminate?: boolean;
  records: { name: string; url: string; method: string; sourceUrl: string; outcome: 'skipped' | 'error' | ImportResult['action']; reason?: string; toolId?: string; slug?: string; status?: string }[];
  errors: { source: string; message: string }[];
}

export function repositoryCandidate(repo: GithubRepository, discovery: ImportCandidate['discovery'], categoryHint?: string): ImportCandidate {
  const isOpenSource = verifiedOpenSource(repo.license?.spdx_id);
  const github = canonicalRepoUrl(repo.html_url);
  if (!github) throw new Error('Invalid GitHub repository URL');
  // Repositories may omit purpose topics. Use explicit SEO/GEO/marketing
  // descriptions as a fallback while keeping a curated source hint authoritative.
  const descriptionHints = !categoryHint && repo.description && hasSeoMarketingIntent([repo.description]) ? [repo.description] : [];
  return {
    name: repo.name,
    url: repo.homepage && publicHttpUrl(repo.homepage) || github,
    description: repo.description || repo.name,
    categoryHints: [...(categoryHint ? [categoryHint] : []), ...(repo.topics || []), ...descriptionHints],
    categorySlug: categoryHint,
    github, repositoryId: String(repo.id), githubStars: repo.stargazers_count,
    isOpenSource, pricing: isOpenSource ? 'OPEN_SOURCE' : 'FREEMIUM',
    discovery: { ...discovery, metadata: { ...discovery.metadata, repositoryId: String(repo.id), licenseSpdxId: repo.license?.spdx_id || 'UNKNOWN', pricingNeedsReview: !isOpenSource, platformsNeedReview: true } },
  };
}

export async function runGithubImport(client: GithubClient, store: ImportStore, config: GithubSources, options: RunOptions): Promise<ImportReport> {
  const report: ImportReport = { startedAt: new Date().toISOString(), dryRun: options.dryRun, mode: options.mode, limits: { total: options.limit, perSource: options.maxPerSource, newTools: options.newLimit }, budgetReached: false, newToolLimitReached: false, records: [], errors: [] };
  let created = 0;
  const cache = new Map<string, GithubRepository>();
  const inBudget = () => {
    if (report.writeIndeterminate) return false;
    if (options.newLimit !== undefined && created >= options.newLimit) { report.newToolLimitReached = true; return false; }
    if (report.records.length >= options.limit) { report.budgetReached = true; return false; }
    return true;
  };
  const includeMode = (mode: ImportMode) => options.mode === 'all' || options.mode === mode;
  const record = async (candidate: ImportCandidate) => {
    const base = { name: candidate.name, url: candidate.url, method: candidate.discovery.method, sourceUrl: candidate.discovery.sourceUrl };
    try {
      const result = await store.ingest(candidate);
      if (result.action === 'created') created++;
      report.records.push({ ...base, outcome: result.action, toolId: result.toolId, slug: result.slug, status: result.status });
    } catch (error) {
      if (error instanceof IndeterminateWriteError) report.writeIndeterminate = true;
      const reason = error instanceof Error ? error.message : 'Import failed';
      report.records.push({ ...base, outcome: 'error', reason });
      report.errors.push({ source: base.sourceUrl, message: reason });
    }
  };
  const consumeRepositories = async (repos: GithubRepository[], method: string, sourceKey: string, sourceUrl: string, categoryHint?: string) => {
    for (const repo of repos) {
      if (!inBudget()) break;
      cache.set(repo.full_name.toLowerCase(), repo);
      const reason = repositorySkipReason(repo, config);
      if (reason) {
        report.records.push({ name: repo.name, url: repo.html_url, method, sourceUrl, outcome: 'skipped', reason });
      } else {
        await record(repositoryCandidate(repo, { source: 'GITHUB_REPOSITORY', method, sourceKey, sourceUrl, metadata: { repository: repo.full_name } }, categoryHint));
      }
    }
  };
  const sourceTask = async (source: string, run: () => Promise<void>) => {
    try { await run(); } catch (error) { report.errors.push({ source, message: error instanceof Error ? error.message : 'Source fetch failed' }); }
  };

  const searches = [
    ...(includeMode('topics') ? config.topics.map((s) => ({ query: `topic:${s.topic}`, categoryHint: s.categoryHint, method: 'topic' })) : []),
    ...(includeMode('keywords') ? config.keywords.map((s) => ({ ...s, method: 'keyword' })) : []),
  ];
  for (const source of searches) {
    if (!inBudget()) break;
    const query = `${source.query} is:public archived:false${/\bstars:/.test(source.query) ? '' : ` stars:>=${config.minStars}`}`;
    const sourceUrl = `https://github.com/search?${new URLSearchParams({ q: query, type: 'repositories' })}`;
    await sourceTask(sourceUrl, async () => consumeRepositories(await client.search(query, options.maxPerSource), source.method, query, sourceUrl, source.categoryHint));
  }
  if (includeMode('organizations')) for (const source of config.organizations) {
    if (!inBudget()) break;
    const sourceUrl = `https://github.com/orgs/${source.owner}/repositories`;
    await sourceTask(sourceUrl, async () => consumeRepositories(await client.organization(source.owner, options.maxPerSource), 'organization', source.owner.toLowerCase(), sourceUrl, source.categoryHint));
  }
  if (includeMode('directories')) for (const source of config.directories) {
    if (!inBudget()) break;
    const key = `${source.owner}/${source.repo}:${source.path}`;
    await sourceTask(key, async () => {
      const file = await client.directory(source.owner, source.repo, source.path, source.ref);
      const entries = parseDirectory(file.content, /\.json$/i.test(source.path) ? 'json' : 'markdown').slice(0, options.maxPerSource);
      for (const entry of entries) {
        if (!inBudget()) break;
        const sourceUrl = `${file.sourceUrl}${entry.line ? `#L${entry.line}` : ''}`;
        const metadata: Prisma.InputJsonObject = { directory: `${source.owner}/${source.repo}`, path: source.path, fileSha: file.sha, section: entry.section, itemUrl: entry.url };
        const discovery: ImportCandidate['discovery'] = { source: source.source || 'GITHUB_DIRECTORY', method: 'directory', sourceKey: `${source.owner.toLowerCase()}/${source.repo.toLowerCase()}:${source.path}`, sourceUrl, metadata };
        const parsed = entry.github && parseGithubRepoUrl(entry.github);
        if (parsed && canonicalRepoUrl(entry.github!) === canonicalRepoUrl(`https://github.com/${source.owner}/${source.repo}`)) {
          report.records.push({ name: entry.name, url: entry.url, method: 'directory', sourceUrl, outcome: 'skipped', reason: 'directory-self-link' });
          continue;
        }
        if (parsed) {
          await sourceTask(entry.url, async () => {
            const repoKey = `${parsed.owner}/${parsed.repo}`.toLowerCase();
            const repo = cache.get(repoKey) || await client.repository(parsed.owner, parsed.repo);
            cache.set(repoKey, repo);
            const reason = repositorySkipReason(repo, { ...config, minStars: 0 });
            if (reason) { report.records.push({ name: entry.name, url: entry.url, method: 'directory', sourceUrl, outcome: 'skipped', reason }); return; }
            const candidate = repositoryCandidate(repo, discovery, source.categoryHint);
            // A directory may link the website and separately supply its repo.
            candidate.url = canonicalRepoUrl(entry.url) ? candidate.url : entry.url;
            candidate.name = entry.name;
            candidate.description = entry.description === entry.name ? candidate.description : entry.description;
            candidate.categoryHints.push(entry.section);
            await record(candidate);
          });
        } else {
          await record({ name: entry.name, url: entry.url, description: entry.description, categoryHints: [source.categoryHint, entry.section].filter((hint): hint is string => Boolean(hint)), categorySlug: source.categoryHint, discovery: { ...discovery, metadata: { ...metadata, pricingNeedsReview: true, platformsNeedReview: true, licenseNeedsReview: true } } });
        }
      }
    });
  }
  report.finishedAt = new Date().toISOString();
  report.newToolLimitReached = options.newLimit !== undefined && created >= options.newLimit;
  return report;
}
