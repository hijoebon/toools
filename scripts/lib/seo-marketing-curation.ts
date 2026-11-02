import { getGoogleFaviconUrl } from "./favicon";
import { canonicalRepoUrl, identityKeys, normalizedToolUrl, publicHttpUrl } from "./import-identity";
import { verifiedOpenSource } from "./github-sources";
import { marketingGeoStage, marketingGrowthStack } from "../../src/lib/marketing-growth-stack";

export interface SeoMarketingTool {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  url: string;
  github: string;
  pricing: "FREE" | "FREEMIUM" | "PAID" | "OPEN_SOURCE";
  isOpenSource: boolean;
  tags: string[];
  useCases: string[];
  platforms?: string[];
  repositoryId: string;
  licenseSpdxId: string;
  reviewedAt: string;
  sources: string[];
}

function literal(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function tagSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function reviewedTools(input: unknown) {
  if (!Array.isArray(input) || !input.length) throw new Error("A nonempty reviewed tool array is required");
  const slugs = new Set<string>();
  const identities = new Set<string>();
  return input.map((value: SeoMarketingTool) => {
    if (!value || typeof value !== "object") throw new Error("Invalid reviewed tool");
    for (const key of ["name", "slug", "tagline", "description", "url", "github", "repositoryId", "licenseSpdxId", "reviewedAt"] as const) {
      if (typeof value[key] !== "string" || !value[key].trim()) throw new Error(`Missing ${key}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) || slugs.has(value.slug)) throw new Error(`Invalid or duplicate slug: ${value.slug}`);
    if (!/^[1-9]\d*$/.test(value.repositoryId)) throw new Error(`Invalid repository ID: ${value.slug}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.reviewedAt) || !Number.isFinite(Date.parse(value.reviewedAt))) throw new Error(`Invalid review date: ${value.slug}`);
    if (!["FREE", "FREEMIUM", "PAID", "OPEN_SOURCE"].includes(value.pricing)) throw new Error(`Invalid pricing: ${value.slug}`);
    if (typeof value.isOpenSource !== "boolean" || (value.isOpenSource && !verifiedOpenSource(value.licenseSpdxId)) || (value.pricing === "OPEN_SOURCE" && !value.isOpenSource)) throw new Error(`Unverified open-source license: ${value.slug}`);
    const github = canonicalRepoUrl(value.github);
    const url = publicHttpUrl(value.url);
    if (!github || !url) throw new Error(`Invalid public tool URL: ${value.slug}`);
    for (const key of ["tags", "useCases", "sources"] as const) {
      if (!Array.isArray(value[key]) || !value[key].length || value[key].some((item) => typeof item !== "string" || !item.trim())) throw new Error(`Invalid ${key}: ${value.slug}`);
    }
    if (value.sources.some((source) => !publicHttpUrl(source))) throw new Error(`Invalid review source: ${value.slug}`);
    if (value.platforms !== undefined && (!Array.isArray(value.platforms) || value.platforms.some((platform) => typeof platform !== "string" || !platform.trim()))) throw new Error(`Invalid platforms: ${value.slug}`);
    const keys = identityKeys({ url, github, repositoryId: value.repositoryId });
    if (keys.some((key) => identities.has(key))) throw new Error(`Duplicate reviewed identity: ${value.slug}`);
    slugs.add(value.slug);
    keys.forEach((key) => identities.add(key));
    const tagRecords = [...new Set(value.tags)].map((name) => ({ name, slug: tagSlug(name) }));
    if (tagRecords.some((tag) => !tag.slug)) throw new Error(`Invalid tag: ${value.slug}`);
    return { ...value, github, url, identityKeys: keys, normalizedUrl: normalizedToolUrl(url), repoKey: github.replace("https://", ""), iconUrl: getGoogleFaviconUrl(url), tagRecords };
  });
}

// Normalize legacy repository spellings before aliases existed. Website matching
// retains path case and meaningful query strings; existing aliases cover tracked URLs.
const normalizedRepoSql = (value: string) => `lower(regexp_replace(regexp_replace(regexp_replace(${value}, '^https?://(www\\.)?', '', 'i'), '[?#].*$', ''), '(\\.git)?/+$|\\.git$', ''))`;
const normalizedWebsiteSql = (value: string) => `lower(substring(${value} from '(?i)^https?://(?:www\\.)?([^/?#]+)')) || rtrim(coalesce(substring(${value} from '(?i)^https?://[^/?#]+([^?#]*)'), ''), '/') || coalesce(substring(split_part(${value}, '#', 1) from '\\?.*$'), '')`;

/** Generate a reviewed, atomic publication; this function never opens a database. */
export function buildSeoMarketingCurationSql(input: unknown): string {
  const tools = reviewedTools(input);
  const geoTools = marketingGeoStage.tools.flatMap((pick) => {
    const tool = tools.find((candidate) => candidate.slug === pick.slug);
    return tool ? [{ slug: tool.slug, identityKeys: tool.identityKeys }] : [];
  });
  // A partial or unrelated editorial batch must not revise the growth workflow.
  const updateGrowthStack = geoTools.length === marketingGeoStage.tools.length;
  const growthStackSql = updateGrowthStack ? `
  -- Revise only the existing growth workflow; a fresh installation uses seed-stacks.
  SELECT id INTO stack_id FROM "Stack" WHERE slug = ${literal(marketingGrowthStack.slug)} FOR UPDATE;
  IF stack_id IS NOT NULL THEN
    stack_changed := false;
    UPDATE "Stack" SET name = ${literal(marketingGrowthStack.name)},
      tagline = ${literal(marketingGrowthStack.tagline)}, description = ${literal(marketingGrowthStack.description)}
      WHERE id = stack_id AND (name IS DISTINCT FROM ${literal(marketingGrowthStack.name)}
        OR tagline IS DISTINCT FROM ${literal(marketingGrowthStack.tagline)}
        OR description IS DISTINCT FROM ${literal(marketingGrowthStack.description)});
    GET DIAGNOSTICS changed_rows = ROW_COUNT;
    stack_changed := changed_rows > 0;

    FOR candidate IN SELECT value FROM jsonb_array_elements(${literal(JSON.stringify(marketingGrowthStack.stages.map(({ name, description, editorNote, sortOrder }) => ({ name, description, editorNote, sortOrder }))))}::jsonb) LOOP
      SELECT array_agg(id) INTO matching_stage_ids FROM "Stage"
        WHERE "stackId" = stack_id AND name = candidate->>'name';
      IF coalesce(cardinality(matching_stage_ids), 0) > 1 THEN
        RAISE EXCEPTION 'Growth stage conflict for %: multiple existing stages', candidate->>'name';
      END IF;
      stage_id := matching_stage_ids[1];
      IF stage_id IS NULL THEN
        IF candidate->>'name' <> ${literal(marketingGeoStage.name)} THEN
          RAISE EXCEPTION 'Growth stage conflict for %: required existing stage is missing', candidate->>'name';
        END IF;
        stage_id := gen_random_uuid()::text;
        INSERT INTO "Stage" (id, name, description, "editorNote", "sortOrder", "stackId")
          VALUES (stage_id, candidate->>'name', candidate->>'description', candidate->>'editorNote',
            (candidate->>'sortOrder')::integer, stack_id);
        stack_changed := true;
      ELSE
        UPDATE "Stage" SET description = candidate->>'description', "editorNote" = candidate->>'editorNote',
          "sortOrder" = (candidate->>'sortOrder')::integer
          WHERE id = stage_id AND (description IS DISTINCT FROM candidate->>'description'
            OR "editorNote" IS DISTINCT FROM candidate->>'editorNote'
            OR "sortOrder" IS DISTINCT FROM (candidate->>'sortOrder')::integer);
        GET DIAGNOSTICS changed_rows = ROW_COUNT;
        stack_changed := stack_changed OR changed_rows > 0;
      END IF;
      IF candidate->>'name' = ${literal(marketingGeoStage.name)} THEN geo_stage_id := stage_id; END IF;
    END LOOP;

    tool_order := 0;
    FOR candidate IN SELECT value FROM jsonb_array_elements(${literal(JSON.stringify(geoTools))}::jsonb) LOOP
      -- Curation may have reused an older catalog slug. Resolve the reviewed
      -- repository aliases instead of linking a guessed /tools/<new-slug>.
      incoming_keys := ARRAY(SELECT jsonb_array_elements_text(candidate->'identityKeys'));
      SELECT array_agg(DISTINCT t.id) INTO matching_ids FROM "Tool" t
        JOIN "ToolIdentity" i ON i."toolId" = t.id
        WHERE t.status = 'APPROVED' AND i.key = ANY(incoming_keys)
          AND (i.key LIKE 'github-id:%' OR i.key LIKE 'repo:%');
      IF coalesce(cardinality(matching_ids), 0) > 1 THEN
        RAISE EXCEPTION 'Growth recommendation identity conflict for %', candidate->>'slug';
      END IF;
      tool_id := matching_ids[1];
      IF tool_id IS NOT NULL THEN
        INSERT INTO "StageRecommendation" ("stageId", "toolId", "sortOrder")
          VALUES (geo_stage_id, tool_id, tool_order)
          ON CONFLICT ("stageId", "toolId") DO UPDATE SET "sortOrder" = EXCLUDED."sortOrder"
            WHERE "StageRecommendation"."sortOrder" IS DISTINCT FROM EXCLUDED."sortOrder";
        GET DIAGNOSTICS changed_rows = ROW_COUNT;
        stack_changed := stack_changed OR changed_rows > 0;
      END IF;
      tool_order := tool_order + 1;
    END LOOP;
    IF stack_changed THEN UPDATE "Stack" SET "updatedAt" = now() WHERE id = stack_id; END IF;
  END IF;
` : "";
  const body = `DECLARE
  candidate jsonb;
  tool_row "Tool"%ROWTYPE;
  matching_ids text[];
  incoming_keys text[];
  tool_id text;
  category_id text;
  tag jsonb;
  use_cases text[];
  stack_id text;
  matching_stage_ids text[];
  stage_id text;
  geo_stage_id text;
  stack_changed boolean;
  changed_rows integer;
  tool_order integer;
BEGIN
  SELECT id INTO category_id FROM "Category" WHERE slug = 'seo-marketing';
  IF category_id IS NULL THEN RAISE EXCEPTION 'Required seo-marketing category is missing'; END IF;
  UPDATE "Category" SET name = 'SEO & GEO & Marketing',
    description = 'SEO analysis, generative engine optimization (GEO), AI search visibility, and marketing tools'
    WHERE id = category_id;

  FOR candidate IN SELECT value FROM jsonb_array_elements(${literal(JSON.stringify(tools))}::jsonb) LOOP
    incoming_keys := ARRAY(SELECT jsonb_array_elements_text(candidate->'identityKeys'));
    SELECT array_agg(DISTINCT t.id) INTO matching_ids FROM "Tool" t
    WHERE t.id IN (SELECT "toolId" FROM "ToolIdentity" WHERE key = ANY(incoming_keys))
      OR ${normalizedRepoSql('t.github')} = candidate->>'repoKey'
      OR ${normalizedRepoSql('t.url')} = candidate->>'repoKey'
      OR (${normalizedWebsiteSql('t.url')}) = candidate->>'normalizedUrl';
    IF coalesce(cardinality(matching_ids), 0) > 1 THEN
      RAISE EXCEPTION 'Identity conflict for %: multiple existing listings', candidate->>'slug';
    END IF;
    tool_id := matching_ids[1];
    IF EXISTS (SELECT 1 FROM "Tool" WHERE slug = candidate->>'slug' AND id IS DISTINCT FROM tool_id) THEN
      RAISE EXCEPTION 'Slug conflict for %: belongs to another listing', candidate->>'slug';
    END IF;

    IF tool_id IS NOT NULL THEN
      SELECT * INTO STRICT tool_row FROM "Tool" WHERE id = tool_id FOR UPDATE;
      IF EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id
          AND key LIKE 'github-id:%' AND key <> 'github-id:' || (candidate->>'repositoryId'))
        OR (tool_row.github IS NOT NULL AND ${normalizedRepoSql('tool_row.github')} <> candidate->>'repoKey'
          AND NOT EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id AND key = 'github-id:' || (candidate->>'repositoryId')))
        OR (EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id AND key LIKE 'repo:%'
            AND key <> 'repo:' || regexp_replace(candidate->>'repoKey', '^github.com/', ''))
          AND NOT EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id AND key = 'github-id:' || (candidate->>'repositoryId'))) THEN
        RAISE EXCEPTION 'Repository conflict for %: review before merging', candidate->>'slug';
      END IF;
      -- The reviewed batch does not override an earlier moderation rejection.
      IF tool_row.status = 'REJECTED' THEN CONTINUE; END IF;
      SELECT array_agg(item ORDER BY first_position) INTO use_cases FROM (
        SELECT item, min(position) AS first_position
        FROM unnest(coalesce(tool_row."useCases", ARRAY[]::text[]) || ARRAY(SELECT jsonb_array_elements_text(candidate->'useCases')))
          WITH ORDINALITY AS items(item, position) GROUP BY item
      ) merged;
      UPDATE "Tool" SET "categoryId" = category_id,
        github = coalesce(github, candidate->>'github'), status = 'APPROVED',
        pricing = CASE WHEN status = 'PENDING' THEN (candidate->>'pricing')::"Pricing" ELSE pricing END,
        "isOpenSource" = CASE WHEN status = 'PENDING' THEN (candidate->>'isOpenSource')::boolean ELSE "isOpenSource" END,
        "useCases" = use_cases,
        source = coalesce(source, 'GITHUB_REPOSITORY'::"ToolSource"),
        "sourceUrl" = CASE WHEN source IS NULL THEN candidate->>'github' ELSE "sourceUrl" END,
        "updatedAt" = now()
      WHERE id = tool_id AND (
        "categoryId" IS DISTINCT FROM category_id OR github IS NULL OR status <> 'APPROVED'
        OR "useCases" IS DISTINCT FROM use_cases OR source IS NULL
      );
    ELSE
      tool_id := gen_random_uuid()::text;
      INSERT INTO "Tool" (id, name, slug, tagline, description, url, "iconUrl", "categoryId", github,
        pricing, "isOpenSource", platforms, status, source, "sourceUrl", "useCases", "updatedAt")
      VALUES (tool_id, candidate->>'name', candidate->>'slug', candidate->>'tagline', candidate->>'description',
        candidate->>'url', candidate->>'iconUrl', category_id, candidate->>'github',
        (candidate->>'pricing')::"Pricing", (candidate->>'isOpenSource')::boolean,
        ARRAY(SELECT jsonb_array_elements_text(coalesce(candidate->'platforms', '[]'::jsonb))),
        'APPROVED', 'GITHUB_REPOSITORY', candidate->>'github',
        ARRAY(SELECT jsonb_array_elements_text(candidate->'useCases')), now());
    END IF;

    INSERT INTO "ToolIdentity" (key, "toolId") SELECT unnest(incoming_keys), tool_id
      ON CONFLICT (key) DO NOTHING;
    IF EXISTS (SELECT 1 FROM "ToolIdentity" WHERE key = ANY(incoming_keys) AND "toolId" <> tool_id) THEN
      RAISE EXCEPTION 'Identity claim conflict for %', candidate->>'slug';
    END IF;
    FOR tag IN SELECT value FROM jsonb_array_elements(candidate->'tagRecords') LOOP
      INSERT INTO "Tag" (id, name, slug)
        SELECT gen_random_uuid()::text, tag->>'name', tag->>'slug'
        WHERE NOT EXISTS (SELECT 1 FROM "Tag" WHERE slug = tag->>'slug' OR lower(name) = lower(tag->>'name'));
      INSERT INTO "ToolTag" ("toolId", "tagId")
        SELECT tool_id, id FROM "Tag" WHERE slug = tag->>'slug' OR lower(name) = lower(tag->>'name')
        ORDER BY (slug = tag->>'slug') DESC LIMIT 1 ON CONFLICT DO NOTHING;
    END LOOP;
    INSERT INTO "ToolDiscovery" (id, "toolId", source, method, "sourceKey", "sourceUrl", metadata)
      VALUES (gen_random_uuid()::text, tool_id, 'GITHUB_REPOSITORY', 'editorial-review',
        'seo-geo-marketing:' || (candidate->>'repoKey'), candidate->>'github',
        jsonb_build_object('reviewedAt', candidate->>'reviewedAt', 'reviewBasis', 'official public documentation',
          'sources', candidate->'sources', 'repositoryId', candidate->>'repositoryId',
          'licenseSpdxId', candidate->>'licenseSpdxId', 'category', 'seo-marketing'))
      ON CONFLICT ("toolId", source, method, "sourceKey") DO UPDATE SET
        "sourceUrl" = EXCLUDED."sourceUrl", metadata = EXCLUDED.metadata, "lastSeenAt" = now();
  END LOOP;
${growthStackSql}
END`;
  let delimiter = "$toools_curation$";
  while (body.includes(delimiter)) delimiter = delimiter.replace(/\$$/, "_x$");
  return `-- Generated from scripts/config/seo-marketing-tools.json and src/lib/marketing-growth-stack.ts. Review before publication.\n-- Only this reviewed batch is approved; REJECTED listings remain unchanged.\n-- Run through npm run sql:publish -- --file scripts/sql/curate-seo-marketing.sql\nBEGIN;\nSET LOCAL standard_conforming_strings = on;\nSELECT pg_advisory_xact_lock(1378392541);\nDO ${delimiter}\n${body}\n${delimiter};\nCOMMIT;\n`;
}
