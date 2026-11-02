-- Reviewed maintainer-requested Toools self-listing. Input: scripts/config/toools-self-listing.json.
-- Only new and matching PENDING tools in this reviewed batch become APPROVED.
-- Existing APPROVED/REJECTED tools, counters, primary sources, categories and workflows are preserved.
BEGIN;
SET LOCAL standard_conforming_strings = on;
SELECT pg_advisory_xact_lock(1378392541);
DO $toools_curation$
DECLARE
  candidate jsonb;
  tool_row "Tool"%ROWTYPE;
  matching_ids text[];
  incoming_keys text[];
  legacy_urls text[];
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
  -- Categories are looked up per reviewed record; category/workflow definitions are untouched.

  FOR candidate IN SELECT value FROM jsonb_array_elements('[{"name":"Toools","slug":"toools","tagline":"Discover tools and curated workflow stacks","description":"Toools is a web catalog for discovering software from GitHub, Product Hunt, curated collections, and community submissions. Search and filter listings, compare documented use cases and visible popularity signals, and follow curated tool stacks for a workflow. The MIT-licensed application can be self-hosted; hosting and database costs are separate. Toools is built and maintained by the team that curates this directory.","url":"https://toools.top/","github":"https://github.com/korbinjoe/toools","pricing":"OPEN_SOURCE","isOpenSource":true,"platforms":["Web"],"tags":["tool-discovery","tool-directory","workflow-stacks","open-source","productivity"],"useCases":["Find software by category, platform, pricing, or source","Compare documented use cases and visible popularity signals","Choose tools for each stage of your work"],"repositoryId":"695019504","licenseSpdxId":"MIT","reviewedAt":"2026-11-02","sources":["https://github.com/korbinjoe/toools","https://github.com/korbinjoe/toools/blob/main/README.md","https://github.com/korbinjoe/toools/blob/main/LICENSE"],"legacyUrls":["https://toools-sigma.vercel.app"],"categorySlug":"productivity","githubStars":1,"defaultBranch":"main","pushedAt":"2026-11-02T09:55:19Z","reviewNotes":{"basis":"Explicit maintainer request for a self-listing, reviewed against current repository metadata, README and MIT license.","ownership":"Built and maintained by the team that curates Toools.","discoveryThreshold":"The automatic GitHub star threshold does not apply to this explicit manual listing. Stars are the observed value, not a ranking boost.","readmeSha":"10f15f89dc8e4f86bc5251afe92930e05f1f5d0b","licenseSha":"b6138dd87a9e6726a91372b1f1ac3087bffdf9ce"},"identityKeys":["url:toools.top","repo:korbinjoe/toools","github-id:695019504","url:toools-sigma.vercel.app"],"normalizedUrl":"toools.top","repoKey":"github.com/korbinjoe/toools","iconUrl":"https://www.google.com/s2/favicons?domain=toools.top&sz=64","tagRecords":[{"name":"tool-discovery","slug":"tool-discovery"},{"name":"tool-directory","slug":"tool-directory"},{"name":"workflow-stacks","slug":"workflow-stacks"},{"name":"open-source","slug":"open-source"},{"name":"productivity","slug":"productivity"}]}]'::jsonb) LOOP
    SELECT id INTO category_id FROM "Category" WHERE slug = candidate->>'categorySlug';
    IF category_id IS NULL THEN RAISE EXCEPTION 'Required reviewed category is missing'; END IF;
    incoming_keys := ARRAY(SELECT jsonb_array_elements_text(candidate->'identityKeys'));
    legacy_urls := ARRAY(SELECT jsonb_array_elements_text(candidate->'legacyUrls'));
    SELECT array_agg(DISTINCT t.id) INTO matching_ids FROM "Tool" t
    WHERE t.id IN (SELECT "toolId" FROM "ToolIdentity" WHERE key = ANY(incoming_keys))
      OR t.url = ANY(legacy_urls)
      OR lower(regexp_replace(regexp_replace(regexp_replace(t.github, '^https?://(www\.)?', '', 'i'), '[?#].*$', ''), '(\.git)?/+$|\.git$', '')) = candidate->>'repoKey'
      OR lower(regexp_replace(regexp_replace(regexp_replace(t.url, '^https?://(www\.)?', '', 'i'), '[?#].*$', ''), '(\.git)?/+$|\.git$', '')) = candidate->>'repoKey'
      OR (lower(substring(t.url from '(?i)^https?://(?:www\.)?([^/?#]+)')) || rtrim(coalesce(substring(t.url from '(?i)^https?://[^/?#]+([^?#]*)'), ''), '/') || coalesce(substring(split_part(t.url, '#', 1) from '\?.*$'), '')) = candidate->>'normalizedUrl';
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
        OR (tool_row.github IS NOT NULL AND lower(regexp_replace(regexp_replace(regexp_replace(tool_row.github, '^https?://(www\.)?', '', 'i'), '[?#].*$', ''), '(\.git)?/+$|\.git$', '')) <> candidate->>'repoKey'
          AND NOT EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id AND key = 'github-id:' || (candidate->>'repositoryId')))
        OR (EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id AND key LIKE 'repo:%'
            AND key <> 'repo:' || regexp_replace(candidate->>'repoKey', '^github.com/', ''))
          AND NOT EXISTS (SELECT 1 FROM "ToolIdentity" WHERE "toolId" = tool_id AND key = 'github-id:' || (candidate->>'repositoryId'))) THEN
        RAISE EXCEPTION 'Repository conflict for %: review before merging', candidate->>'slug';
      END IF;
      -- The reviewed batch does not override an earlier moderation rejection.
      IF tool_row.status IN ('REJECTED', 'APPROVED') THEN CONTINUE; END IF;
      SELECT array_agg(item ORDER BY first_position) INTO use_cases FROM (
        SELECT item, min(position) AS first_position
        FROM unnest(coalesce(tool_row."useCases", ARRAY[]::text[]) || ARRAY(SELECT jsonb_array_elements_text(candidate->'useCases')))
          WITH ORDINALITY AS items(item, position) GROUP BY item
      ) merged;
      UPDATE "Tool" SET "categoryId" = category_id,
        name = candidate->>'name', tagline = candidate->>'tagline', description = candidate->>'description',
        platforms = ARRAY(SELECT jsonb_array_elements_text(candidate->'platforms')),
        "githubStars" = (candidate->>'githubStars')::integer,
        url = CASE WHEN status = 'PENDING' AND url = ANY(legacy_urls) THEN candidate->>'url' ELSE url END,
        github = coalesce(github, candidate->>'github'), status = 'APPROVED',
        pricing = CASE WHEN status = 'PENDING' THEN (candidate->>'pricing')::"Pricing" ELSE pricing END,
        "isOpenSource" = CASE WHEN status = 'PENDING' THEN (candidate->>'isOpenSource')::boolean ELSE "isOpenSource" END,
        "useCases" = use_cases,
        source = coalesce(source, 'MANUAL'::"ToolSource"),
        "sourceUrl" = CASE WHEN source IS NULL THEN candidate->>'github' ELSE "sourceUrl" END,
        "updatedAt" = now()
      WHERE id = tool_id AND (
        "categoryId" IS DISTINCT FROM category_id OR github IS NULL OR status <> 'APPROVED'
        OR "useCases" IS DISTINCT FROM use_cases OR source IS NULL
      );
    ELSE
      tool_id := gen_random_uuid()::text;
      INSERT INTO "Tool" (id, name, slug, tagline, description, url, "iconUrl", "categoryId", github,
        pricing, "isOpenSource", platforms, status, source, "sourceUrl", "useCases", "githubStars", "updatedAt")
      VALUES (tool_id, candidate->>'name', candidate->>'slug', candidate->>'tagline', candidate->>'description',
        candidate->>'url', candidate->>'iconUrl', category_id, candidate->>'github',
        (candidate->>'pricing')::"Pricing", (candidate->>'isOpenSource')::boolean,
        ARRAY(SELECT jsonb_array_elements_text(coalesce(candidate->'platforms', '[]'::jsonb))),
        'APPROVED', 'MANUAL', candidate->>'github',
        ARRAY(SELECT jsonb_array_elements_text(candidate->'useCases')), (candidate->>'githubStars')::integer, now());
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
        'toools-self-listing-2026-11-02:' || (candidate->>'repoKey'), candidate->>'github',
        jsonb_build_object('reviewedAt', candidate->>'reviewedAt', 'reviewBasis', 'maintainer-requested self-listing; README and MIT license reviewed',
          'sources', candidate->'sources', 'repositoryId', candidate->>'repositoryId',
          'licenseSpdxId', candidate->>'licenseSpdxId', 'legacyUrls', candidate->'legacyUrls', 'category', candidate->>'categorySlug',
          'githubStars', candidate->'githubStars', 'observedOn', candidate->>'reviewedAt',
          'defaultBranch', candidate->>'defaultBranch', 'pushedAt', candidate->>'pushedAt',
          'reviewNotes', candidate->'reviewNotes', 'batch', 'toools-self-listing-2026-11-02'))
      ON CONFLICT ("toolId", source, method, "sourceKey") DO UPDATE SET
        "sourceUrl" = EXCLUDED."sourceUrl", metadata = EXCLUDED.metadata, "lastSeenAt" = now();
  END LOOP;

END
$toools_curation$;
COMMIT;
