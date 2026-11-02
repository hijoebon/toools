-- Generated from scripts/config/seo-marketing-tools.json and src/lib/marketing-growth-stack.ts. Review before publication.
-- Only this reviewed batch is approved; REJECTED listings remain unchanged.
-- Run through npm run sql:publish -- --file scripts/sql/curate-seo-marketing.sql
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
  SELECT id INTO category_id FROM "Category" WHERE slug = 'seo-marketing';
  IF category_id IS NULL THEN RAISE EXCEPTION 'Required seo-marketing category is missing'; END IF;
  UPDATE "Category" SET name = 'SEO & GEO & Marketing',
    description = 'SEO analysis, generative engine optimization (GEO), AI search visibility, and marketing tools'
    WHERE id = category_id;

  FOR candidate IN SELECT value FROM jsonb_array_elements('[{"name":"OpenSEO","slug":"openseo","tagline":"Open-source SEO research, audits, and AI visibility","description":"OpenSEO brings keyword research, rank tracking, competitor research, backlinks, site audits, and AI visibility into one workspace. Self-host the MIT-licensed application and connect your own DataForSEO account, or use the hosted service. SEO data requests and hosted plans are billed separately.","url":"https://openseo.so/","github":"https://github.com/every-app/open-seo","repositoryId":"1168753718","licenseSpdxId":"MIT","tags":["seo","keyword-research","rank-tracking","generative-engine-optimization","self-hosted"],"useCases":["Research keywords and competitor search performance","Track rankings and review site audits","Inspect AI visibility and connect SEO workflows to an AI agent"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/every-app/open-seo","https://github.com/every-app/open-seo/blob/main/README.md","https://github.com/every-app/open-seo/blob/main/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:openseo.so","repo:every-app/open-seo","github-id:1168753718"],"normalizedUrl":"openseo.so","repoKey":"github.com/every-app/open-seo","iconUrl":"https://www.google.com/s2/favicons?domain=openseo.so&sz=64","tagRecords":[{"name":"seo","slug":"seo"},{"name":"keyword-research","slug":"keyword-research"},{"name":"rank-tracking","slug":"rank-tracking"},{"name":"generative-engine-optimization","slug":"generative-engine-optimization"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"SEOnaut","slug":"seonaut","tagline":"Find and prioritize technical SEO issues","description":"SEOnaut crawls websites and groups technical SEO issues by severity, including broken links, redirects, missing or duplicate metadata, and heading problems. Its web dashboard can run on your own server with Go, MySQL, and Docker; a hosted service is also available.","url":"https://seonaut.org/","github":"https://github.com/stjudewashere/seonaut","repositoryId":"465254307","licenseSpdxId":"MIT","tags":["seo","technical-seo","site-audit","crawler","self-hosted"],"useCases":["Audit a website for technical SEO problems","Prioritize broken links and metadata fixes","Review crawl results in a shared web dashboard"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/StJudeWasHere/seonaut","https://github.com/StJudeWasHere/seonaut/blob/main/README.md","https://github.com/StJudeWasHere/seonaut/blob/main/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:seonaut.org","repo:stjudewashere/seonaut","github-id:465254307"],"normalizedUrl":"seonaut.org","repoKey":"github.com/stjudewashere/seonaut","iconUrl":"https://www.google.com/s2/favicons?domain=seonaut.org&sz=64","tagRecords":[{"name":"seo","slug":"seo"},{"name":"technical-seo","slug":"technical-seo"},{"name":"site-audit","slug":"site-audit"},{"name":"crawler","slug":"crawler"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"SerpBear","slug":"serpbear","tagline":"Self-hosted keyword rank tracking","description":"SerpBear tracks Google keyword positions for multiple domains and sends reports about ranking changes. It includes a reporting API and optional Google Ads integration for keyword research. The application is MIT-licensed; search scraping services, proxies, and hosting may incur separate costs.","url":"https://docs.serpbear.com/","github":"https://github.com/towfiqi/serpbear","repositoryId":"570178488","licenseSpdxId":"MIT","tags":["seo","rank-tracking","keyword-research","self-hosted"],"useCases":["Monitor keyword positions across domains","Receive ranking change reports","Export search ranking data to reporting workflows"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/towfiqi/serpbear","https://github.com/towfiqi/serpbear/blob/main/README.md","https://github.com/towfiqi/serpbear/blob/main/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:docs.serpbear.com","repo:towfiqi/serpbear","github-id:570178488"],"normalizedUrl":"docs.serpbear.com","repoKey":"github.com/towfiqi/serpbear","iconUrl":"https://www.google.com/s2/favicons?domain=docs.serpbear.com&sz=64","tagRecords":[{"name":"seo","slug":"seo"},{"name":"rank-tracking","slug":"rank-tracking"},{"name":"keyword-research","slug":"keyword-research"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"SiteOne Crawler","slug":"siteone-crawler","tagline":"Cross-platform website crawling and SEO audits","description":"SiteOne Crawler scans websites for SEO, accessibility, security, and performance issues and exports reports in HTML, JSON, and text. It runs as a native command-line application with a companion desktop interface. Optional AI analysis can suggest metadata changes and generate llms.txt using your own model provider.","url":"https://crawler.siteone.io/","github":"https://github.com/janreges/siteone-crawler","repositoryId":"700333533","licenseSpdxId":"MIT","tags":["seo","site-audit","crawler","accessibility","llms-txt"],"useCases":["Audit technical SEO and website quality","Export crawl findings for clients or automation","Check site content and prepare llms.txt with optional AI assistance"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/janreges/siteone-crawler","https://github.com/janreges/siteone-crawler/blob/main/README.md","https://github.com/janreges/siteone-crawler/blob/main/LICENSE"],"platforms":["macOS","Windows","Linux"],"legacyUrls":[],"identityKeys":["url:crawler.siteone.io","repo:janreges/siteone-crawler","github-id:700333533"],"normalizedUrl":"crawler.siteone.io","repoKey":"github.com/janreges/siteone-crawler","iconUrl":"https://www.google.com/s2/favicons?domain=crawler.siteone.io&sz=64","tagRecords":[{"name":"seo","slug":"seo"},{"name":"site-audit","slug":"site-audit"},{"name":"crawler","slug":"crawler"},{"name":"accessibility","slug":"accessibility"},{"name":"llms-txt","slug":"llms-txt"}]},{"name":"LibreCrawl","slug":"librecrawl","tagline":"Self-hosted SEO crawler with JavaScript rendering","description":"LibreCrawl crawls websites, extracts titles, descriptions and headings, maps links, and detects SEO issues. Its web interface supports JavaScript rendering, PageSpeed Insights integration, and CSV, Excel, JSON, and XML exports. Run the MIT-licensed application locally or on your own infrastructure.","url":"https://librecrawl.com/","github":"https://github.com/phialsbasement/librecrawl","repositoryId":"1065249566","licenseSpdxId":"MIT","tags":["seo","crawler","technical-seo","site-audit","self-hosted"],"useCases":["Crawl JavaScript-rendered websites","Inspect page metadata and internal links","Export SEO audit data for analysis"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/PhialsBasement/LibreCrawl","https://github.com/PhialsBasement/LibreCrawl/blob/main/README.md","https://github.com/PhialsBasement/LibreCrawl/blob/main/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:librecrawl.com","repo:phialsbasement/librecrawl","github-id:1065249566"],"normalizedUrl":"librecrawl.com","repoKey":"github.com/phialsbasement/librecrawl","iconUrl":"https://www.google.com/s2/favicons?domain=librecrawl.com&sz=64","tagRecords":[{"name":"seo","slug":"seo"},{"name":"crawler","slug":"crawler"},{"name":"technical-seo","slug":"technical-seo"},{"name":"site-audit","slug":"site-audit"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"OneGlanse","slug":"oneglanse","tagline":"Track brand visibility in AI search answers","description":"OneGlanse runs selected prompts in supported AI products and records whether they mention, recommend, or cite your brand. It compares competitors and preserves captured answers for review. The MIT-licensed application runs locally or on your server and requires your own AI accounts and analysis-model key; provider and infrastructure costs are separate.","url":"https://oneglanse.com/","github":"https://github.com/oneglanse/oneglanse","repositoryId":"1053432514","licenseSpdxId":"MIT","tags":["generative-engine-optimization","answer-engine-optimization","ai-visibility","brand-monitoring","self-hosted"],"useCases":["Measure brand mentions and citations in AI answers","Compare your AI search visibility with competitors","Inspect the captured answers behind visibility metrics"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/oneglanse/oneglanse","https://github.com/oneglanse/oneglanse/blob/main/README.md","https://github.com/oneglanse/oneglanse/blob/main/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:oneglanse.com","repo:oneglanse/oneglanse","github-id:1053432514"],"normalizedUrl":"oneglanse.com","repoKey":"github.com/oneglanse/oneglanse","iconUrl":"https://www.google.com/s2/favicons?domain=oneglanse.com&sz=64","tagRecords":[{"name":"generative-engine-optimization","slug":"generative-engine-optimization"},{"name":"answer-engine-optimization","slug":"answer-engine-optimization"},{"name":"ai-visibility","slug":"ai-visibility"},{"name":"brand-monitoring","slug":"brand-monitoring"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"Mautic","slug":"mautic","tagline":"Open-source marketing automation and campaigns","description":"Mautic is a self-hosted marketing automation platform for multichannel campaigns, audience segmentation, and automated customer journeys. Run the GPL-licensed application with your own database and integrations. Hosting, maintenance, and connected email or messaging providers have their own operating costs.","url":"https://www.mautic.org/","github":"https://github.com/mautic/mautic","repositoryId":"12204147","licenseSpdxId":"GPL-3.0-or-later","tags":["marketing-automation","email-marketing","campaign-management","self-hosted"],"useCases":["Build automated marketing campaigns","Segment audiences for targeted communication","Coordinate customer journeys across marketing channels"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/mautic/mautic","https://github.com/mautic/mautic/blob/7.x/README.md","https://github.com/mautic/mautic/blob/7.x/LICENSE.txt"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:mautic.org","repo:mautic/mautic","github-id:12204147"],"normalizedUrl":"mautic.org","repoKey":"github.com/mautic/mautic","iconUrl":"https://www.google.com/s2/favicons?domain=www.mautic.org&sz=64","tagRecords":[{"name":"marketing-automation","slug":"marketing-automation"},{"name":"email-marketing","slug":"email-marketing"},{"name":"campaign-management","slug":"campaign-management"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"listmonk","slug":"listmonk","tagline":"Self-hosted newsletters and mailing lists","description":"listmonk is a standalone newsletter and mailing-list manager with a web dashboard, PostgreSQL storage, and a single-binary server. The AGPL-licensed application lets you manage subscribers and send campaigns on your own infrastructure. Email delivery and hosting costs depend on the providers you configure.","url":"https://listmonk.app/","github":"https://github.com/knadh/listmonk","repositoryId":"193833307","licenseSpdxId":"AGPL-3.0","tags":["email-marketing","newsletter","mailing-list","campaign-management","self-hosted"],"useCases":["Manage newsletter subscribers and mailing lists","Send email campaigns from your own infrastructure","Operate a newsletter with a lightweight standalone server"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/knadh/listmonk","https://github.com/knadh/listmonk/blob/master/README.md","https://github.com/knadh/listmonk/blob/master/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:listmonk.app","repo:knadh/listmonk","github-id:193833307"],"normalizedUrl":"listmonk.app","repoKey":"github.com/knadh/listmonk","iconUrl":"https://www.google.com/s2/favicons?domain=listmonk.app&sz=64","tagRecords":[{"name":"email-marketing","slug":"email-marketing"},{"name":"newsletter","slug":"newsletter"},{"name":"mailing-list","slug":"mailing-list"},{"name":"campaign-management","slug":"campaign-management"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"Keila","slug":"keila","tagline":"Open-source newsletters and signup forms","description":"Keila helps create newsletters, manage subscribers, and publish signup forms. Self-host the AGPL-licensed application or choose Keila Cloud. The self-hosted edition uses the email delivery service you configure; cloud plans and delivery providers are priced separately.","url":"https://www.keila.io/","github":"https://github.com/pentacent/keila","repositoryId":"326066599","licenseSpdxId":"AGPL-3.0-or-later","tags":["email-marketing","newsletter","signup-forms","self-hosted"],"useCases":["Create and send newsletter campaigns","Collect subscribers with signup forms","Run an email newsletter on your own server"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/pentacent/keila","https://github.com/pentacent/keila/blob/main/README.md","https://github.com/pentacent/keila/blob/main/LICENSE.md"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:keila.io","repo:pentacent/keila","github-id:326066599"],"normalizedUrl":"keila.io","repoKey":"github.com/pentacent/keila","iconUrl":"https://www.google.com/s2/favicons?domain=www.keila.io&sz=64","tagRecords":[{"name":"email-marketing","slug":"email-marketing"},{"name":"newsletter","slug":"newsletter"},{"name":"signup-forms","slug":"signup-forms"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"SendPortal","slug":"sendportal","tagline":"Self-hosted email marketing and campaign reports","description":"SendPortal manages subscribers, mailing lists, email campaigns, message tracking, and reporting across workspaces. The MIT-licensed application integrates with email providers including Amazon SES, Postmark, SendGrid, Mailgun, and Mailjet. Hosting and email delivery are separate operating costs.","url":"https://sendportal.io/","github":"https://github.com/mettle/sendportal","repositoryId":"269325451","licenseSpdxId":"MIT","tags":["email-marketing","newsletter","campaign-management","self-hosted"],"useCases":["Manage subscriber lists and email campaigns","Track email delivery and campaign reports","Operate separate email marketing workspaces"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/mettle/sendportal","https://github.com/mettle/sendportal/blob/master/README.md","https://github.com/mettle/sendportal/blob/master/LICENSE"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:sendportal.io","repo:mettle/sendportal","github-id:269325451"],"normalizedUrl":"sendportal.io","repoKey":"github.com/mettle/sendportal","iconUrl":"https://www.google.com/s2/favicons?domain=sendportal.io&sz=64","tagRecords":[{"name":"email-marketing","slug":"email-marketing"},{"name":"newsletter","slug":"newsletter"},{"name":"campaign-management","slug":"campaign-management"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"Postiz","slug":"postiz","tagline":"Open-source social media scheduling and analytics","description":"Postiz schedules and publishes social media content, supports team collaboration, and provides analytics and automation integrations. Deploy the AGPL-licensed edition yourself or use Postiz Cloud. Self-hosting requires your own infrastructure and social-platform app credentials; optional AI features use your own provider keys.","url":"https://postiz.com/","github":"https://github.com/gitroomhq/postiz-app","repositoryId":"664013991","licenseSpdxId":"AGPL-3.0","tags":["social-media-management","social-media-scheduling","content-marketing","self-hosted"],"useCases":["Plan and schedule social media posts","Collaborate on a shared content calendar","Connect publishing workflows to automation tools"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/gitroomhq/postiz-app","https://github.com/gitroomhq/postiz-app/blob/main/README.md","https://github.com/gitroomhq/postiz-app/blob/main/LICENSE","https://www.producthunt.com/products/postiz"],"platforms":["Web"],"legacyUrls":["https://www.producthunt.com/r/DTE56DREXBP3M6?utm_campaign=producthunt-api&utm_medium=api-v2&utm_source=Application%3A+github-trending-plus+%28ID%3A+285454%29"],"identityKeys":["url:postiz.com","repo:gitroomhq/postiz-app","github-id:664013991","url:producthunt.com/r/DTE56DREXBP3M6"],"normalizedUrl":"postiz.com","repoKey":"github.com/gitroomhq/postiz-app","iconUrl":"https://www.google.com/s2/favicons?domain=postiz.com&sz=64","tagRecords":[{"name":"social-media-management","slug":"social-media-management"},{"name":"social-media-scheduling","slug":"social-media-scheduling"},{"name":"content-marketing","slug":"content-marketing"},{"name":"self-hosted","slug":"self-hosted"}]},{"name":"Mixpost Lite","slug":"mixpost","tagline":"Self-hosted social media content scheduling","description":"Mixpost Lite is the MIT-licensed community edition of Mixpost for managing and scheduling social media content on your own server. It helps organize content publishing from a web interface. Commercial Pro and Enterprise editions provide additional capabilities and are sold separately.","url":"https://mixpost.app/","github":"https://github.com/inovector/mixpost","repositoryId":"516725401","licenseSpdxId":"MIT","tags":["social-media-management","social-media-scheduling","content-marketing","self-hosted"],"useCases":["Organize a social media publishing workflow","Schedule content from a self-hosted interface","Evaluate the community edition before considering commercial upgrades"],"pricing":"OPEN_SOURCE","isOpenSource":true,"reviewedAt":"2026-11-02","sources":["https://github.com/inovector/mixpost","https://github.com/inovector/mixpost/blob/main/README.md","https://github.com/inovector/mixpost/blob/main/LICENSE.md"],"platforms":["Web"],"legacyUrls":[],"identityKeys":["url:mixpost.app","repo:inovector/mixpost","github-id:516725401"],"normalizedUrl":"mixpost.app","repoKey":"github.com/inovector/mixpost","iconUrl":"https://www.google.com/s2/favicons?domain=mixpost.app&sz=64","tagRecords":[{"name":"social-media-management","slug":"social-media-management"},{"name":"social-media-scheduling","slug":"social-media-scheduling"},{"name":"content-marketing","slug":"content-marketing"},{"name":"self-hosted","slug":"self-hosted"}]}]'::jsonb) LOOP
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
      IF tool_row.status = 'REJECTED' THEN CONTINUE; END IF;
      SELECT array_agg(item ORDER BY first_position) INTO use_cases FROM (
        SELECT item, min(position) AS first_position
        FROM unnest(coalesce(tool_row."useCases", ARRAY[]::text[]) || ARRAY(SELECT jsonb_array_elements_text(candidate->'useCases')))
          WITH ORDINALITY AS items(item, position) GROUP BY item
      ) merged;
      UPDATE "Tool" SET "categoryId" = category_id,
        url = CASE WHEN status = 'PENDING' AND url = ANY(legacy_urls) THEN candidate->>'url' ELSE url END,
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
          'licenseSpdxId', candidate->>'licenseSpdxId', 'legacyUrls', candidate->'legacyUrls', 'category', 'seo-marketing'))
      ON CONFLICT ("toolId", source, method, "sourceKey") DO UPDATE SET
        "sourceUrl" = EXCLUDED."sourceUrl", metadata = EXCLUDED.metadata, "lastSeenAt" = now();
  END LOOP;

  -- Revise only the existing growth workflow; a fresh installation uses seed-stacks.
  SELECT id INTO stack_id FROM "Stack" WHERE slug = 'marketing-seo-growth' FOR UPDATE;
  IF stack_id IS NOT NULL THEN
    stack_changed := false;
    UPDATE "Stack" SET name = 'Marketing, SEO & GEO Growth',
      tagline = 'Research demand, publish useful content, and track visibility across search and AI answers.', description = 'A marketing workflow for SEO and generative engine optimization (GEO) — research demand, create and distribute useful content, check AI search readiness, and measure brand visibility and conversions.'
      WHERE id = stack_id AND (name IS DISTINCT FROM 'Marketing, SEO & GEO Growth'
        OR tagline IS DISTINCT FROM 'Research demand, publish useful content, and track visibility across search and AI answers.'
        OR description IS DISTINCT FROM 'A marketing workflow for SEO and generative engine optimization (GEO) — research demand, create and distribute useful content, check AI search readiness, and measure brand visibility and conversions.');
    GET DIAGNOSTICS changed_rows = ROW_COUNT;
    stack_changed := changed_rows > 0;

    FOR candidate IN SELECT value FROM jsonb_array_elements('[{"name":"Keyword Research","description":"Find opportunities and understand search intent.","editorNote":"Ahrefs for backlink and keyword depth. Semrush for competitive gaps. Ubersuggest for quick ideas on a budget.","sortOrder":1},{"name":"Content Creation","description":"Plan, write, and polish useful content for search visitors and AI answers.","editorNote":"Notion for briefs and calendars. Grammarly for clarity. Hemingway Editor for readable prose. State clear answers and keep factual claims tied to sources.","sortOrder":2},{"name":"Distribution","description":"Publish across email and social channels.","editorNote":"Buffer for social scheduling. Mailchimp for campaigns. ConvertKit for creator-style newsletters.","sortOrder":3},{"name":"GEO & AI Visibility","description":"Check AI search readiness and track brand mentions, recommendations, and citations in saved AI answers.","editorNote":"SiteOne Crawler for AI search readiness. OneGlanse for saved answers, brand mentions, and citations. OpenSEO connects AI visibility with SEO research. Compare consistent prompts over time; citations and visits are separate outcomes.","sortOrder":4},{"name":"Measurement","description":"Track search performance, referral traffic, and on-site behavior.","editorNote":"Google Search Console for search performance. Mixpanel for product events. Hotjar for qualitative session insight. Measure visits and conversions separately from AI answer mentions and citations.","sortOrder":5}]'::jsonb) LOOP
      SELECT array_agg(id) INTO matching_stage_ids FROM "Stage"
        WHERE "stackId" = stack_id AND name = candidate->>'name';
      IF coalesce(cardinality(matching_stage_ids), 0) > 1 THEN
        RAISE EXCEPTION 'Growth stage conflict for %: multiple existing stages', candidate->>'name';
      END IF;
      stage_id := matching_stage_ids[1];
      IF stage_id IS NULL THEN
        IF candidate->>'name' <> 'GEO & AI Visibility' THEN
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
      IF candidate->>'name' = 'GEO & AI Visibility' THEN geo_stage_id := stage_id; END IF;
    END LOOP;

    tool_order := 0;
    FOR candidate IN SELECT value FROM jsonb_array_elements('[{"slug":"siteone-crawler","identityKeys":["url:crawler.siteone.io","repo:janreges/siteone-crawler","github-id:700333533"]},{"slug":"oneglanse","identityKeys":["url:oneglanse.com","repo:oneglanse/oneglanse","github-id:1053432514"]},{"slug":"openseo","identityKeys":["url:openseo.so","repo:every-app/open-seo","github-id:1168753718"]}]'::jsonb) LOOP
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

END
$toools_curation$;
COMMIT;
