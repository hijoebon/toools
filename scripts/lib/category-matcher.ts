const SEO_MARKETING_KEYWORDS = [
  "seo", "search-engine-optimization", "technical-seo", "seo-audit",
  "search-engine-marketing", "rank-tracking", "serp-tracking", "serp",
  "keyword-research", "backlink", "backlinks", "link-building",
  "generative-engine-optimization", "answer-engine-optimization",
  "ai-search-optimization", "ai-search-visibility", "ai-visibility",
  "llm-visibility", "llm-search-optimization", "llm-seo", "ai-seo",
  "marketing", "marketing-automation", "email-marketing", "email-campaign",
  "email-campaigns", "social-media", "social-media-management",
  "social-media-scheduling", "advertising", "growth", "copywriting",
  "branding", "newsletter", "newsletters",
];

function normalizeHint(hint: string): string {
  return hint.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Explicit tool purpose takes precedence over implementation topics such as
// AI, TypeScript, SDK or automation. Bare "geo" is ambiguous with geography.
export function hasSeoMarketingIntent(hints: string[]): boolean {
  return hints.some((hint) => {
    const normalized = `-${normalizeHint(hint)}-`;
    return SEO_MARKETING_KEYWORDS.some((keyword) => normalized.includes(`-${keyword}-`));
  });
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "ai-assistants": [
    "ai", "artificial-intelligence", "machine-learning", "llm", "chatbot",
    "gpt", "language-model", "nlp", "deep-learning", "neural",
  ],
  design: [
    "design", "ui", "ux", "prototyping", "figma", "sketch", "color",
    "typography", "icon", "illustration", "wireframe", "mockup", "font",
    "css", "graphic", "svg",
  ],
  development: [
    "developer-tools", "code", "editor", "ide", "programming", "sdk",
    "framework", "library", "debugging", "testing", "git", "terminal",
    "cli", "devtools", "sandbox", "linter", "lint", "formatter",
    "compiler", "transpiler", "refactor", "snippet", "boilerplate",
  ],
  "writing-notes": [
    "writing", "note", "documentation", "markdown", "wiki", "knowledge-base",
    "journal", "text-editor", "blogging", "cms", "content-management",
  ],
  "image-media": [
    "image", "photo", "graphics", "svg", "png", "compression", "editing",
    "stock-photo", "screenshot", "ocr", "image-generation",
  ],
  "video-audio": [
    "video", "audio", "podcast", "streaming", "recording", "music",
    "transcription", "subtitle", "animation", "screen-recording",
  ],
  "seo-marketing": SEO_MARKETING_KEYWORDS,
  "data-analytics": [
    "analytics", "dashboard", "data", "visualization", "bi",
    "business-intelligence", "spreadsheet", "database", "sql", "charts",
    "reporting", "metrics", "log-management",
  ],
  productivity: [
    "productivity", "task-management", "project-management",
    "collaboration", "time-tracking", "todo", "kanban", "agile",
  ],
  automation: [
    "automation", "workflow", "no-code", "low-code", "integration",
    "api", "webhook", "rest", "graphql", "zapier", "middleware",
    "connector", "scheduler", "cron", "pipeline", "orchestration",
    "etl", "rpa",
  ],
  "deploy-hosting": [
    "hosting", "deploy", "deployment", "cloud", "serverless", "cdn",
    "infrastructure", "devops", "ci-cd", "container", "docker", "kubernetes",
    "web-server", "reverse-proxy",
  ],
  "security-privacy": [
    "security", "privacy", "password", "encryption", "vpn", "authentication",
    "firewall", "vulnerability", "compliance", "audit", "sso", "oauth",
  ],
  communication: [
    "chat", "messaging", "email", "forum", "discussion", "voice",
    "video-call", "conference", "social-network", "fediverse",
    "matrix", "xmpp", "irc", "notification", "real-time",
  ],
  business: [
    "crm", "sales", "invoice", "accounting", "billing", "payroll",
    "expense", "budget", "finance", "payment", "helpdesk", "ticketing",
    "support", "hr", "employee", "ecommerce", "e-commerce", "store",
    "inventory", "erp", "booking", "reservation", "appointment",
  ],
  "file-management": [
    "file-manager", "storage", "backup", "sync", "file-sharing",
    "cloud-storage", "file-hosting", "media-server", "photo-gallery",
    "torrent", "downloader", "pastebin",
  ],
  education: [
    "learning", "education", "course", "lms", "quiz", "classroom",
    "student", "teacher", "training", "flashcard",
  ],
  utilities: [
    "utility", "tool", "converter", "calculator", "browser",
    "launcher", "window-manager", "clipboard", "pdf", "archive",
    "bookmark", "rss", "feed-reader", "timer", "clock", "calendar",
    "translate", "weather", "health", "fitness",
  ],
};

export function matchCategory(hints: string[]): string {
  if (hasSeoMarketingIntent(hints)) return "seo-marketing";

  const normalizedHints = hints.map(normalizeHint).filter(Boolean);

  let bestMatch = "utilities";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // This category already used whole-word purpose matching above; do not let
    // substring scoring turn unrelated words such as "Seoul" into SEO tools.
    if (category === "seo-marketing") continue;

    let score = 0;
    for (const hint of normalizedHints) {
      for (const keyword of keywords) {
        if (hint.includes(keyword) || keyword.includes(hint)) {
          score++;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

export const PH_TOPIC_MAP: Record<string, string> = {
  "artificial-intelligence": "ai-assistants",
  "machine-learning": "ai-assistants",
  "chatbots": "ai-assistants",
  "design-tools": "design",
  "user-experience": "design",
  "prototyping": "design",
  "developer-tools": "development",
  "open-source": "development",
  "github": "development",
  "productivity": "productivity",
  "task-management": "productivity",
  "time-tracking": "productivity",
  "marketing": "seo-marketing",
  "seo": "seo-marketing",
  "search-engine-optimization": "seo-marketing",
  "generative-engine-optimization": "seo-marketing",
  "answer-engine-optimization": "seo-marketing",
  "ai-search-visibility": "seo-marketing",
  "marketing-automation": "seo-marketing",
  "email-marketing": "seo-marketing",
  "social-media-marketing": "seo-marketing",
  "analytics": "data-analytics",
  "data-visualization": "data-analytics",
  "web-hosting": "deploy-hosting",
  "saas": "deploy-hosting",
  "devops": "deploy-hosting",
  "security": "security-privacy",
  "privacy": "security-privacy",
  "crypto": "security-privacy",
  "media-tools": "image-media",
  "photo-editing": "image-media",
  "video": "video-audio",
  "podcasting": "video-audio",
  "audio": "video-audio",
  "writing-tools": "writing-notes",
  "note-taking": "writing-notes",
  "api": "automation",
  "no-code": "automation",
  "automation": "automation",
  "messaging": "communication",
  "social-networking": "communication",
  "email": "communication",
  "fintech": "business",
  "e-commerce": "business",
  "customer-communication": "business",
  "education": "education",
  "file-sharing": "file-management",
};
