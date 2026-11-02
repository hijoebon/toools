export const marketingGeoStage = {
  name: "GEO & AI Visibility",
  description:
    "Check AI search readiness and track brand mentions, recommendations, and citations in saved AI answers.",
  editorNote:
    "SiteOne Crawler for AI search readiness. OneGlanse for saved answers, brand mentions, and citations. OpenSEO connects AI visibility with SEO research. Compare consistent prompts over time; citations and visits are separate outcomes.",
  sortOrder: 4,
  tools: [
    { slug: "siteone-crawler", name: "SiteOne Crawler", initial: "S", color: "#2563EB" },
    { slug: "oneglanse", name: "OneGlanse", initial: "O", color: "#4F46E5" },
    { slug: "openseo", name: "OpenSEO", initial: "O", color: "#16A34A" },
  ],
};

export const marketingGrowthStack = {
  slug: "marketing-seo-growth",
  name: "Marketing, SEO & GEO Growth",
  tagline:
    "Research demand, publish useful content, and track visibility across search and AI answers.",
  description:
    "A marketing workflow for SEO and generative engine optimization (GEO) — research demand, create and distribute useful content, check AI search readiness, and measure brand visibility and conversions.",
  icon: "megaphone" as const,
  sortOrder: 6,
  audience: "Marketers & growth teams",
  stages: [
    {
      name: "Keyword Research",
      description: "Find opportunities and understand search intent.",
      editorNote:
        "Ahrefs for backlink and keyword depth. Semrush for competitive gaps. Ubersuggest for quick ideas on a budget.",
      sortOrder: 1,
      tools: [
        { slug: "ahrefs", name: "Ahrefs", initial: "A", color: "#FF8800" },
        { slug: "semrush", name: "Semrush", initial: "S", color: "#FF642D" },
        { slug: "ubersuggest", name: "Ubersuggest", initial: "U", color: "#FF7A59" },
      ],
    },
    {
      name: "Content Creation",
      description:
        "Plan, write, and polish useful content for search visitors and AI answers.",
      editorNote:
        "Notion for briefs and calendars. Grammarly for clarity. Hemingway Editor for readable prose. State clear answers and keep factual claims tied to sources.",
      sortOrder: 2,
      tools: [
        { slug: "notion", name: "Notion", initial: "N", color: "#1C1917" },
        { slug: "grammarly", name: "Grammarly", initial: "G", color: "#15C39A" },
        { slug: "hemingway-editor", name: "Hemingway", initial: "H", color: "#4B5563" },
      ],
    },
    {
      name: "Distribution",
      description: "Publish across email and social channels.",
      editorNote:
        "Buffer for social scheduling. Mailchimp for campaigns. ConvertKit for creator-style newsletters.",
      sortOrder: 3,
      tools: [
        { slug: "buffer", name: "Buffer", initial: "B", color: "#2C4BFF" },
        { slug: "mailchimp", name: "Mailchimp", initial: "M", color: "#FFE01B" },
        { slug: "convertkit", name: "ConvertKit", initial: "C", color: "#FB6970" },
      ],
    },
    marketingGeoStage,
    {
      name: "Measurement",
      description: "Track search performance, referral traffic, and on-site behavior.",
      editorNote:
        "Google Search Console for search performance. Mixpanel for product events. Hotjar for qualitative session insight. Measure visits and conversions separately from AI answer mentions and citations.",
      sortOrder: 5,
      tools: [
        { slug: "google-search-console", name: "Google Search Console", initial: "G", color: "#4285F4" },
        { slug: "mixpanel", name: "Mixpanel", initial: "M", color: "#7856FF" },
        { slug: "hotjar", name: "Hotjar", initial: "H", color: "#FF3C00" },
      ],
    },
  ],
};
