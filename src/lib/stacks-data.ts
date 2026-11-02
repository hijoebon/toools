import { marketingGrowthStack } from "@/lib/marketing-growth-stack";

export interface StackStagePreview {
  name: string;
  description?: string;
  editorNote?: string;
  tools: { name: string; initial: string; color: string }[];
}

export interface StackPreview {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: "terminal" | "pen-tool" | "building" | "git-branch" | "sparkles" | "megaphone" | "bar-chart" | "palette" | "users";
  audience: string;
  stages: StackStagePreview[];
}

export const stackPreviews: StackPreview[] = [
  {
    slug: "indie-developer-toolkit",
    name: "Indie Developer Toolkit",
    tagline: "Ship a SaaS product as a solo developer, from idea to launch.",
    description: "Everything you need to ship a SaaS product as a solo developer. From idea validation to launch and growth: a complete, opinionated tool chain.",
    icon: "terminal",
    audience: "Solo developers & indie hackers",
    stages: [
      { name: "Research", tools: [{ name: "Perplexity", initial: "P", color: "#6366F1" }, { name: "Notion", initial: "N", color: "#1C1917" }, { name: "Excalidraw", initial: "E", color: "#6D28D9" }] },
      { name: "Design", tools: [{ name: "Figma", initial: "F", color: "linear-gradient(135deg,#F24E1E,#A259FF)" }, { name: "Canva", initial: "C", color: "#00C4CC" }] },
      { name: "Dev", tools: [{ name: "Cursor", initial: "C", color: "#1C1917" }, { name: "VS Code", initial: "V", color: "#0078D4" }, { name: "GitHub", initial: "G", color: "#24292F" }] },
      { name: "Deploy", tools: [{ name: "Vercel", initial: "V", color: "#1C1917" }, { name: "Railway", initial: "R", color: "#7C3AED" }, { name: "Supabase", initial: "S", color: "#3ECF8E" }] },
      { name: "Analytics", tools: [{ name: "PostHog", initial: "P", color: "#1D4ED8" }, { name: "Sentry", initial: "S", color: "#362D59" }, { name: "Plausible", initial: "P", color: "#5850EC" }] },
      { name: "Launch", tools: [{ name: "Product Hunt", initial: "P", color: "#DA552F" }, { name: "Mailchimp", initial: "M", color: "#FFE01B" }, { name: "Buffer", initial: "B", color: "#2C4BFF" }] },
    ],
  },
  {
    slug: "content-creator-suite",
    name: "Content Creator Suite",
    tagline: "Create, publish, and grow your content across platforms.",
    description: "Tools to create, publish, and grow your content across platforms: blogs, videos, podcasts, and newsletters.",
    icon: "pen-tool",
    audience: "Bloggers, YouTubers & podcasters",
    stages: [
      { name: "Writing", tools: [{ name: "Notion", initial: "N", color: "#1C1917" }, { name: "ChatGPT", initial: "C", color: "#10A37F" }, { name: "Hemingway", initial: "H", color: "#4B5563" }] },
      { name: "Design", tools: [{ name: "Canva", initial: "C", color: "#00C4CC" }, { name: "Figma", initial: "F", color: "linear-gradient(135deg,#F24E1E,#A259FF)" }, { name: "Unsplash", initial: "U", color: "#1C1917" }] },
      { name: "Video", tools: [{ name: "Descript", initial: "D", color: "#2563EB" }, { name: "CapCut", initial: "C", color: "#1C1917" }] },
      { name: "Publish", tools: [{ name: "WordPress", initial: "W", color: "#21759B" }, { name: "Substack", initial: "S", color: "#FF6719" }, { name: "Buffer", initial: "B", color: "#2C4BFF" }] },
      { name: "Grow", tools: [{ name: "Google Analytics", initial: "G", color: "#E37400" }, { name: "Mailchimp", initial: "M", color: "#FFE01B" }] },
    ],
  },
  {
    slug: "startup-foundation",
    name: "Startup Foundation",
    tagline: "Essential tools to set up and run a lean startup team.",
    description: "Essential tools to set up and run a lean startup team: communication, project management, and operations.",
    icon: "building",
    audience: "Early-stage teams (2-5 people)",
    stages: [
      { name: "Comms", tools: [{ name: "Slack", initial: "S", color: "#4A154B" }, { name: "Notion", initial: "N", color: "#1C1917" }, { name: "Loom", initial: "L", color: "#625DF5" }] },
      { name: "Projects", tools: [{ name: "Linear", initial: "L", color: "#5E6AD2" }, { name: "GitHub", initial: "G", color: "#24292F" }] },
      { name: "Design", tools: [{ name: "Figma", initial: "F", color: "linear-gradient(135deg,#F24E1E,#A259FF)" }, { name: "Framer", initial: "F", color: "#0055FF" }, { name: "Canva", initial: "C", color: "#00C4CC" }] },
      { name: "Infra", tools: [{ name: "GitHub", initial: "G", color: "#24292F" }, { name: "Vercel", initial: "V", color: "#1C1917" }, { name: "Supabase", initial: "S", color: "#3ECF8E" }] },
      { name: "Ops", tools: [{ name: "Stripe", initial: "S", color: "#635BFF" }, { name: "Crisp", initial: "C", color: "#1972F5" }, { name: "Google Workspace", initial: "G", color: "#4285F4" }] },
    ],
  },
  {
    slug: "open-source-maintainer",
    name: "Open Source Maintainer",
    tagline: "Manage an open source project from code to community to funding.",
    description: "The complete toolkit for managing an open source project: from code to community to funding.",
    icon: "git-branch",
    audience: "OSS maintainers & contributors",
    stages: [
      { name: "Code", tools: [{ name: "GitHub", initial: "G", color: "#24292F" }, { name: "VS Code", initial: "V", color: "#0078D4" }, { name: "Cursor", initial: "C", color: "#1C1917" }] },
      { name: "CI/CD", tools: [{ name: "GitHub Actions", initial: "G", color: "#2088FF" }, { name: "Codecov", initial: "C", color: "#F01F7A" }] },
      { name: "Docs", tools: [{ name: "Docusaurus", initial: "D", color: "#3ECC5F" }, { name: "Mintlify", initial: "M", color: "#0D9373" }] },
      { name: "Community", tools: [{ name: "Discord", initial: "D", color: "#5865F2" }, { name: "GitHub Discussions", initial: "G", color: "#24292F" }] },
      { name: "Funding", tools: [{ name: "ConvertKit", initial: "C", color: "#FB6970" }, { name: "Buffer", initial: "B", color: "#2C4BFF" }, { name: "Mailchimp", initial: "M", color: "#FFE01B" }] },
    ],
  },
  {
    slug: "ai-product-builder",
    name: "AI Product Builder",
    tagline: "Prototype, design, and ship AI-powered products faster.",
    description: "From AI-assisted ideation to browser-based prototyping, automation, and deployment — a modern stack for building AI-native products.",
    icon: "sparkles",
    audience: "AI builders & product engineers",
    stages: [
      { name: "Assistants", tools: [{ name: "ChatGPT", initial: "C", color: "#10A37F" }, { name: "Claude", initial: "C", color: "#D97757" }, { name: "Perplexity", initial: "P", color: "#6366F1" }] },
      { name: "Prototype", tools: [{ name: "Replit", initial: "R", color: "#F26207" }, { name: "StackBlitz", initial: "S", color: "#1389FD" }, { name: "CodeSandbox", initial: "C", color: "#151515" }] },
      { name: "Design", tools: [{ name: "Figma", initial: "F", color: "linear-gradient(135deg,#F24E1E,#A259FF)" }, { name: "Excalidraw", initial: "E", color: "#6D28D9" }, { name: "tldraw", initial: "T", color: "#FAFAFA" }] },
      { name: "Automate", tools: [{ name: "Zapier", initial: "Z", color: "#FF4A00" }, { name: "n8n", initial: "n", color: "#EA4B71" }, { name: "Make", initial: "M", color: "#6D00CC" }] },
      { name: "Ship", tools: [{ name: "Vercel", initial: "V", color: "#1C1917" }, { name: "Railway", initial: "R", color: "#7C3AED" }, { name: "Supabase", initial: "S", color: "#3ECF8E" }] },
    ],
  },
  {
    ...marketingGrowthStack,
    stages: marketingGrowthStack.stages.map((stage) => ({
      name: stage.name,
      description: stage.description,
      editorNote: stage.editorNote,
      tools: stage.tools.map(({ name, initial, color }) => ({ name, initial, color })),
    })),
  },
  {
    slug: "data-insights-stack",
    name: "Data & Insights",
    tagline: "Collect, analyze, and share data that drives better decisions.",
    description: "From spreadsheets and product analytics to dashboards and stakeholder reporting — tools for data-informed teams.",
    icon: "bar-chart",
    audience: "Analysts & data-driven teams",
    stages: [
      { name: "Collect", tools: [{ name: "Airtable", initial: "A", color: "#FCB400" }, { name: "Google Sheets", initial: "G", color: "#34A853" }, { name: "Baserow", initial: "B", color: "#519EF5" }] },
      { name: "Analyze", tools: [{ name: "Mixpanel", initial: "M", color: "#7856FF" }, { name: "Hotjar", initial: "H", color: "#FF3C00" }, { name: "Google Search Console", initial: "G", color: "#4285F4" }] },
      { name: "Visualize", tools: [{ name: "Metabase", initial: "M", color: "#509EE3" }, { name: "Grafana", initial: "G", color: "#F46800" }, { name: "Observable", initial: "O", color: "#4269D0" }] },
      { name: "Report", tools: [{ name: "Notion", initial: "N", color: "#1C1917" }, { name: "Miro", initial: "M", color: "#FFD02F" }, { name: "Loom", initial: "L", color: "#625DF5" }] },
    ],
  },
  {
    slug: "design-workflow",
    name: "Design Workflow",
    tagline: "Research, design, polish, and hand off product UI with confidence.",
    description: "End-to-end design workflow — inspiration, UI tools, asset creation, and async review for product designers.",
    icon: "palette",
    audience: "Product & UI designers",
    stages: [
      { name: "Inspire", tools: [{ name: "Dribbble", initial: "D", color: "#EA4C89" }, { name: "Mobbin", initial: "M", color: "#1C1917" }, { name: "Unsplash", initial: "U", color: "#1C1917" }] },
      { name: "Design", tools: [{ name: "Figma", initial: "F", color: "linear-gradient(135deg,#F24E1E,#A259FF)" }, { name: "Penpot", initial: "P", color: "#000000" }, { name: "Excalidraw", initial: "E", color: "#6D28D9" }] },
      { name: "Assets", tools: [{ name: "Canva", initial: "C", color: "#00C4CC" }, { name: "Coolors", initial: "C", color: "#0066FF" }, { name: "Remove.bg", initial: "R", color: "#FF5757" }] },
      { name: "Handoff", tools: [{ name: "Miro", initial: "M", color: "#FFD02F" }, { name: "Loom", initial: "L", color: "#625DF5" }, { name: "Notion", initial: "N", color: "#1C1917" }] },
    ],
  },
  {
    slug: "remote-team-ops",
    name: "Remote Team Ops",
    tagline: "Run a distributed team with async communication and secure workflows.",
    description: "Communication, planning, knowledge sharing, and security essentials for remote and hybrid teams.",
    icon: "users",
    audience: "Remote & hybrid teams",
    stages: [
      { name: "Communicate", tools: [{ name: "Slack", initial: "S", color: "#4A154B" }, { name: "Loom", initial: "L", color: "#625DF5" }, { name: "Calendly", initial: "C", color: "#006BFF" }] },
      { name: "Plan", tools: [{ name: "Linear", initial: "L", color: "#5E6AD2" }, { name: "Miro", initial: "M", color: "#FFD02F" }, { name: "Todoist", initial: "T", color: "#E44332" }] },
      { name: "Knowledge", tools: [{ name: "Notion", initial: "N", color: "#1C1917" }, { name: "Obsidian", initial: "O", color: "#7C3AED" }, { name: "HackMD", initial: "H", color: "#000000" }] },
      { name: "Security", tools: [{ name: "Bitwarden", initial: "B", color: "#175DDC" }, { name: "1Password", initial: "1", color: "#0094F5" }, { name: "Have I Been Pwned", initial: "H", color: "#2A637B" }] },
    ],
  },
];
