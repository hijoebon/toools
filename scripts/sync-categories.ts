import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CatalogPublication, runWithPublication } from "./lib/catalog-publication";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const publication = new CatalogPublication();

const CATEGORIES = [
  { name: "AI Assistants", slug: "ai-assistants", icon: "bot", sortOrder: 1 },
  { name: "Design", slug: "design", icon: "palette", sortOrder: 2 },
  { name: "Development", slug: "development", icon: "code-2", sortOrder: 3 },
  { name: "Writing & Notes", slug: "writing-notes", icon: "pen-line", sortOrder: 4 },
  { name: "Image & Media", slug: "image-media", icon: "image", sortOrder: 5 },
  { name: "Video & Audio", slug: "video-audio", icon: "film", sortOrder: 6 },
  { name: "SEO & GEO & Marketing", slug: "seo-marketing", description: "SEO analysis, generative engine optimization (GEO), AI search visibility, and marketing tools", icon: "trending-up", sortOrder: 7 },
  { name: "Data & Analytics", slug: "data-analytics", icon: "bar-chart-3", sortOrder: 8 },
  { name: "Productivity", slug: "productivity", icon: "zap", sortOrder: 9 },
  { name: "Automation", slug: "automation", icon: "workflow", sortOrder: 10 },
  { name: "Deploy & Hosting", slug: "deploy-hosting", icon: "rocket", sortOrder: 11 },
  { name: "Security & Privacy", slug: "security-privacy", icon: "shield", sortOrder: 12 },
  { name: "Communication", slug: "communication", icon: "message-square", sortOrder: 13 },
  { name: "Business", slug: "business", icon: "briefcase", sortOrder: 14 },
  { name: "File Management", slug: "file-management", icon: "folder-open", sortOrder: 15 },
  { name: "Education", slug: "education", icon: "graduation-cap", sortOrder: 16 },
  { name: "Utilities", slug: "utilities", icon: "wrench", sortOrder: 17 },
];

async function main() {
  publication.prepare();
  console.log("Syncing categories...\n");

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder },
    });
    publication.markChanged();
  }

  const all = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(`${all.length} categories in DB:`);
  for (const c of all) {
    console.log(`  ${c.slug.padEnd(20)} ${c.name}`);
  }

}

runWithPublication(main, () => publication, () => prisma.$disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Category sync failed");
    process.exitCode = 1;
  });
