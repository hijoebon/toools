import assert from "node:assert/strict";
import test from "node:test";
import { HTML_METADATA_BOTS, classifyRequestActor } from "./crawlers";

test("HTML_METADATA_BOTS still matches the preserved allowlist entries", () => {
  // The Next.js allowlist uses Google-*/AdsBot-Google style tokens, not bare Googlebot.
  assert.match("AdsBot-Google", HTML_METADATA_BOTS);
  assert.match("Google-InspectionTool", HTML_METADATA_BOTS);
  assert.match("PerplexityBot/1.0", HTML_METADATA_BOTS);
  assert.match("ClaudeBot/1.0", HTML_METADATA_BOTS);
});

test("known search and AI bots map to known_bot with lowercase family", () => {
  assert.deepEqual(classifyRequestActor({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }), {
    actorClass: "known_bot",
    botFamily: "googlebot",
  });
  assert.deepEqual(classifyRequestActor({ userAgent: "Mozilla/5.0 (compatible; bingbot/2.0)" }), {
    actorClass: "known_bot",
    botFamily: "bingbot",
  });
  assert.deepEqual(classifyRequestActor({ userAgent: "PerplexityBot/1.0" }), {
    actorClass: "known_bot",
    botFamily: "perplexitybot",
  });
  assert.deepEqual(classifyRequestActor({ userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0" }), {
    actorClass: "known_bot",
    botFamily: "openai",
  });
  assert.deepEqual(classifyRequestActor({ userAgent: "ClaudeBot/1.0" }), {
    actorClass: "known_bot",
    botFamily: "anthropic",
  });
});

test("generic bot/spider/crawler UAs are suspected_bot", () => {
  assert.deepEqual(classifyRequestActor({ userAgent: "SomeRandomSpider/2.0" }), {
    actorClass: "suspected_bot",
    botFamily: "other_bot",
  });
  assert.deepEqual(classifyRequestActor({ userAgent: "acme-crawler" }), {
    actorClass: "suspected_bot",
    botFamily: "other_bot",
  });
});

test("Next.js prefetch purpose is never counted as human", () => {
  assert.deepEqual(
    classifyRequestActor({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      purpose: "prefetch",
    }),
    { actorClass: "suspected_bot", botFamily: "prefetch" },
  );
  assert.deepEqual(
    classifyRequestActor({
      userAgent: "Mozilla/5.0",
      purpose: "Sec-Purpose: prefetch; pr=0.5",
    }),
    { actorClass: "suspected_bot", botFamily: "prefetch" },
  );
});

test("ordinary browsers classify as human with null botFamily", () => {
  assert.deepEqual(
    classifyRequestActor({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }),
    { actorClass: "human", botFamily: null },
  );
});

test("missing UA is suspected, not human", () => {
  assert.deepEqual(classifyRequestActor({ userAgent: null }), {
    actorClass: "suspected_bot",
    botFamily: "missing_ua",
  });
  assert.deepEqual(classifyRequestActor({}), {
    actorClass: "suspected_bot",
    botFamily: "missing_ua",
  });
});
