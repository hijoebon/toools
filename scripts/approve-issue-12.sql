-- Publish the submission from GitHub issue #12 to the live catalog.
-- Details checked against https://yapapp.cc/ on 2026-11-01.
-- Pricing is Paid: 3 days without a card, then a 10-day card trial, then USD 6.90/month or USD 69/year.
-- The public pages do not state a macOS 13 minimum; they require Apple Silicon (M1 and later).
-- Safe to rerun; retains engagement counts and existing primary provenance.

BEGIN;

-- Coordinate identity claims with the GitHub import pipeline.
SELECT pg_advisory_xact_lock(1378392541);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Category" WHERE slug = 'productivity') THEN
    RAISE EXCEPTION 'Required Productivity category is missing';
  END IF;
  IF (SELECT count(*) FROM "Tag" WHERE slug IN ('ai', 'writing', 'audio')) <> 3 THEN
    RAISE EXCEPTION 'Required AI, Writing, or Audio tag is missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Tool"
    WHERE slug = 'yap'
      AND lower(url) !~ '^https?://(www\.)?yapapp\.cc(:80|:443)?/*([?#].*)?$'
  ) THEN
    RAISE EXCEPTION 'Yap slug belongs to another website; reconcile before publication';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Tool"
    WHERE lower(url) ~ '^https?://(www\.)?yapapp\.cc(:80|:443)?/*([?#].*)?$'
      AND slug <> 'yap'
  ) OR EXISTS (
    SELECT 1 FROM "ToolIdentity" i JOIN "Tool" t ON t.id = i."toolId"
    WHERE i.key = 'url:yapapp.cc' AND t.slug <> 'yap'
  ) THEN
    RAISE EXCEPTION 'Yap already exists under another slug; reconcile before publication';
  END IF;
END $$;

INSERT INTO "Tool" (
  "id", "name", "slug", "tagline", "description", "url", "categoryId",
  "pricing", "platforms", "isOpenSource", "status", "source", "sourceUrl", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'Yap',
  'yap',
  'On-device dictation that types speech into the app you are using',
  'Yap is a dictation app that types speech at the text cursor in the app you are using. Public pages document Apple Silicon Macs (M1 and later, with no Intel build), Windows 10 and 11 including a native Arm build, and iPhone and Android. The Windows and Android pages say recognition uses NVIDIA''s Parakeet model on the device; the Mac pages say recognition runs on the Mac and audio is not uploaded. The provider lists 25 languages and detects the spoken language for each recording. A free account includes 3 days without a card, then a 10-day trial that requires a card, then USD 6.90 per month or USD 69 per year. The first launch, activation, and periodic access checks need an internet connection, and offline use stays within the current access period. Reviewed from public documentation on 2026-11-01; this is not a hands-on accuracy test.',
  'https://yapapp.cc/',
  "Category"."id",
  'PAID'::"Pricing",
  ARRAY['macOS', 'Windows', 'iOS', 'Android'],
  false,
  'APPROVED'::"ToolStatus",
  'MANUAL'::"ToolSource",
  'https://github.com/korbinjoe/toools/issues/12',
  now()
FROM "Category" WHERE "Category".slug = 'productivity'
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "tagline" = EXCLUDED."tagline",
  "description" = EXCLUDED."description",
  "url" = EXCLUDED."url",
  "categoryId" = EXCLUDED."categoryId",
  "pricing" = EXCLUDED."pricing",
  "platforms" = EXCLUDED."platforms",
  "isOpenSource" = EXCLUDED."isOpenSource",
  "status" = EXCLUDED."status",
  "source" = COALESCE("Tool"."source", EXCLUDED."source"),
  "sourceUrl" = CASE WHEN "Tool"."source" IS NULL THEN EXCLUDED."sourceUrl" ELSE "Tool"."sourceUrl" END,
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "ToolTag" ("toolId", "tagId")
SELECT "Tool"."id", "Tag"."id"
FROM "Tool" JOIN "Tag" ON "Tag".slug IN ('ai', 'writing', 'audio')
WHERE "Tool".slug = 'yap'
ON CONFLICT DO NOTHING;

INSERT INTO "ToolIdentity" (key, "toolId")
SELECT 'url:yapapp.cc', id FROM "Tool" WHERE slug = 'yap'
ON CONFLICT DO NOTHING;

INSERT INTO "ToolDiscovery" (id, "toolId", source, method, "sourceKey", "sourceUrl", metadata)
SELECT gen_random_uuid()::text, id, 'MANUAL'::"ToolSource", 'issue',
  'korbinjoe/toools#12', 'https://github.com/korbinjoe/toools/issues/12',
  '{"reviewedOn":"2026-11-01","reviewBasis":"public documentation","sources":["https://yapapp.cc/","https://yapapp.cc/pricing","https://yapapp.cc/download","https://yapapp.cc/windows","https://yapapp.cc/android","https://yapapp.cc/offline-dictation-mac"]}'::jsonb
FROM "Tool" WHERE slug = 'yap'
ON CONFLICT ("toolId", source, method, "sourceKey") DO NOTHING;

COMMIT;

SELECT "name", "slug", "status", "pricing", "platforms", "url", "sourceUrl"
FROM "Tool" WHERE "slug" = 'yap';
