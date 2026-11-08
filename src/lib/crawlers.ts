// Preserve Next.js 16.2.7's default HTML-limited bots and add AI search crawlers.
// Recheck the default list when upgrading Next.js; this config replaces it.
export const HTML_METADATA_BOTS =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Claude-SearchBot|anthropic-ai/i;

export type ActorClass = "human" | "known_bot" | "suspected_bot";

export type ClassifyRequestActorInput = {
  userAgent?: string | null;
  purpose?: string | null;
};

export type ClassifyRequestActorResult = {
  actorClass: ActorClass;
  /** Lowercase family for known/suspected bots; null for humans. */
  botFamily: string | null;
};

/** Ordered known-bot families; first match wins. Extends HTML_METADATA_BOTS coverage. */
const KNOWN_BOT_FAMILIES: ReadonlyArray<{ family: string; pattern: RegExp }> = [
  { family: "googlebot", pattern: /googlebot|google-[\w-]+|[\w-]+-google|googleweblight|adsbot-google/i },
  { family: "bingbot", pattern: /bingbot|bingpreview|msnbot/i },
  { family: "duckduckbot", pattern: /duckduckbot/i },
  { family: "baiduspider", pattern: /baiduspider/i },
  { family: "yandex", pattern: /yandex(bot)?/i },
  { family: "sogou", pattern: /sogou/i },
  { family: "applebot", pattern: /applebot/i },
  { family: "facebook", pattern: /facebookexternalhit|facebookcatalog|facebot/i },
  { family: "twitterbot", pattern: /twitterbot/i },
  { family: "linkedinbot", pattern: /linkedinbot/i },
  { family: "slackbot", pattern: /slackbot/i },
  { family: "discordbot", pattern: /discordbot/i },
  { family: "whatsapp", pattern: /whatsapp/i },
  { family: "skype", pattern: /skypeuripreview/i },
  { family: "yeti", pattern: /\byeti\b/i },
  { family: "openai", pattern: /oai-searchbot|chatgpt-user|gptbot/i },
  { family: "perplexitybot", pattern: /perplexitybot/i },
  { family: "anthropic", pattern: /claudebot|claude-searchbot|anthropic-ai/i },
  { family: "lighthouse", pattern: /chrome-lighthouse|lighthouse/i },
  { family: "yahoo", pattern: /\bslurp\b/i },
  { family: "bitlybot", pattern: /bitlybot/i },
  { family: "tumblr", pattern: /tumblr/i },
  { family: "vk", pattern: /vkshare/i },
  { family: "quora", pattern: /quora link preview/i },
  { family: "redditbot", pattern: /redditbot/i },
  { family: "ia_archiver", pattern: /ia_archiver/i },
  { family: "bytespider", pattern: /bytespider/i },
  { family: "amazonbot", pattern: /amazonbot/i },
  { family: "ccbot", pattern: /ccbot/i },
  { family: "semrushbot", pattern: /semrushbot/i },
  { family: "ahrefsbot", pattern: /ahrefsbot/i },
  { family: "dotbot", pattern: /dotbot/i },
  { family: "petalbot", pattern: /petalbot/i },
];

const GENERIC_BOT = /bot|spider|crawler|crawl/i;

/**
 * Classify a request actor for UA trend metrics.
 * Prefetch (Next.js) is never counted as human.
 */
export function classifyRequestActor(
  input: ClassifyRequestActorInput,
): ClassifyRequestActorResult {
  const purpose = (input.purpose ?? "").trim().toLowerCase();
  if (purpose.includes("prefetch")) {
    return { actorClass: "suspected_bot", botFamily: "prefetch" };
  }

  const ua = (input.userAgent ?? "").trim();
  if (!ua) {
    return { actorClass: "suspected_bot", botFamily: "missing_ua" };
  }

  for (const { family, pattern } of KNOWN_BOT_FAMILIES) {
    if (pattern.test(ua)) {
      return { actorClass: "known_bot", botFamily: family };
    }
  }

  // Catch remaining entries from the HTML metadata allowlist that escaped the map.
  if (HTML_METADATA_BOTS.test(ua)) {
    return { actorClass: "known_bot", botFamily: "other_known_bot" };
  }

  if (GENERIC_BOT.test(ua)) {
    return { actorClass: "suspected_bot", botFamily: "other_bot" };
  }

  return { actorClass: "human", botFamily: null };
}
