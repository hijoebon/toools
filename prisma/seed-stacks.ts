import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CatalogPublication, runWithPublication } from "../scripts/lib/catalog-publication";
import { marketingGrowthStack } from "../src/lib/marketing-growth-stack";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const publication = new CatalogPublication();

const stacks = [
  {
    name: "Indie Developer Toolkit",
    slug: "indie-developer-toolkit",
    tagline: "Ship a SaaS product as a solo developer, from idea to launch.",
    description:
      "Everything you need to ship a SaaS product as a solo developer. From idea validation to launch and growth — a complete, opinionated tool chain.",
    icon: "terminal",
    sortOrder: 1,
    stages: [
      {
        name: "Idea & Research",
        description: "Validate your idea and research the market before writing code.",
        editorNote:
          "Use Perplexity for rapid market research, Notion to organize findings, and Excalidraw to sketch initial concepts.",
        sortOrder: 1,
        tools: ["perplexity", "notion", "excalidraw"],
      },
      {
        name: "Design",
        description: "Design your product's interface and create visual assets.",
        editorNote:
          "Figma is the industry standard for UI. Canva for quick marketing graphics. Excalidraw for architecture diagrams.",
        sortOrder: 2,
        tools: ["figma", "canva", "excalidraw"],
      },
      {
        name: "Development",
        description: "Write code, manage versions, and leverage AI assistance.",
        editorNote:
          "Replit for rapid AI-assisted prototyping. VS Code Web when you need a full editor in the browser. GitHub is non-negotiable for version control.",
        sortOrder: 3,
        tools: ["replit", "vs-code-web", "github"],
      },
      {
        name: "Deploy & Host",
        description: "Ship your product to production with modern hosting.",
        editorNote:
          "Vercel for your Next.js frontend, Railway for backend services, Supabase for database and auth — the modern indie stack.",
        sortOrder: 4,
        tools: ["vercel", "railway", "supabase"],
      },
      {
        name: "Analytics & Monitoring",
        description: "Track user behavior, monitor errors, and measure what matters.",
        editorNote:
          "Mixpanel for product analytics. Hotjar for behavior insights. Grafana for infrastructure and uptime monitoring.",
        sortOrder: 5,
        tools: ["mixpanel", "hotjar", "grafana"],
      },
      {
        name: "Launch & Grow",
        description: "Get your product in front of users and build an audience.",
        editorNote:
          "Build your audience with ConvertKit newsletters. Mailchimp for broader email campaigns. Buffer keeps social distribution consistent.",
        sortOrder: 6,
        tools: ["buffer", "mailchimp", "convertkit"],
      },
    ],
  },
  {
    name: "Content Creator Suite",
    slug: "content-creator-suite",
    tagline: "Create, publish, and grow your content across platforms.",
    description:
      "Tools to create, publish, and grow your content across platforms — blogs, videos, podcasts, and newsletters.",
    icon: "pen-tool",
    sortOrder: 2,
    stages: [
      {
        name: "Writing & Ideation",
        description: "Plan content, draft articles, and refine your writing.",
        editorNote:
          "Notion for organizing your content calendar. ChatGPT for brainstorming and drafts. Hemingway for punchy, readable prose.",
        sortOrder: 1,
        tools: ["notion", "chatgpt", "hemingway-editor"],
      },
      {
        name: "Visual Design",
        description: "Create thumbnails, graphics, and visual assets.",
        editorNote:
          "Canva for quick social graphics and thumbnails. Figma for custom illustrations. Unsplash for royalty-free photos.",
        sortOrder: 2,
        tools: ["canva", "figma", "unsplash"],
      },
      {
        name: "Video & Audio",
        description: "Record, edit, and produce video and audio content.",
        editorNote:
          "Descript is magic for podcast and video editing. Kapwing for quick social clips and repurposing.",
        sortOrder: 3,
        tools: ["descript", "kapwing"],
      },
      {
        name: "Publishing",
        description: "Distribute your content across platforms.",
        editorNote:
          "HackMD for collaborative markdown publishing. ConvertKit for newsletters. Buffer for social scheduling.",
        sortOrder: 4,
        tools: ["hackmd", "convertkit", "buffer"],
      },
      {
        name: "Growth & Analytics",
        description: "Track performance and grow your audience.",
        editorNote:
          "Google Search Console for organic search performance. Mailchimp for growing your email list.",
        sortOrder: 5,
        tools: ["google-search-console", "mailchimp"],
      },
    ],
  },
  {
    name: "Startup Foundation",
    slug: "startup-foundation",
    tagline: "Essential tools to set up and run a lean startup team.",
    description:
      "Essential tools to set up and run a lean startup team — communication, project management, and operations for early-stage teams of 2-5 people.",
    icon: "building",
    sortOrder: 3,
    stages: [
      {
        name: "Communication",
        description: "Keep your team aligned with async and sync communication.",
        editorNote:
          "Slack for real-time chat. Notion as your team wiki. Loom for async video updates.",
        sortOrder: 1,
        tools: ["slack", "notion", "loom"],
      },
      {
        name: "Project Management",
        description: "Track work, ship features, and stay organized.",
        editorNote:
          "Linear for beautiful issue tracking. GitHub Projects for dev-centric boards.",
        sortOrder: 2,
        tools: ["linear", "github"],
      },
      {
        name: "Design & Prototyping",
        description: "Design your product and create marketing assets.",
        editorNote:
          "Figma for product design. Penpot for open-source design files. Canva for quick assets.",
        sortOrder: 3,
        tools: ["figma", "penpot", "canva"],
      },
      {
        name: "Development Infrastructure",
        description: "Code hosting, deployment, and backend services.",
        editorNote:
          "GitHub for code. Vercel for deployment. Supabase for backend.",
        sortOrder: 4,
        tools: ["github", "vercel", "supabase"],
      },
      {
        name: "Business Operations",
        description: "Payments, support, and day-to-day operations.",
        editorNote:
          "Zapier connects your ops tools. Calendly for scheduling. Airtable for lightweight CRM and ops tracking.",
        sortOrder: 5,
        tools: ["zapier", "calendly", "airtable"],
      },
    ],
  },
  {
    name: "Open Source Maintainer",
    slug: "open-source-maintainer",
    tagline: "Manage an open source project from code to community to funding.",
    description:
      "The complete toolkit for managing an open source project — from code quality and CI/CD to documentation, community building, and sustainable funding.",
    icon: "git-branch",
    sortOrder: 4,
    stages: [
      {
        name: "Code & Editor",
        description: "Write, review, and manage your codebase.",
        editorNote:
          "GitHub is home for OSS. VS Code Web for browser editing. Replit for quick contributor sandboxes.",
        sortOrder: 1,
        tools: ["github", "vs-code-web", "replit"],
      },
      {
        name: "CI/CD",
        description: "Automate testing, builds, and releases.",
        editorNote:
          "Vercel and Netlify both offer Git-integrated deploy previews — pick the one that matches your stack.",
        sortOrder: 2,
        tools: ["vercel", "netlify"],
      },
      {
        name: "Documentation",
        description: "Write and publish project documentation.",
        editorNote:
          "HackMD for collaborative docs. Typst for beautiful, version-controlled technical writing.",
        sortOrder: 3,
        tools: ["hackmd", "typst"],
      },
      {
        name: "Community",
        description: "Build and engage your contributor community.",
        editorNote:
          "Slack for day-to-day community chat. Loom for async video updates and contributor onboarding.",
        sortOrder: 4,
        tools: ["slack", "loom"],
      },
      {
        name: "Funding",
        description: "Sustain your project with sponsorships and donations.",
        editorNote:
          "ConvertKit to nurture supporters via email. Buffer to maintain a public presence while you build momentum.",
        sortOrder: 5,
        tools: ["convertkit", "buffer"],
      },
    ],
  },
  {
    name: "AI Product Builder",
    slug: "ai-product-builder",
    tagline: "Prototype, design, and ship AI-powered products faster.",
    description:
      "From AI-assisted ideation to browser-based prototyping, automation, and deployment — a modern stack for building AI-native products.",
    icon: "sparkles",
    sortOrder: 5,
    stages: [
      {
        name: "AI Assistants",
        description: "Brainstorm, research, and draft with AI copilots.",
        editorNote:
          "ChatGPT for broad tasks, Claude for long-form reasoning, Perplexity for research with citations.",
        sortOrder: 1,
        tools: ["chatgpt", "claude", "perplexity"],
      },
      {
        name: "Prototyping",
        description: "Spin up working prototypes in the browser.",
        editorNote:
          "Replit for full-stack experiments. StackBlitz for instant Node frontends. CodeSandbox for component sandboxes.",
        sortOrder: 2,
        tools: ["replit", "stackblitz", "codesandbox"],
      },
      {
        name: "Design",
        description: "Sketch flows and UI before you commit to code.",
        editorNote:
          "Figma for high-fidelity UI. Excalidraw for diagrams. tldraw for quick whiteboarding.",
        sortOrder: 3,
        tools: ["figma", "excalidraw", "tldraw"],
      },
      {
        name: "Automation",
        description: "Connect services and automate repetitive workflows.",
        editorNote:
          "Zapier for no-code integrations. n8n when you need open-source control. Make for visual multi-step scenarios.",
        sortOrder: 4,
        tools: ["zapier", "n8n", "make"],
      },
      {
        name: "Deploy",
        description: "Ship to production with modern hosting and backend.",
        editorNote:
          "Vercel for frontend, Railway for services, Supabase for Postgres, auth, and realtime.",
        sortOrder: 5,
        tools: ["vercel", "railway", "supabase"],
      },
    ],
  },
  {
    ...marketingGrowthStack,
    stages: marketingGrowthStack.stages.map((stage) => ({
      ...stage,
      tools: stage.tools.map((tool) => tool.slug),
    })),
  },
  {
    name: "Data & Insights",
    slug: "data-insights-stack",
    tagline: "Collect, analyze, and share data that drives better decisions.",
    description:
      "From spreadsheets and product analytics to dashboards and stakeholder reporting — tools for data-informed teams.",
    icon: "bar-chart",
    sortOrder: 7,
    stages: [
      {
        name: "Data Collection",
        description: "Organize raw data in flexible tables and sheets.",
        editorNote:
          "Airtable for structured ops data. Google Sheets for quick collaboration. Baserow as an open-source Airtable alternative.",
        sortOrder: 1,
        tools: ["airtable", "google-sheets", "baserow"],
      },
      {
        name: "Product Analytics",
        description: "Understand how users behave in your product.",
        editorNote:
          "Mixpanel for event funnels. Hotjar for heatmaps and recordings. Search Console for acquisition trends.",
        sortOrder: 2,
        tools: ["mixpanel", "hotjar", "google-search-console"],
      },
      {
        name: "Visualization",
        description: "Build dashboards and explore data visually.",
        editorNote:
          "Metabase for self-serve BI. Grafana for metrics and alerting. Observable for interactive data notebooks.",
        sortOrder: 3,
        tools: ["metabase", "grafana", "observable"],
      },
      {
        name: "Reporting",
        description: "Share insights with stakeholders async.",
        editorNote:
          "Notion for written reports. Miro for workshop synthesis. Loom for walkthrough videos.",
        sortOrder: 4,
        tools: ["notion", "miro", "loom"],
      },
    ],
  },
  {
    name: "Design Workflow",
    slug: "design-workflow",
    tagline: "Research, design, polish, and hand off product UI with confidence.",
    description:
      "End-to-end design workflow — inspiration, UI tools, asset creation, and async review for product designers.",
    icon: "palette",
    sortOrder: 8,
    stages: [
      {
        name: "Inspiration",
        description: "Study patterns and gather visual references.",
        editorNote:
          "Dribbble for visual trends. Mobbin for real app UI patterns. Unsplash for photography.",
        sortOrder: 1,
        tools: ["dribbble", "mobbin", "unsplash"],
      },
      {
        name: "UI Design",
        description: "Design interfaces and iterate on flows.",
        editorNote:
          "Figma for collaborative UI. Penpot for open-source design files. Excalidraw for low-fi wireframes.",
        sortOrder: 2,
        tools: ["figma", "penpot", "excalidraw"],
      },
      {
        name: "Visual Assets",
        description: "Create graphics, palettes, and cutouts.",
        editorNote:
          "Canva for marketing graphics. Coolors for palette exploration. Remove.bg for instant cutouts.",
        sortOrder: 3,
        tools: ["canva", "coolors", "remove-bg"],
      },
      {
        name: "Review & Handoff",
        description: "Align with engineers and stakeholders async.",
        editorNote:
          "Miro for critique sessions. Loom for annotated walkthroughs. Notion for specs and decisions.",
        sortOrder: 4,
        tools: ["miro", "loom", "notion"],
      },
    ],
  },
  {
    name: "Remote Team Ops",
    slug: "remote-team-ops",
    tagline: "Run a distributed team with async communication and secure workflows.",
    description:
      "Communication, planning, knowledge sharing, and security essentials for remote and hybrid teams.",
    icon: "users",
    sortOrder: 9,
    stages: [
      {
        name: "Communication",
        description: "Stay connected across time zones without meeting overload.",
        editorNote:
          "Slack for daily chat. Loom for async video. Calendly to protect focus time.",
        sortOrder: 1,
        tools: ["slack", "loom", "calendly"],
      },
      {
        name: "Planning",
        description: "Track work and visualize roadmaps together.",
        editorNote:
          "Linear for issue tracking. Miro for roadmap workshops. Todoist for personal task clarity.",
        sortOrder: 2,
        tools: ["linear", "miro", "todoist"],
      },
      {
        name: "Knowledge Base",
        description: "Document decisions and make information discoverable.",
        editorNote:
          "Notion for team wiki. Obsidian for personal linked notes. HackMD for collaborative markdown.",
        sortOrder: 3,
        tools: ["notion", "obsidian", "hackmd"],
      },
      {
        name: "Security",
        description: "Protect credentials and monitor exposure.",
        editorNote:
          "Bitwarden for open-source password management. 1Password for team vaults. Have I Been Pwned for breach checks.",
        sortOrder: 4,
        tools: ["bitwarden", "1password", "have-i-been-pwned"],
      },
    ],
  },
];

async function main() {
  publication.prepare();
  for (const stackData of stacks) {
    const stack = await prisma.stack.upsert({
      where: { slug: stackData.slug },
      update: {
        name: stackData.name,
        tagline: stackData.tagline,
        description: stackData.description,
        icon: stackData.icon,
        sortOrder: stackData.sortOrder,
      },
      create: {
        name: stackData.name,
        slug: stackData.slug,
        tagline: stackData.tagline,
        description: stackData.description,
        icon: stackData.icon,
        sortOrder: stackData.sortOrder,
      },
    });
    publication.markChanged();

    for (const stageData of stackData.stages) {
      const existingStage = await prisma.stage.findFirst({
        where: { stackId: stack.id, name: stageData.name },
      });

      const stage = existingStage
        ? await prisma.stage.update({
            where: { id: existingStage.id },
            data: {
              description: stageData.description,
              editorNote: stageData.editorNote,
              sortOrder: stageData.sortOrder,
            },
          })
        : await prisma.stage.create({
            data: {
              name: stageData.name,
              description: stageData.description,
              editorNote: stageData.editorNote,
              sortOrder: stageData.sortOrder,
              stackId: stack.id,
            },
          });
      publication.markChanged();

      for (let i = 0; i < stageData.tools.length; i++) {
        const toolSlug = stageData.tools[i];
        const tool = await prisma.tool.findFirst({ where: { slug: toolSlug } });
        if (!tool) {
          console.warn(`  Tool "${toolSlug}" not found, skipping.`);
          continue;
        }
        await prisma.stageRecommendation.upsert({
          where: { stageId_toolId: { stageId: stage.id, toolId: tool.id } },
          update: { sortOrder: i },
          create: { stageId: stage.id, toolId: tool.id, sortOrder: i },
        });
        publication.markChanged();
      }
    }

    console.log(`Seeded stack: ${stackData.name}`);
  }
}

runWithPublication(main, () => publication, () => prisma.$disconnect())
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Stack seed failed");
    process.exitCode = 1;
  });
