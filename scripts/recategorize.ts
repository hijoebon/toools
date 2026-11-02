/**
 * Recategorize tools into expanded categories.
 *
 * Usage:
 *   npx tsx scripts/recategorize.ts
 *   DRY_RUN=false npx tsx scripts/recategorize.ts   # actually apply
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CatalogPublication, runWithPublication } from "./lib/catalog-publication";
import { hasSeoMarketingIntent } from "./lib/category-matcher";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const publication = new CatalogPublication();

const DRY_RUN = process.env.DRY_RUN !== "false";

const NEW_CATEGORIES = [
  { name: "Communication", slug: "communication", description: "Chat, email, messaging, forums, and video conferencing", icon: "MessageSquare", sortOrder: 13 },
  { name: "Business", slug: "business", description: "CRM, sales, finance, invoicing, HR, and e-commerce", icon: "Briefcase", sortOrder: 14 },
  { name: "Automation", slug: "automation", description: "Workflow automation, no-code platforms, and task scheduling", icon: "Zap", sortOrder: 15 },
  { name: "File Management", slug: "file-management", description: "File managers, cloud storage, backup, and sync", icon: "FolderOpen", sortOrder: 16 },
  { name: "Education", slug: "education", description: "Learning platforms, LMS, courses, and quizzes", icon: "GraduationCap", sortOrder: 17 },
  { name: "Utilities", slug: "utilities", description: "System tools, launchers, browsers, VPN, and desktop utilities", icon: "Wrench", sortOrder: 18 },
];

interface Rule {
  target: string;
  namePatterns?: string[];
  taglinePatterns?: string[];
  descriptionPatterns?: string[];
}

const RULES: Rule[] = [
  {
    target: "communication",
    taglinePatterns: [
      "chat", "messaging", "messenger", "email client", "email server",
      "mail server", "mail client", "webmail", "smtp", "imap",
      "voice over", "voip", "video call", "video conferenc",
      "forum", "discussion", "social network", "fediverse", "federated",
      "matrix", "xmpp", "irc ", "irc.", "slack alternative",
      "team communication", "real-time communicat",
      "push notification", "notification service",
      "comments", "commenting system",
    ],
    namePatterns: [
      "rocket.chat", "mattermost", "element", "jitsi", "mumble",
      "discourse", "flarum", "lemmy", "mastodon", "pleroma",
      "misskey", "gotify", "ntfy", "mailcow", "mailtrain",
    ],
  },
  {
    target: "business",
    taglinePatterns: [
      "crm", "customer relationship", "sales", "lead manage",
      "invoic", "billing", "accounting", "bookkeeping",
      "payroll", "expense", "budget", "financ",
      "payment", "point of sale", "pos ",
      "helpdesk", "help desk", "ticketing system", "support ticket",
      "human resource", "hr manage", "employee",
      "ecommerce", "e-commerce", "online store", "shopping cart",
      "inventory manage", "warehouse", "order manage",
      "erp", "enterprise resource",
      "real estate", "property manage",
      "appointment", "booking system", "reservation",
      "donation", "fundrais",
    ],
    namePatterns: [
      "erpnext", "odoo", "invoice ninja", "akaunting",
      "saleor", "medusa", "bagisto", "prestashop", "woocommerce",
      "osticket", "zammad", "freescout", "uvdesk",
    ],
  },
  {
    target: "automation",
    taglinePatterns: [
      "automat", "workflow engine", "workflow orchestrat",
      "no-code", "low-code", "nocode", "lowcode",
      "task scheduler", "job scheduler", "cron ",
      "zapier", "ifttt", "n8n alternative",
      "pipeline", "orchestrat", "etl",
      "business process", "bpm",
      "event-driven", "rules engine",
      "rpa", "robotic process",
    ],
    namePatterns: [
      "huginn", "activepieces", "automatisch", "kestra",
      "temporal", "airflow", "prefect", "dagster",
    ],
  },
  {
    target: "file-management",
    taglinePatterns: [
      "file manager", "file browser", "file sharing",
      "cloud storage", "object storage",
      "file hosting", "file server",
      "backup", "disaster recovery",
      "file sync", "file transfer",
      "document manage", "digital asset manage",
      "media server", "photo manage", "photo gallery",
      "torrent", "downloader",
      "pastebin", "paste service",
    ],
    namePatterns: [
      "nextcloud", "owncloud", "seafile", "minio",
      "filebrowser", "filestash", "photoprism", "immich",
      "piwigo", "lychee", "restic", "duplicati", "syncthing",
    ],
  },
  {
    target: "education",
    taglinePatterns: [
      "learning management", "lms", "e-learning", "elearning",
      "online course", "course platform",
      "quiz", "examination", "assessment",
      "classroom", "student", "teacher", "tutoring",
      "flashcard", "spaced repetition",
      "training platform", "educational",
      "language learning",
    ],
    namePatterns: [
      "moodle", "canvas", "chamilo", "ilias", "anki",
    ],
  },
  {
    target: "utilities",
    taglinePatterns: [
      "window manager", "window tiling",
      "menu bar", "menubar", "system tray",
      "clipboard manager", "clipboard history",
      "launcher", "spotlight alternative", "app launcher",
      "screenshot tool", "screen capture",
      "vpn ", "vpn.", "vpn client", "proxy",
      "dns server", "dns filter", "ad block", "adblock",
      "password manager", "password vault", "secret manage",
      "virtual machine", "virtualiz", "emulat",
      "package manager", "homebrew",
      "terminal emulat", "shell ",
      "keyboard shortcut", "hotkey",
      "system monitor", "system info",
      "disk usage", "disk clean",
      "browser", " browser",
    ],
    namePatterns: [
      "raycast", "alfred", "rectangle", "magnet", "bartender",
      "keepass", "bitwarden", "vaultwarden", "1password",
      "iterm", "alacritty", "wezterm", "kitty",
      "arc browser", "firefox", "chromium", "brave",
      "wireguard", "tailscale", "zerotier",
    ],
  },
  // Re-route misplaced items to existing categories
  {
    target: "development",
    taglinePatterns: [
      "linter", "lint ", "code analysis", "static analysis",
      "code quality", "code review",
      "package manager", "dependency manage",
      "git ", "version control",
      "code editor", "ide ",
      "debugging", "debugger",
      "compiler", "transpil",
      "code generat", "scaffolding",
      "testing framework", "test runner",
    ],
  },
  {
    target: "security-privacy",
    taglinePatterns: [
      "security scanner", "vulnerability", "penetration test",
      "firewall", "intrusion detect", "waf ",
      "sso ", "single sign-on", "oauth", "authenticat",
      "encryption", "encrypt ", "decrypt",
      "certificate", "ssl ", "tls ",
    ],
  },
  {
    target: "data-analytics",
    taglinePatterns: [
      "dashboard", "business intelligence",
      "data warehouse", "olap",
      "web analytics", "analytics platform",
      "reporting tool", "report generat",
      "log aggregat", "log manage",
    ],
  },
];

function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function findBestCategory(
  tool: { name: string; tagline: string; description: string },
  currentCategory: string,
): string | null {
  // Marketing automation and AI search tools belong with their use case,
  // before generic communication/automation/AI implementation rules.
  if (hasSeoMarketingIntent([tool.name, tool.tagline])) {
    return currentCategory === "seo-marketing" ? null : "seo-marketing";
  }

  for (const rule of RULES) {
    if (rule.target === currentCategory) continue;

    if (rule.namePatterns && matchesAny(tool.name, rule.namePatterns)) {
      return rule.target;
    }
    if (rule.taglinePatterns && matchesAny(tool.tagline, rule.taglinePatterns)) {
      return rule.target;
    }
    if (
      rule.descriptionPatterns &&
      matchesAny(tool.description, rule.descriptionPatterns)
    ) {
      return rule.target;
    }
  }
  return null;
}

async function main() {
  if (!DRY_RUN) publication.prepare();
  console.log(`=== Recategorize Tools ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"} ===\n`);

  // 1. Create new categories
  for (const cat of NEW_CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (existing) {
      console.log(`Category "${cat.name}" already exists, skipping.`);
      continue;
    }
    if (!DRY_RUN) {
      await prisma.category.create({ data: cat });
      publication.markChanged();
    }
    console.log(`Created category: ${cat.name}`);
  }

  // 2. Load category map
  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const categoryById = new Map(categories.map((c) => [c.id, c.slug]));

  // 3. Fetch all tools
  const tools = await prisma.tool.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      categoryId: true,
    },
  });

  console.log(`\nTotal tools: ${tools.length}\n`);

  const moves: Record<string, number> = {};
  let moveCount = 0;

  for (const tool of tools) {
    const currentSlug = categoryById.get(tool.categoryId) || "unknown";
    const newSlug = findBestCategory(
      { name: tool.name, tagline: tool.tagline, description: tool.description },
      currentSlug,
    );

    if (!newSlug) continue;

    const newCategoryId = categoryBySlug.get(newSlug);
    if (!newCategoryId) {
      console.warn(`  Category "${newSlug}" not found in DB, skipping.`);
      continue;
    }

    const key = `${currentSlug} → ${newSlug}`;
    moves[key] = (moves[key] || 0) + 1;
    moveCount++;

    if (!DRY_RUN) {
      await prisma.tool.update({
        where: { id: tool.id },
        data: { categoryId: newCategoryId },
      });
      publication.markChanged();
    }
  }

  console.log("=== Moves Summary ===");
  const sorted = Object.entries(moves).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    console.log(`  ${key}: ${count}`);
  }
  console.log(`\nTotal moves: ${moveCount}`);

  if (DRY_RUN) {
    console.log("\n(Dry run — no changes applied. Set DRY_RUN=false to apply.)");
  }

  // 4. Print final distribution
  if (!DRY_RUN) {
    const dist = await prisma.category.findMany({
      include: { _count: { select: { tools: { where: { status: "APPROVED" } } } } },
      orderBy: { sortOrder: "asc" },
    });
    console.log("\n=== Final Distribution ===");
    for (const c of dist) {
      console.log(`  ${c.name.padEnd(20)} ${c._count.tools}`);
    }
  }
}

runWithPublication(main, () => publication, () => prisma.$disconnect())
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Recategorization failed");
    process.exitCode = 1;
  });
