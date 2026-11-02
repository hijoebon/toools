// Prisma seed script for the Toools tool directory.
// Run: npx prisma db seed
// Prerequisite: npx tsx must be available (install tsx as a dev dependency if missing):
//   npm install -D tsx

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CatalogPublication, runWithPublication } from "../scripts/lib/catalog-publication";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const publication = new CatalogPublication();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const IFRAME_CONFIG = {
  height: "calc(100vh - 12rem)",
  sandbox:
    "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox",
  allow: "clipboard-write; clipboard-read",
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categories = [
  {
    name: "AI Assistants",
    slug: "ai-assistants",
    icon: "bot",
    description: "AI-powered chat assistants and language models",
    sortOrder: 1,
  },
  {
    name: "Design",
    slug: "design",
    icon: "palette",
    description: "Design tools, prototyping, and visual collaboration",
    sortOrder: 2,
  },
  {
    name: "Development",
    slug: "development",
    icon: "code-2",
    description: "Code editors, sandboxes, and developer utilities",
    sortOrder: 3,
  },
  {
    name: "Writing & Notes",
    slug: "writing-notes",
    icon: "pen-line",
    description: "Note-taking, writing, and documentation tools",
    sortOrder: 4,
  },
  {
    name: "Image & Media",
    slug: "image-media",
    icon: "image",
    description: "Image editing, optimization, and media assets",
    sortOrder: 5,
  },
  {
    name: "Video & Audio",
    slug: "video-audio",
    icon: "film",
    description: "Video editing, audio production, and streaming",
    sortOrder: 6,
  },
  {
    name: "SEO & GEO & Marketing",
    slug: "seo-marketing",
    icon: "trending-up",
    description: "SEO analysis, generative engine optimization (GEO), AI search visibility, and marketing tools",
    sortOrder: 7,
  },
  {
    name: "Data & Analytics",
    slug: "data-analytics",
    icon: "bar-chart-3",
    description: "Dashboards, business intelligence, and data exploration",
    sortOrder: 8,
  },
  {
    name: "Productivity",
    slug: "productivity",
    icon: "zap",
    description: "Task management, calendaring, and workflow tools",
    sortOrder: 9,
  },
  {
    name: "API & Integration",
    slug: "api-integration",
    icon: "plug",
    description: "API clients, automation platforms, and integrations",
    sortOrder: 10,
  },
  {
    name: "Deploy & Hosting",
    slug: "deploy-hosting",
    icon: "rocket",
    description: "Cloud hosting, deployment, and infrastructure",
    sortOrder: 11,
  },
  {
    name: "Security & Privacy",
    slug: "security-privacy",
    icon: "shield",
    description: "Password managers, security scanning, and privacy tools",
    sortOrder: 12,
  },
];

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

const tags = [
  "AI",
  "Chatbot",
  "LLM",
  "Design",
  "Prototyping",
  "Collaboration",
  "Code Editor",
  "Sandbox",
  "Open Source",
  "Writing",
  "Markdown",
  "Note-taking",
  "Image Editing",
  "Compression",
  "Stock Media",
  "Video Editing",
  "Audio",
  "Text-to-Speech",
  "SEO",
  "Email Marketing",
  "Analytics",
  "Dashboard",
  "Database",
  "Spreadsheet",
  "Task Management",
  "Calendar",
  "API Client",
  "Automation",
  "Hosting",
  "Serverless",
  "Security",
  "Password Manager",
  "DevOps",
  "No-Code",
  "Generative AI",
];

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface ToolDef {
  name: string;
  tagline: string;
  description: string;
  url: string;
  iconUrl?: string;
  screenshotUrl?: string;
  embedMode?: "IFRAME" | "API" | "EXTERNAL";
  embedUrl?: string;
  embedConfig?: Record<string, unknown>;
  category: string; // slug
  pricing: "FREE" | "FREEMIUM" | "PAID" | "OPEN_SOURCE";
  platforms: string[];
  github?: string;
  isOpenSource?: boolean;
  featured?: boolean;
  tags: string[]; // tag names
}

const tools: ToolDef[] = [
  // ===== AI Assistants =====
  {
    name: "ChatGPT",
    tagline: "AI assistant by OpenAI",
    description:
      "ChatGPT is a conversational AI model developed by OpenAI that can answer questions, write code, summarize documents, and assist with a wide range of tasks using natural language.",
    url: "https://chat.openai.com",
    iconUrl: "https://chat.openai.com/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android", "macOS"],
    featured: true,
    tags: ["AI", "Chatbot", "LLM"],
  },
  {
    name: "Claude",
    tagline: "AI assistant by Anthropic",
    description:
      "Claude is Anthropic's AI assistant, known for nuanced understanding, long context windows, and careful reasoning. Ideal for writing, analysis, coding, and research.",
    url: "https://claude.ai",
    iconUrl: "https://claude.ai/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android", "macOS"],
    featured: true,
    tags: ["AI", "Chatbot", "LLM"],
  },
  {
    name: "Perplexity",
    tagline: "AI-powered search engine",
    description:
      "Perplexity combines LLM reasoning with real-time web search to provide sourced, conversational answers to any question.",
    url: "https://www.perplexity.ai",
    iconUrl: "https://www.perplexity.ai/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["AI", "Chatbot"],
  },
  {
    name: "Google Gemini",
    tagline: "Google's multimodal AI assistant",
    description:
      "Google Gemini (formerly Bard) is a multimodal AI chatbot powered by the Gemini family of models, tightly integrated with Google services.",
    url: "https://gemini.google.com",
    iconUrl: "https://gemini.google.com/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["AI", "Chatbot", "LLM"],
  },
  {
    name: "Poe",
    tagline: "Multi-model AI chat platform",
    description:
      "Poe by Quora lets you chat with multiple AI models including GPT-4, Claude, Gemini, and community-created bots in a single interface.",
    url: "https://poe.com",
    iconUrl: "https://poe.com/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android", "macOS"],
    tags: ["AI", "Chatbot"],
  },
  {
    name: "Mistral Le Chat",
    tagline: "Mistral AI's conversational assistant",
    description:
      "Le Chat is the conversational interface for Mistral AI's open-weight models, providing fast and capable AI assistance with strong multilingual support.",
    url: "https://chat.mistral.ai",
    iconUrl: "https://chat.mistral.ai/favicon.ico",
    category: "ai-assistants",
    pricing: "FREE",
    platforms: ["Web"],
    isOpenSource: true,
    tags: ["AI", "Chatbot", "Open Source"],
  },
  {
    name: "HuggingChat",
    tagline: "Open-source AI chat by Hugging Face",
    description:
      "HuggingChat is an open-source chat interface by Hugging Face, powered by leading open models like Llama, Mixtral, and more.",
    url: "https://huggingface.co/chat",
    iconUrl: "https://huggingface.co/favicon.ico",
    category: "ai-assistants",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/huggingface/chat-ui",
    isOpenSource: true,
    tags: ["AI", "Chatbot", "Open Source"],
  },
  {
    name: "Phind",
    tagline: "AI search engine for developers",
    description:
      "Phind is an AI-powered search engine and coding assistant optimized for technical questions and developer workflows.",
    url: "https://www.phind.com",
    iconUrl: "https://www.phind.com/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["AI", "Code Editor"],
  },
  {
    name: "You.com",
    tagline: "AI search and productivity suite",
    description:
      "You.com offers an AI-powered search engine with chat, image generation, and coding assistance all in one platform.",
    url: "https://you.com",
    iconUrl: "https://you.com/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["AI", "Chatbot"],
  },
  {
    name: "Cohere Coral",
    tagline: "Enterprise AI assistant by Cohere",
    description:
      "Coral is Cohere's enterprise-focused AI assistant that excels at retrieval-augmented generation, summarization, and business-grade conversational AI.",
    url: "https://coral.cohere.com",
    iconUrl: "https://coral.cohere.com/favicon.ico",
    category: "ai-assistants",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["AI", "LLM"],
  },

  // ===== Design =====
  {
    name: "Figma",
    tagline: "Collaborative interface design tool",
    description:
      "Figma is a cloud-based design and prototyping tool used by teams to create user interfaces, design systems, and interactive prototypes collaboratively in real time.",
    url: "https://www.figma.com",
    iconUrl: "https://www.figma.com/favicon.ico",
    category: "design",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows"],
    featured: true,
    tags: ["Design", "Prototyping", "Collaboration"],
  },
  {
    name: "Canva",
    tagline: "Visual design platform for everyone",
    description:
      "Canva is an easy-to-use online design platform with thousands of templates for social media graphics, presentations, posters, and more.",
    url: "https://www.canva.com",
    iconUrl: "https://www.canva.com/favicon.ico",
    category: "design",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android", "macOS", "Windows"],
    tags: ["Design", "No-Code"],
  },
  {
    name: "Excalidraw",
    tagline: "Virtual whiteboard for hand-drawn diagrams",
    description:
      "Excalidraw is an open-source virtual whiteboard tool that lets you create beautiful hand-drawn style diagrams, wireframes, and sketches collaboratively.",
    url: "https://excalidraw.com",
    iconUrl: "https://excalidraw.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://excalidraw.com",
    embedConfig: IFRAME_CONFIG,
    category: "design",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/excalidraw/excalidraw",
    isOpenSource: true,
    tags: ["Design", "Collaboration", "Open Source"],
  },
  {
    name: "Photopea",
    tagline: "Free online photo editor",
    description:
      "Photopea is a free, browser-based image editor supporting PSD, Sketch, XD, and many other formats. It offers a Photoshop-like experience without any installation.",
    url: "https://www.photopea.com",
    iconUrl: "https://www.photopea.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://www.photopea.com",
    embedConfig: IFRAME_CONFIG,
    category: "design",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Design", "Image Editing"],
  },
  {
    name: "tldraw",
    tagline: "Infinite canvas drawing tool",
    description:
      "tldraw is a free, open-source collaborative drawing application with an infinite canvas, perfect for diagramming, brainstorming, and sketching.",
    url: "https://www.tldraw.com",
    iconUrl: "https://www.tldraw.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://www.tldraw.com",
    embedConfig: IFRAME_CONFIG,
    category: "design",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/tldraw/tldraw",
    isOpenSource: true,
    tags: ["Design", "Collaboration", "Open Source"],
  },
  {
    name: "Penpot",
    tagline: "Open-source design and prototyping platform",
    description:
      "Penpot is the first open-source design and prototyping platform for cross-domain teams. It is web-based and works with open standards (SVG).",
    url: "https://penpot.app",
    iconUrl: "https://penpot.app/favicon.ico",
    category: "design",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/penpot/penpot",
    isOpenSource: true,
    tags: ["Design", "Prototyping", "Open Source"],
  },
  {
    name: "Coolors",
    tagline: "Color palette generator",
    description:
      "Coolors is a fast color palette generator that helps designers create, save, and share perfect color combinations for their projects.",
    url: "https://coolors.co",
    iconUrl: "https://coolors.co/favicon.ico",
    category: "design",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS"],
    tags: ["Design"],
  },
  {
    name: "Dribbble",
    tagline: "Design inspiration and portfolio community",
    description:
      "Dribbble is a community of designers sharing screenshots of their work, process, and projects. It serves as a source of inspiration and a hiring platform.",
    url: "https://dribbble.com",
    iconUrl: "https://dribbble.com/favicon.ico",
    category: "design",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Design", "Collaboration"],
  },
  {
    name: "Mobbin",
    tagline: "Mobile and web design reference library",
    description:
      "Mobbin is a curated library of real-world mobile and web UI patterns from the best-designed apps, enabling designers to find inspiration quickly.",
    url: "https://mobbin.com",
    iconUrl: "https://mobbin.com/favicon.ico",
    category: "design",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Design", "Prototyping"],
  },
  {
    name: "SVG Repo",
    tagline: "Free SVG icons and vectors",
    description:
      "SVG Repo provides 500,000+ open-licensed SVG vectors and icons. Search, explore, edit, and download free SVGs for commercial use.",
    url: "https://www.svgrepo.com",
    iconUrl: "https://www.svgrepo.com/favicon.ico",
    category: "design",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Design", "Open Source"],
  },
  {
    name: "Fomrix",
    tagline: "AI 3D generation and browser tools for 3D assets",
    description:
      "Fomrix turns text prompts and reference images into GLB 3D assets. Its browser tools can view GLB, STL, and OBJ files, convert GLB to STL, and inspect or repair STL meshes. AI generation uses credits, while the browser tools are free to use. Generated meshes should be checked before printing or production use.",
    url: "https://fomrix.com/",
    category: "design",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Design", "Generative AI"],
  },

  // ===== Development =====
  {
    name: "GitHub",
    tagline: "Code hosting and collaboration platform",
    description:
      "GitHub is the world's leading software development platform, offering Git repository hosting, code review, CI/CD, project management, and collaboration tools for developers.",
    url: "https://github.com",
    iconUrl: "https://github.com/favicon.ico",
    category: "development",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "Linux"],
    featured: true,
    tags: ["Code Editor", "Collaboration", "Open Source"],
  },
  {
    name: "CodeSandbox",
    tagline: "Online code editor and sandbox",
    description:
      "CodeSandbox is an online IDE for rapid web development. Prototype quickly, experiment easily, and share creations with a click.",
    url: "https://codesandbox.io",
    iconUrl: "https://codesandbox.io/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://codesandbox.io/s",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Code Editor", "Sandbox"],
  },
  {
    name: "StackBlitz",
    tagline: "Instant full-stack web IDE",
    description:
      "StackBlitz is a full-stack web IDE powered by WebContainers that runs Node.js natively in the browser. Boot entire dev environments in milliseconds.",
    url: "https://stackblitz.com",
    iconUrl: "https://stackblitz.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://stackblitz.com",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Code Editor", "Sandbox"],
  },
  {
    name: "Replit",
    tagline: "Collaborative browser-based IDE",
    description:
      "Replit is a collaborative IDE that supports 50+ languages and lets you code, build, and deploy apps directly from your browser with AI assistance.",
    url: "https://replit.com",
    iconUrl: "https://replit.com/favicon.ico",
    category: "development",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Code Editor", "Sandbox", "AI"],
  },
  {
    name: "VS Code Web",
    tagline: "Visual Studio Code in the browser",
    description:
      "VS Code for the Web provides a free, zero-install Microsoft Visual Studio Code experience running entirely in your browser.",
    url: "https://vscode.dev",
    iconUrl: "https://vscode.dev/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://vscode.dev",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/microsoft/vscode",
    isOpenSource: true,
    tags: ["Code Editor", "Open Source"],
  },
  {
    name: "Gitpod",
    tagline: "Automated cloud dev environments",
    description:
      "Gitpod provides automated, pre-built cloud development environments that spin up in seconds, letting you start coding instantly from any Git context.",
    url: "https://www.gitpod.io",
    iconUrl: "https://www.gitpod.io/favicon.ico",
    category: "development",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    github: "https://github.com/gitpod-io/gitpod",
    isOpenSource: true,
    tags: ["Code Editor", "DevOps", "Open Source"],
  },
  {
    name: "Hoppscotch",
    tagline: "Open-source API development ecosystem",
    description:
      "Hoppscotch is a lightweight, open-source API development suite. Design, test, and document APIs with a beautiful, fast, and minimal interface.",
    url: "https://hoppscotch.io",
    iconUrl: "https://hoppscotch.io/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://hoppscotch.io",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/hoppscotch/hoppscotch",
    isOpenSource: true,
    tags: ["API Client", "Open Source"],
  },
  {
    name: "Regex101",
    tagline: "Online regex tester and debugger",
    description:
      "Regex101 is an online tool for building, testing, and debugging regular expressions with real-time explanations, match highlighting, and a community library.",
    url: "https://regex101.com",
    iconUrl: "https://regex101.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://regex101.com",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Code Editor", "Sandbox"],
  },
  {
    name: "JSFiddle",
    tagline: "Online HTML/CSS/JS playground",
    description:
      "JSFiddle is a web-based code playground that lets you test and share HTML, CSS, and JavaScript code snippets with instant previews.",
    url: "https://jsfiddle.net",
    iconUrl: "https://jsfiddle.net/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://jsfiddle.net",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Code Editor", "Sandbox"],
  },
  {
    name: "CodePen",
    tagline: "Social development environment for front-end",
    description:
      "CodePen is a social development environment for front-end designers and developers. Build, test, and discover HTML, CSS, and JavaScript code with an online editor.",
    url: "https://codepen.io",
    iconUrl: "https://codepen.io/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://codepen.io/pen",
    embedConfig: IFRAME_CONFIG,
    category: "development",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Code Editor", "Sandbox", "Collaboration"],
  },

  // ===== Writing & Notes =====
  {
    name: "Notion",
    tagline: "All-in-one workspace for notes and docs",
    description:
      "Notion is a connected workspace that combines notes, docs, wikis, project management, and databases into one unified tool for individuals and teams.",
    url: "https://www.notion.so",
    iconUrl: "https://www.notion.so/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    featured: true,
    tags: ["Note-taking", "Collaboration", "Task Management"],
  },
  {
    name: "Obsidian",
    tagline: "Private knowledge base with Markdown",
    description:
      "Obsidian is a powerful knowledge base on top of a local folder of plain text Markdown files. It features bidirectional linking, graph views, and a rich plugin ecosystem.",
    url: "https://obsidian.md",
    iconUrl: "https://obsidian.md/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["macOS", "Windows", "Linux", "iOS", "Android"],
    tags: ["Note-taking", "Markdown"],
  },
  {
    name: "HackMD",
    tagline: "Collaborative Markdown editor",
    description:
      "HackMD is a real-time collaborative Markdown editor with support for diagrams, slides, and book mode. Great for documentation and knowledge sharing.",
    url: "https://hackmd.io",
    iconUrl: "https://hackmd.io/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://hackmd.io",
    embedConfig: IFRAME_CONFIG,
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Writing", "Markdown", "Collaboration"],
  },
  {
    name: "Hemingway Editor",
    tagline: "Make your writing bold and clear",
    description:
      "Hemingway Editor highlights complex sentences, passive voice, and readability issues to help you write bold and clear prose.",
    url: "https://hemingwayapp.com",
    iconUrl: "https://hemingwayapp.com/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows"],
    tags: ["Writing"],
  },
  {
    name: "Grammarly",
    tagline: "AI writing assistant for grammar and style",
    description:
      "Grammarly is an AI-powered writing assistant that checks grammar, spelling, punctuation, and style, providing real-time suggestions across platforms.",
    url: "https://www.grammarly.com",
    iconUrl: "https://www.grammarly.com/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    tags: ["Writing", "AI"],
  },
  {
    name: "StackEdit",
    tagline: "In-browser Markdown editor",
    description:
      "StackEdit is a full-featured, open-source Markdown editor that runs in your browser. It syncs with Google Drive and Dropbox and supports LaTeX math expressions.",
    url: "https://stackedit.io",
    iconUrl: "https://stackedit.io/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://stackedit.io/app",
    embedConfig: IFRAME_CONFIG,
    category: "writing-notes",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/benweet/stackedit",
    isOpenSource: true,
    tags: ["Writing", "Markdown", "Open Source"],
  },
  {
    name: "Typst",
    tagline: "Modern typesetting system for documents",
    description:
      "Typst is a new markup-based typesetting system designed to be as powerful as LaTeX while being much easier to learn and use, with real-time collaborative editing.",
    url: "https://typst.app",
    iconUrl: "https://typst.app/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    github: "https://github.com/typst/typst",
    isOpenSource: true,
    tags: ["Writing", "Open Source"],
  },
  {
    name: "Bear",
    tagline: "Beautiful writing app for notes and prose",
    description:
      "Bear is a beautiful, flexible writing app for crafting notes and prose. It supports Markdown, nested tags, and cross-linking with a focus on simplicity.",
    url: "https://bear.app",
    iconUrl: "https://bear.app/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["macOS", "iOS"],
    tags: ["Note-taking", "Markdown"],
  },
  {
    name: "Craft",
    tagline: "Beautiful document and note editor",
    description:
      "Craft is a native document editor that combines the power of a word processor with the simplicity of a note-taking app, featuring rich blocks and beautiful sharing.",
    url: "https://www.craft.do",
    iconUrl: "https://www.craft.do/favicon.ico",
    category: "writing-notes",
    pricing: "FREEMIUM",
    platforms: ["macOS", "iOS", "Web"],
    tags: ["Note-taking", "Writing"],
  },
  {
    name: "Logseq",
    tagline: "Open-source knowledge management",
    description:
      "Logseq is a privacy-first, open-source platform for knowledge management and collaboration with outliner-based note-taking and powerful graph features.",
    url: "https://logseq.com",
    iconUrl: "https://logseq.com/favicon.ico",
    category: "writing-notes",
    pricing: "OPEN_SOURCE",
    platforms: ["macOS", "Windows", "Linux", "iOS", "Android"],
    github: "https://github.com/logseq/logseq",
    isOpenSource: true,
    tags: ["Note-taking", "Open Source", "Markdown"],
  },

  // ===== Image & Media =====
  {
    name: "Remove.bg",
    tagline: "Remove image backgrounds automatically",
    description:
      "Remove.bg uses AI to automatically remove the background from any photo in seconds, producing clean transparent PNG results.",
    url: "https://www.remove.bg",
    iconUrl: "https://www.remove.bg/favicon.ico",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Image Editing", "AI"],
  },
  {
    name: "TinyPNG",
    tagline: "Smart PNG and JPEG compression",
    description:
      "TinyPNG uses smart lossy compression techniques to reduce the file size of PNG and JPEG images while preserving visual quality.",
    url: "https://tinypng.com",
    iconUrl: "https://tinypng.com/favicon.ico",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Image Editing", "Compression"],
  },
  {
    name: "Squoosh",
    tagline: "Image compression web app by Google",
    description:
      "Squoosh is an open-source image compression web app by Google Chrome Labs that lets you compare codecs, resize, and optimize images with advanced options.",
    url: "https://squoosh.app",
    iconUrl: "https://squoosh.app/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://squoosh.app",
    embedConfig: IFRAME_CONFIG,
    category: "image-media",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/GoogleChromeLabs/squoosh",
    isOpenSource: true,
    tags: ["Image Editing", "Compression", "Open Source"],
  },
  {
    name: "Clipdrop",
    tagline: "AI-powered creative tools suite",
    description:
      "Clipdrop offers a suite of AI-powered tools for image editing, including background removal, upscaling, relighting, and generative fill.",
    url: "https://clipdrop.co",
    iconUrl: "https://clipdrop.co/favicon.ico",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Image Editing", "AI", "Generative AI"],
  },
  {
    name: "Unsplash",
    tagline: "Free high-resolution photos",
    description:
      "Unsplash is the internet's source of freely-usable images. Over 3 million high-resolution photos contributed by photographers worldwide.",
    url: "https://unsplash.com",
    iconUrl: "https://unsplash.com/favicon.ico",
    category: "image-media",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Stock Media"],
  },
  {
    name: "Pexels",
    tagline: "Free stock photos and videos",
    description:
      "Pexels provides high-quality, completely free stock photos and videos shared by talented creators around the world.",
    url: "https://www.pexels.com",
    iconUrl: "https://www.pexels.com/favicon.ico",
    category: "image-media",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Stock Media"],
  },
  {
    name: "Pixlr",
    tagline: "AI-powered online photo editor",
    description:
      "Pixlr is a cloud-based set of photo editing tools and utilities including AI-powered features like auto background removal, object removal, and photo enhancement.",
    url: "https://pixlr.com",
    iconUrl: "https://pixlr.com/favicon.ico",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Image Editing", "AI"],
  },
  {
    name: "Cleanup.pictures",
    tagline: "Remove objects from photos with AI",
    description:
      "Cleanup.pictures is a free web tool that lets you remove unwanted objects, people, text, and defects from any picture using AI inpainting.",
    url: "https://cleanup.pictures",
    iconUrl: "https://cleanup.pictures/favicon.ico",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Image Editing", "AI"],
  },
  {
    name: "DALL-E",
    tagline: "AI image generation by OpenAI",
    description:
      "DALL-E is OpenAI's AI system that can create realistic images and art from natural language descriptions, enabling anyone to generate visual content.",
    url: "https://openai.com/dall-e",
    iconUrl: "https://openai.com/favicon.ico",
    category: "image-media",
    pricing: "PAID",
    platforms: ["Web"],
    featured: true,
    tags: ["Generative AI", "AI", "Image Editing"],
  },
  {
    name: "Midjourney",
    tagline: "AI art and image generation",
    description:
      "Midjourney is an independent research lab that produces an AI program generating images from textual descriptions, known for its artistic and photorealistic outputs.",
    url: "https://www.midjourney.com",
    iconUrl: "https://www.midjourney.com/favicon.ico",
    category: "image-media",
    pricing: "PAID",
    platforms: ["Web"],
    tags: ["Generative AI", "AI"],
  },
  {
    name: "aigeneratornsfw.com",
    tagline: "18+ AI studio for images and short videos",
    description:
      "aigeneratornsfw.com is an adults-only, browser-based studio for AI image generation, reference-image editing, image animation, and short video creation. The submitter describes the service as intended for non-explicit content, with model-specific restrictions. Image creation uses daily credits; video generation requires a paid membership and sufficient credits. Adults 18+ only.",
    url: "https://aigeneratornsfw.com/",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Generative AI", "Image Editing"],
  },
  {
    name: "PicCollages",
    tagline: "Free browser-based photo collages and image tools",
    description:
      "PicCollages offers free browser-based photo collage layouts, vertical and horizontal image stitching, and a free-layout editor. Users can add text, stickers, backgrounds, borders, and filters, then export PNG or JPG files. The site says selected photos are processed locally in the browser and that advertising supports the free tools.",
    url: "https://piccollages.com/",
    category: "image-media",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Image Editing", "Design"],
  },
  {
    name: "Describe Image",
    tagline: "AI descriptions, alt text, and OCR for images and videos",
    description:
      "Describe Image analyzes images and videos to draft descriptions, alt text, extracted text, visual prompts, and video summaries. Guests can try two image generations per day; paid plans provide more credits and advanced features. AI outputs should be reviewed before reuse, especially for accessibility or factual content.",
    url: "https://describeimage.io/",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["AI"],
  },
  {
    name: "MangaTranslate",
    tagline: "Translate manga images and PDFs with OCR and an online layout editor",
    description:
      "MangaTranslate is a cloud-based tool for translating manga, comic images, and PDFs. It combines OCR, translation, and typesetting with batch uploads and an online editor for reviewing dialogue, fonts, and layout. Limited daily free credits are available alongside paid plans; API access is billed separately. Use your own or authorized material and review the translated text and layout before publishing.",
    url: "https://www.mangatranslate.com/",
    category: "image-media",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["AI", "Image Editing"],
  },

  // ===== Video & Audio =====
  {
    name: "Voice Prompter",
    tagline: "Free browser teleprompter with speech tracking and local scripts",
    description:
      "According to its maker's submission, Voice Prompter is a free browser teleprompter for rehearsing and reading scripts alongside a separate recording app. It offers manual and automatic scrolling, speech tracking, mirrored text, adjustable typography, a local script library, text export, and a floating script window in supported desktop browsers. No account or credit card is required. It does not record video, generate scripts, or sync scripts to the cloud. Speech recognition depends on the browser, language, and service; audio may be processed by the browser's speech provider. The publicly viewable code has no open-source license.",
    url: "https://teleprompter.dev/",
    category: "video-audio",
    pricing: "FREE",
    platforms: ["Web"],
    isOpenSource: false,
    tags: ["Writing", "Audio"],
  },
  {
    name: "BabyVideo.ai",
    tagline: "Create playful baby portraits and short videos from photos",
    description:
      "BabyVideo.ai creates entertainment-only future-baby portraits from one or two parent photos and offers tools to animate baby photos into talking, singing, or dancing clips. Results are creative previews, not medical or genetic predictions. Signed-in users can earn limited daily check-in credits; paid packs and plans are also available.",
    url: "https://babyvideo.ai/",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Generative AI", "AI"],
  },
  {
    name: "Hotel Lobby AI",
    tagline: "Create 18+ portrait videos and orange-booth images",
    description:
      "Hotel Lobby AI is an adults-only browser tool for placing consenting adults' portraits into short video templates or a user-supplied video and creating orange recording-booth images. The submitter says users can choose which detected faces to replace. Use media only with permission and review AI results before sharing. The submission describes a limited trial of one image and one four-second video; credit packs are listed as coming soon.",
    url: "https://hotellobbyaigenerator.co/",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Generative AI", "Video Editing"],
  },
  {
    name: "Descript",
    tagline: "AI-powered video and podcast editor",
    description:
      "Descript is an all-in-one video and podcast editor that makes editing as easy as editing a document. Features transcription, screen recording, and AI voice cloning.",
    url: "https://www.descript.com",
    iconUrl: "https://www.descript.com/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows"],
    tags: ["Video Editing", "Audio", "AI"],
  },
  {
    name: "Kapwing",
    tagline: "Online video editor for teams",
    description:
      "Kapwing is a collaborative online video editor with tools for trimming, subtitles, resizing, and AI-powered features like auto-captions and text-to-video.",
    url: "https://www.kapwing.com",
    iconUrl: "https://www.kapwing.com/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Video Editing", "Collaboration"],
  },
  {
    name: "Loom",
    tagline: "Async video messaging for work",
    description:
      "Loom lets you record quick videos of your screen and camera to share with teammates, replacing meetings with async video messaging.",
    url: "https://www.loom.com",
    iconUrl: "https://www.loom.com/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    tags: ["Video Editing", "Collaboration"],
  },
  {
    name: "Riverside.fm",
    tagline: "Studio-quality podcast and video recording",
    description:
      "Riverside.fm is a remote recording platform that captures studio-quality audio and 4K video locally, ensuring professional results regardless of internet quality.",
    url: "https://riverside.fm",
    iconUrl: "https://riverside.fm/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Audio", "Video Editing"],
  },
  {
    name: "ElevenLabs",
    tagline: "AI voice synthesis and cloning",
    description:
      "ElevenLabs offers the most realistic AI text-to-speech and voice cloning technology. Create natural-sounding voiceovers in any voice and language.",
    url: "https://elevenlabs.io",
    iconUrl: "https://elevenlabs.io/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    featured: true,
    tags: ["Text-to-Speech", "AI", "Audio"],
  },
  {
    name: "Synthesia",
    tagline: "AI video generation with virtual avatars",
    description:
      "Synthesia is an AI video generation platform that creates professional videos with AI avatars and voiceovers in 120+ languages, no camera or studio needed.",
    url: "https://www.synthesia.io",
    iconUrl: "https://www.synthesia.io/favicon.ico",
    category: "video-audio",
    pricing: "PAID",
    platforms: ["Web"],
    tags: ["Video Editing", "AI", "Generative AI"],
  },
  {
    name: "VEED.io",
    tagline: "Simple online video editor",
    description:
      "VEED.io is an easy-to-use online video editor with auto-subtitles, screen recording, translations, and social media formatting tools.",
    url: "https://www.veed.io",
    iconUrl: "https://www.veed.io/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Video Editing"],
  },
  {
    name: "Opus Clip",
    tagline: "AI-powered video repurposing",
    description:
      "Opus Clip uses AI to automatically turn long videos into viral short clips, with smart scene detection, auto-captions, and social media formatting.",
    url: "https://www.opus.pro",
    iconUrl: "https://www.opus.pro/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Video Editing", "AI"],
  },
  {
    name: "RunwayML",
    tagline: "AI creative tools for video and image",
    description:
      "Runway is an applied AI research company building the next generation of creative tools, featuring AI video generation, image editing, and motion tracking.",
    url: "https://runwayml.com",
    iconUrl: "https://runwayml.com/favicon.ico",
    category: "video-audio",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Video Editing", "AI", "Generative AI"],
  },
  {
    name: "Whisper",
    tagline: "Open-source speech recognition by OpenAI",
    description:
      "Whisper is an open-source automatic speech recognition system by OpenAI, available as a demo on Hugging Face. It supports multilingual transcription and translation.",
    url: "https://huggingface.co/spaces/openai/whisper",
    iconUrl: "https://huggingface.co/favicon.ico",
    category: "video-audio",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/openai/whisper",
    isOpenSource: true,
    tags: ["Audio", "AI", "Open Source"],
  },

  // ===== SEO & GEO & Marketing =====
  {
    name: "Ahrefs",
    tagline: "All-in-one SEO toolset",
    description:
      "Ahrefs is a comprehensive SEO toolset offering site auditing, keyword research, competitor analysis, backlink tracking, and rank monitoring.",
    url: "https://ahrefs.com",
    iconUrl: "https://ahrefs.com/favicon.ico",
    category: "seo-marketing",
    pricing: "PAID",
    platforms: ["Web"],
    tags: ["SEO", "Analytics"],
  },
  {
    name: "Semrush",
    tagline: "Online marketing and SEO platform",
    description:
      "Semrush is an all-in-one digital marketing suite providing tools for SEO, PPC, content marketing, social media, and competitive analysis.",
    url: "https://www.semrush.com",
    iconUrl: "https://www.semrush.com/favicon.ico",
    category: "seo-marketing",
    pricing: "PAID",
    platforms: ["Web"],
    tags: ["SEO", "Analytics"],
  },
  {
    name: "Ubersuggest",
    tagline: "Free SEO and keyword research tool",
    description:
      "Ubersuggest by Neil Patel offers keyword suggestions, content ideas, backlink analysis, and site audits to help improve search rankings.",
    url: "https://neilpatel.com/ubersuggest",
    iconUrl: "https://neilpatel.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["SEO"],
  },
  {
    name: "AnswerThePublic",
    tagline: "Search listening and content ideas",
    description:
      "AnswerThePublic visualizes search questions and autocomplete data to help marketers and content creators discover what people are asking about any topic.",
    url: "https://answerthepublic.com",
    iconUrl: "https://answerthepublic.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["SEO", "Writing"],
  },
  {
    name: "Google Search Console",
    tagline: "Monitor your site in Google Search",
    description:
      "Google Search Console helps you measure your site's search traffic and performance, fix issues, and optimize your presence in Google Search results.",
    url: "https://search.google.com/search-console",
    iconUrl: "https://www.google.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["SEO", "Analytics"],
  },
  {
    name: "Mailchimp",
    tagline: "Email marketing and automation platform",
    description:
      "Mailchimp is a leading email marketing platform that helps businesses create, send, and analyze email campaigns with automation, templates, and audience management.",
    url: "https://mailchimp.com",
    iconUrl: "https://mailchimp.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Email Marketing", "Automation"],
  },
  {
    name: "ConvertKit",
    tagline: "Email marketing for creators",
    description:
      "ConvertKit (now Kit) is an email marketing platform built specifically for creators, offering landing pages, email sequences, and subscriber management.",
    url: "https://convertkit.com",
    iconUrl: "https://convertkit.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Email Marketing"],
  },
  {
    name: "Buffer",
    tagline: "Social media management toolkit",
    description:
      "Buffer helps you plan, schedule, and publish content across social media platforms while providing analytics and engagement tools.",
    url: "https://buffer.com",
    iconUrl: "https://buffer.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Automation"],
  },
  {
    name: "Mixpanel",
    tagline: "Product analytics for user behavior",
    description:
      "Mixpanel is a powerful product analytics platform that helps teams analyze user behavior, measure engagement, and make data-driven decisions.",
    url: "https://mixpanel.com",
    iconUrl: "https://mixpanel.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Analytics", "Dashboard"],
  },
  {
    name: "Hotjar",
    tagline: "Website heatmaps and behavior analytics",
    description:
      "Hotjar provides heatmaps, session recordings, surveys, and feedback tools to understand how users behave on your website and improve UX.",
    url: "https://www.hotjar.com",
    iconUrl: "https://www.hotjar.com/favicon.ico",
    category: "seo-marketing",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Analytics"],
  },

  // ===== Data & Analytics =====
  {
    name: "Metabase",
    tagline: "Open-source business intelligence",
    description:
      "Metabase is an open-source BI tool that lets you ask questions about your data and display answers in meaningful formats like dashboards and charts.",
    url: "https://www.metabase.com",
    iconUrl: "https://www.metabase.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://www.metabase.com/demo",
    embedConfig: IFRAME_CONFIG,
    category: "data-analytics",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/metabase/metabase",
    isOpenSource: true,
    tags: ["Dashboard", "Analytics", "Open Source"],
  },
  {
    name: "Retool",
    tagline: "Build internal tools fast",
    description:
      "Retool is a low-code platform for building internal tools. Connect to any database or API and build apps with drag-and-drop components and custom code.",
    url: "https://retool.com",
    iconUrl: "https://retool.com/favicon.ico",
    category: "data-analytics",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Dashboard", "No-Code", "Database"],
  },
  {
    name: "Airtable",
    tagline: "Spreadsheet-database hybrid platform",
    description:
      "Airtable is a cloud-based platform that combines the simplicity of spreadsheets with the power of databases, offering views, automations, and app building.",
    url: "https://airtable.com",
    iconUrl: "https://airtable.com/favicon.ico",
    category: "data-analytics",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    tags: ["Spreadsheet", "Database", "No-Code"],
  },
  {
    name: "Google Sheets",
    tagline: "Online collaborative spreadsheet",
    description:
      "Google Sheets is a free, web-based spreadsheet application that enables real-time collaboration, data analysis, and integration with other Google services.",
    url: "https://sheets.google.com",
    iconUrl: "https://www.google.com/favicon.ico",
    category: "data-analytics",
    pricing: "FREE",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Spreadsheet", "Collaboration"],
  },
  {
    name: "Supabase Dashboard",
    tagline: "Open-source Firebase alternative dashboard",
    description:
      "Supabase provides an instant Postgres database with a beautiful dashboard, offering real-time subscriptions, authentication, storage, and edge functions.",
    url: "https://supabase.com/dashboard",
    iconUrl: "https://supabase.com/favicon.ico",
    category: "data-analytics",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    github: "https://github.com/supabase/supabase",
    isOpenSource: true,
    tags: ["Database", "Dashboard", "Open Source"],
  },
  {
    name: "Observable",
    tagline: "Collaborative data visualization notebooks",
    description:
      "Observable is a platform for collaborative data analysis and visualization using reactive JavaScript notebooks, with built-in D3 and Plot support.",
    url: "https://observablehq.com",
    iconUrl: "https://observablehq.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://observablehq.com",
    embedConfig: IFRAME_CONFIG,
    category: "data-analytics",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Analytics", "Dashboard", "Collaboration"],
  },
  {
    name: "Grafana",
    tagline: "Open-source observability and dashboards",
    description:
      "Grafana is an open-source platform for monitoring and observability, allowing you to query, visualize, alert on, and explore metrics from any data source.",
    url: "https://grafana.com",
    iconUrl: "https://grafana.com/favicon.ico",
    category: "data-analytics",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/grafana/grafana",
    isOpenSource: true,
    tags: ["Dashboard", "Analytics", "Open Source"],
  },
  {
    name: "Tableau Public",
    tagline: "Free data visualization platform",
    description:
      "Tableau Public is a free platform to create, explore, and share interactive data visualizations and dashboards on the web.",
    url: "https://public.tableau.com",
    iconUrl: "https://public.tableau.com/favicon.ico",
    category: "data-analytics",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Dashboard", "Analytics"],
  },
  {
    name: "Apache Superset",
    tagline: "Open-source data exploration platform",
    description:
      "Apache Superset is a modern, open-source data exploration and visualization platform designed to be visual, intuitive, and interactive.",
    url: "https://superset.apache.org",
    iconUrl: "https://superset.apache.org/favicon.ico",
    category: "data-analytics",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/apache/superset",
    isOpenSource: true,
    tags: ["Dashboard", "Analytics", "Open Source"],
  },
  {
    name: "Baserow",
    tagline: "Open-source no-code database",
    description:
      "Baserow is an open-source online database tool. Create your own database without technical experience, like Airtable but self-hostable.",
    url: "https://baserow.io",
    iconUrl: "https://baserow.io/favicon.ico",
    category: "data-analytics",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/bram2w/baserow",
    isOpenSource: true,
    tags: ["Database", "No-Code", "Open Source"],
  },

  // ===== Productivity =====
  {
    name: "Todoist",
    tagline: "Task management and to-do lists",
    description:
      "Todoist is a popular task management app that helps individuals and teams organize, plan, and collaborate on projects with a clean, intuitive interface.",
    url: "https://todoist.com",
    iconUrl: "https://todoist.com/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "Linux", "iOS", "Android"],
    tags: ["Task Management"],
  },
  {
    name: "Linear",
    tagline: "Streamlined issue tracking for teams",
    description:
      "Linear is a modern project management tool built for high-performance software teams, with a focus on speed, keyboard shortcuts, and clean design.",
    url: "https://linear.app",
    iconUrl: "https://linear.app/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "iOS"],
    featured: true,
    tags: ["Task Management", "Collaboration"],
  },
  {
    name: "Calendly",
    tagline: "Easy scheduling and appointment booking",
    description:
      "Calendly is a scheduling automation platform that eliminates the back-and-forth of meeting scheduling by letting invitees pick from your available times.",
    url: "https://calendly.com",
    iconUrl: "https://calendly.com/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "iOS", "Android"],
    tags: ["Calendar"],
  },
  {
    name: "Slack",
    tagline: "Business communication platform",
    description:
      "Slack is a channel-based messaging platform for teams that brings communication, tools, and files together in one place for productive collaboration.",
    url: "https://slack.com",
    iconUrl: "https://slack.com/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "Linux", "iOS", "Android"],
    tags: ["Collaboration"],
  },
  {
    name: "Notion Calendar",
    tagline: "Calendar integrated with your workspace",
    description:
      "Notion Calendar (formerly Cron) is a modern calendar app that integrates seamlessly with Notion, providing a unified view of your schedule and tasks.",
    url: "https://www.notion.so/product/calendar",
    iconUrl: "https://www.notion.so/favicon.ico",
    category: "productivity",
    pricing: "FREE",
    platforms: ["Web", "macOS", "iOS"],
    tags: ["Calendar", "Task Management"],
  },
  {
    name: "Raycast",
    tagline: "Supercharged productivity launcher for macOS",
    description:
      "Raycast is a blazingly fast, extendable launcher for macOS that lets you control tools, search docs, run scripts, and manage tasks without leaving the keyboard.",
    url: "https://www.raycast.com",
    iconUrl: "https://www.raycast.com/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["macOS"],
    tags: ["Task Management", "Automation"],
  },
  {
    name: "Arc Browser",
    tagline: "The browser built for the internet age",
    description:
      "Arc is a Chromium-based web browser with a reimagined UI featuring spaces, profiles, split views, and AI-powered features for a cleaner browsing experience.",
    url: "https://arc.net",
    iconUrl: "https://arc.net/favicon.ico",
    category: "productivity",
    pricing: "FREE",
    platforms: ["macOS", "Windows", "iOS"],
    tags: ["Collaboration"],
  },
  {
    name: "Miro",
    tagline: "Online collaborative whiteboard platform",
    description:
      "Miro is an online collaborative whiteboard platform enabling distributed teams to brainstorm, plan, design, and manage workflows visually.",
    url: "https://miro.com",
    iconUrl: "https://miro.com/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://miro.com",
    embedConfig: IFRAME_CONFIG,
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    tags: ["Collaboration", "Design"],
  },
  {
    name: "Trello",
    tagline: "Visual project management with boards",
    description:
      "Trello is a visual project management tool using boards, lists, and cards to help teams organize tasks, track progress, and collaborate on projects.",
    url: "https://trello.com",
    iconUrl: "https://trello.com/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    tags: ["Task Management", "Collaboration"],
  },
  {
    name: "Asana",
    tagline: "Work management for teams",
    description:
      "Asana is a work management platform that helps teams orchestrate their work, from daily tasks to strategic initiatives, with clarity and accountability.",
    url: "https://asana.com",
    iconUrl: "https://asana.com/favicon.ico",
    category: "productivity",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "iOS", "Android"],
    tags: ["Task Management", "Collaboration"],
  },
  {
    name: "Yap",
    tagline: "On-device dictation that types speech into the app you are using",
    description:
      "Yap is a dictation app that types speech at the text cursor in the app you are using. Public pages document Apple Silicon Macs (M1 and later, with no Intel build), Windows 10 and 11 including a native Arm build, and iPhone and Android. The Windows and Android pages say recognition uses NVIDIA's Parakeet model on the device; the Mac pages say recognition runs on the Mac and audio is not uploaded. The provider lists 25 languages and detects the spoken language for each recording. A free account includes 3 days without a card, then a 10-day trial that requires a card, then USD 6.90 per month or USD 69 per year. The first launch, activation, and periodic access checks need an internet connection, and offline use stays within the current access period. Reviewed from public documentation on 2026-11-01; this is not a hands-on accuracy test.",
    url: "https://yapapp.cc/",
    category: "productivity",
    pricing: "PAID",
    platforms: ["macOS", "Windows", "iOS", "Android"],
    isOpenSource: false,
    tags: ["AI", "Writing", "Audio"],
  },

  // ===== API & Integration =====
  {
    name: "Postman",
    tagline: "API development and testing platform",
    description:
      "Postman is the leading API development platform used by millions of developers to build, test, document, and monitor APIs with collaborative tools.",
    url: "https://www.postman.com",
    iconUrl: "https://www.postman.com/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "Linux"],
    featured: true,
    tags: ["API Client", "Collaboration"],
  },
  {
    name: "Insomnia",
    tagline: "Open-source API client and design",
    description:
      "Insomnia is an open-source, cross-platform HTTP and GraphQL client for designing, debugging, and testing APIs with environment management and plugin support.",
    url: "https://insomnia.rest",
    iconUrl: "https://insomnia.rest/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["macOS", "Windows", "Linux"],
    github: "https://github.com/Kong/insomnia",
    isOpenSource: true,
    tags: ["API Client", "Open Source"],
  },
  {
    name: "Zapier",
    tagline: "Automate workflows between apps",
    description:
      "Zapier connects 6,000+ apps to automate workflows without code. Create Zaps that trigger actions across tools like Gmail, Slack, Salesforce, and more.",
    url: "https://zapier.com",
    iconUrl: "https://zapier.com/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Automation", "No-Code"],
  },
  {
    name: "Make",
    tagline: "Visual automation platform",
    description:
      "Make (formerly Integromat) is a visual automation platform that connects apps and automates workflows with a powerful drag-and-drop scenario builder.",
    url: "https://www.make.com",
    iconUrl: "https://www.make.com/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Automation", "No-Code"],
  },
  {
    name: "n8n",
    tagline: "Open-source workflow automation",
    description:
      "n8n is a fair-code workflow automation tool that lets you connect any app with a visual editor, supporting 200+ integrations and custom code nodes.",
    url: "https://n8n.io",
    iconUrl: "https://n8n.io/favicon.ico",
    category: "api-integration",
    pricing: "OPEN_SOURCE",
    platforms: ["Web"],
    github: "https://github.com/n8n-io/n8n",
    isOpenSource: true,
    featured: true,
    tags: ["Automation", "Open Source"],
  },
  {
    name: "Swagger Editor",
    tagline: "Design and document APIs with OpenAPI",
    description:
      "Swagger Editor is a browser-based editor for designing, describing, and documenting RESTful APIs using the OpenAPI Specification.",
    url: "https://editor.swagger.io",
    iconUrl: "https://swagger.io/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://editor.swagger.io",
    embedConfig: IFRAME_CONFIG,
    category: "api-integration",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/swagger-api/swagger-editor",
    isOpenSource: true,
    tags: ["API Client", "Open Source"],
  },
  {
    name: "RapidAPI",
    tagline: "API marketplace and management",
    description:
      "RapidAPI is the world's largest API marketplace, connecting developers to thousands of APIs and providing tools to manage, test, and monitor API usage.",
    url: "https://rapidapi.com",
    iconUrl: "https://rapidapi.com/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["API Client"],
  },
  {
    name: "Webhook.site",
    tagline: "Inspect and debug webhooks",
    description:
      "Webhook.site lets you instantly inspect, test, and debug webhooks and HTTP requests by generating a unique URL that captures all incoming payloads.",
    url: "https://webhook.site",
    iconUrl: "https://webhook.site/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://webhook.site",
    embedConfig: IFRAME_CONFIG,
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["API Client"],
  },
  {
    name: "Pipedream",
    tagline: "Serverless integration and automation",
    description:
      "Pipedream is a serverless integration and compute platform that lets you build workflows connecting APIs with code-level control and instant deployment.",
    url: "https://pipedream.com",
    iconUrl: "https://pipedream.com/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Automation", "Serverless"],
  },
  {
    name: "HTTPie",
    tagline: "User-friendly HTTP client for the API era",
    description:
      "HTTPie is a command-line and web-based HTTP client that makes interacting with APIs as human-friendly as possible, with expressive syntax and JSON support built in.",
    url: "https://httpie.io",
    iconUrl: "https://httpie.io/favicon.ico",
    category: "api-integration",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "Linux"],
    github: "https://github.com/httpie/cli",
    isOpenSource: true,
    tags: ["API Client", "Open Source"],
  },

  // ===== Deploy & Hosting =====
  {
    name: "Vercel",
    tagline: "Frontend cloud and deployment platform",
    description:
      "Vercel is the platform for frontend developers, providing the speed and reliability to build, preview, and deploy web applications with zero configuration.",
    url: "https://vercel.com",
    iconUrl: "https://vercel.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    featured: true,
    tags: ["Hosting", "Serverless", "DevOps"],
  },
  {
    name: "Netlify",
    tagline: "Web development and deployment platform",
    description:
      "Netlify is a web development platform that combines serverless functions, edge networking, and CI/CD for building and deploying modern web projects.",
    url: "https://www.netlify.com",
    iconUrl: "https://www.netlify.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Hosting", "Serverless", "DevOps"],
  },
  {
    name: "Railway",
    tagline: "Instant deployment infrastructure",
    description:
      "Railway is a deployment platform that makes it easy to provision infrastructure, develop locally, and deploy to the cloud with minimal configuration.",
    url: "https://railway.app",
    iconUrl: "https://railway.app/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Hosting", "DevOps"],
  },
  {
    name: "Render",
    tagline: "Cloud hosting for apps and databases",
    description:
      "Render is a unified cloud platform to build and run apps and websites with free TLS certificates, global CDN, DDoS protection, and private networks.",
    url: "https://render.com",
    iconUrl: "https://render.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Hosting", "DevOps"],
  },
  {
    name: "Fly.io",
    tagline: "Run apps close to your users",
    description:
      "Fly.io transforms containers into micro-VMs that run on hardware around the world, letting you deploy full-stack apps close to your users.",
    url: "https://fly.io",
    iconUrl: "https://fly.io/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Hosting", "DevOps", "Serverless"],
  },
  {
    name: "Cloudflare Pages",
    tagline: "JAMstack deployment with global CDN",
    description:
      "Cloudflare Pages is a JAMstack platform for frontend developers to collaborate and deploy websites, powered by Cloudflare's global edge network.",
    url: "https://pages.cloudflare.com",
    iconUrl: "https://pages.cloudflare.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Hosting", "Serverless"],
  },
  {
    name: "DigitalOcean",
    tagline: "Cloud infrastructure for developers",
    description:
      "DigitalOcean provides cloud infrastructure services including droplets, managed databases, Kubernetes, and app platform for developers and businesses.",
    url: "https://www.digitalocean.com",
    iconUrl: "https://www.digitalocean.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "PAID",
    platforms: ["Web"],
    tags: ["Hosting", "DevOps"],
  },
  {
    name: "AWS Amplify",
    tagline: "Full-stack AWS cloud development",
    description:
      "AWS Amplify is a set of tools and services for building full-stack applications powered by AWS, with hosting, CI/CD, authentication, and storage built in.",
    url: "https://aws.amazon.com/amplify",
    iconUrl: "https://aws.amazon.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Hosting", "Serverless"],
  },
  {
    name: "Supabase",
    tagline: "Open-source Firebase alternative",
    description:
      "Supabase is an open-source Firebase alternative providing a Postgres database, authentication, instant APIs, edge functions, realtime subscriptions, and storage.",
    url: "https://supabase.com",
    iconUrl: "https://supabase.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    github: "https://github.com/supabase/supabase",
    isOpenSource: true,
    tags: ["Database", "Hosting", "Open Source"],
  },
  {
    name: "PlanetScale",
    tagline: "Serverless MySQL database platform",
    description:
      "PlanetScale is a serverless MySQL-compatible database platform powered by Vitess, offering branching, deploy requests, and non-blocking schema changes.",
    url: "https://planetscale.com",
    iconUrl: "https://planetscale.com/favicon.ico",
    category: "deploy-hosting",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Database", "Serverless"],
  },

  // ===== Security & Privacy =====
  {
    name: "1Password",
    tagline: "Password manager for teams and families",
    description:
      "1Password is a secure password manager that stores passwords, credit cards, and sensitive data behind one master password with end-to-end encryption.",
    url: "https://1password.com",
    iconUrl: "https://1password.com/favicon.ico",
    category: "security-privacy",
    pricing: "PAID",
    platforms: ["Web", "macOS", "Windows", "Linux", "iOS", "Android"],
    tags: ["Password Manager", "Security"],
  },
  {
    name: "Bitwarden",
    tagline: "Open-source password manager",
    description:
      "Bitwarden is an open-source password manager that stores all your passwords in an encrypted vault you can access from any device, anywhere.",
    url: "https://bitwarden.com",
    iconUrl: "https://bitwarden.com/favicon.ico",
    category: "security-privacy",
    pricing: "FREEMIUM",
    platforms: ["Web", "macOS", "Windows", "Linux", "iOS", "Android"],
    github: "https://github.com/bitwarden",
    isOpenSource: true,
    tags: ["Password Manager", "Security", "Open Source"],
  },
  {
    name: "Have I Been Pwned",
    tagline: "Check if your data has been breached",
    description:
      "Have I Been Pwned is a free resource for checking if your email or phone has been compromised in a data breach, created by security researcher Troy Hunt.",
    url: "https://haveibeenpwned.com",
    iconUrl: "https://haveibeenpwned.com/favicon.ico",
    category: "security-privacy",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Security"],
  },
  {
    name: "VirusTotal",
    tagline: "Analyze files and URLs for malware",
    description:
      "VirusTotal inspects files, domains, IPs, and URLs with 70+ antivirus scanners and URL/domain blocklisting services to detect malware and other threats.",
    url: "https://www.virustotal.com",
    iconUrl: "https://www.virustotal.com/favicon.ico",
    category: "security-privacy",
    pricing: "FREE",
    platforms: ["Web"],
    tags: ["Security"],
  },
  {
    name: "CyberChef",
    tagline: "The Cyber Swiss Army Knife",
    description:
      "CyberChef is a web app by GCHQ for encryption, encoding, compression, and data analysis. Chain together operations to decode, encrypt, and transform data.",
    url: "https://gchq.github.io/CyberChef",
    iconUrl: "https://gchq.github.io/CyberChef/favicon.ico",
    embedMode: "IFRAME",
    embedUrl: "https://gchq.github.io/CyberChef",
    embedConfig: IFRAME_CONFIG,
    category: "security-privacy",
    pricing: "FREE",
    platforms: ["Web"],
    github: "https://github.com/gchq/CyberChef",
    isOpenSource: true,
    tags: ["Security", "Open Source"],
  },
  {
    name: "Let's Encrypt",
    tagline: "Free SSL/TLS certificates",
    description:
      "Let's Encrypt is a free, automated, and open certificate authority that provides SSL/TLS certificates to enable HTTPS on websites worldwide.",
    url: "https://letsencrypt.org",
    iconUrl: "https://letsencrypt.org/favicon.ico",
    category: "security-privacy",
    pricing: "FREE",
    platforms: ["Web"],
    isOpenSource: true,
    tags: ["Security", "Open Source"],
  },
  {
    name: "Cloudflare",
    tagline: "Web security and performance",
    description:
      "Cloudflare provides CDN, DDoS protection, DNS management, and web security services that help protect and accelerate websites and applications.",
    url: "https://www.cloudflare.com",
    iconUrl: "https://www.cloudflare.com/favicon.ico",
    category: "security-privacy",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Security", "Hosting"],
  },
  {
    name: "Auth0",
    tagline: "Identity and access management",
    description:
      "Auth0 is an identity platform that provides authentication and authorization services, letting developers implement secure login flows with minimal code.",
    url: "https://auth0.com",
    iconUrl: "https://auth0.com/favicon.ico",
    category: "security-privacy",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Security", "API Client"],
  },
  {
    name: "Snyk",
    tagline: "Developer security for code and dependencies",
    description:
      "Snyk is a developer-first security platform that finds and automatically fixes vulnerabilities in your code, open-source dependencies, containers, and IaC.",
    url: "https://snyk.io",
    iconUrl: "https://snyk.io/favicon.ico",
    category: "security-privacy",
    pricing: "FREEMIUM",
    platforms: ["Web"],
    tags: ["Security", "DevOps"],
  },
  {
    name: "OWASP ZAP",
    tagline: "Open-source web application security scanner",
    description:
      "OWASP ZAP (Zed Attack Proxy) is one of the world's most popular free security tools for finding vulnerabilities in web applications during development and testing.",
    url: "https://www.zaproxy.org",
    iconUrl: "https://www.zaproxy.org/favicon.ico",
    category: "security-privacy",
    pricing: "OPEN_SOURCE",
    platforms: ["macOS", "Windows", "Linux"],
    github: "https://github.com/zaproxy/zaproxy",
    isOpenSource: true,
    tags: ["Security", "Open Source"],
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  publication.prepare();
  console.log("Seeding database...\n");

  // 1. Upsert categories
  console.log("Upserting categories...");
  const categoryMap = new Map<string, string>(); // slug -> id
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
    publication.markChanged();
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`  ${categories.length} categories upserted.\n`);

  // 2. Upsert tags
  console.log("Upserting tags...");
  const tagMap = new Map<string, string>(); // name -> id
  for (const tagName of tags) {
    const tagSlug = slug(tagName);
    const record = await prisma.tag.upsert({
      where: { slug: tagSlug },
      update: { name: tagName },
      create: { name: tagName, slug: tagSlug },
    });
    tagMap.set(tagName, record.id);
  }
  console.log(`  ${tags.length} tags upserted.\n`);

  // 3. Upsert tools with their tag associations
  console.log("Upserting tools...");
  let toolCount = 0;
  for (const tool of tools) {
    const toolSlug = slug(tool.name);
    const categoryId = categoryMap.get(tool.category);
    if (!categoryId) {
      console.warn(`  WARNING: Category "${tool.category}" not found for tool "${tool.name}". Skipping.`);
      continue;
    }

    // Resolve tag IDs
    const toolTagIds: string[] = [];
    for (const tagName of tool.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        toolTagIds.push(tagId);
      } else {
        console.warn(`  WARNING: Tag "${tagName}" not found for tool "${tool.name}".`);
      }
    }

    const record = await prisma.tool.upsert({
      where: { slug: toolSlug },
      update: {
        name: tool.name,
        tagline: tool.tagline,
        description: tool.description,
        url: tool.url,
        iconUrl: tool.iconUrl ?? null,
        screenshotUrl: tool.screenshotUrl ?? null,
        embedMode: tool.embedMode ?? "EXTERNAL",
        embedUrl: tool.embedUrl ?? null,
        embedConfig: (tool.embedConfig as Record<string, string>) ?? undefined,
        categoryId,
        pricing: tool.pricing,
        platforms: tool.platforms,
        github: tool.github ?? null,
        isOpenSource: tool.isOpenSource ?? false,
        status: "APPROVED",
        featured: tool.featured ?? false,
      },
      create: {
        name: tool.name,
        slug: toolSlug,
        tagline: tool.tagline,
        description: tool.description,
        url: tool.url,
        iconUrl: tool.iconUrl ?? null,
        screenshotUrl: tool.screenshotUrl ?? null,
        embedMode: tool.embedMode ?? "EXTERNAL",
        embedUrl: tool.embedUrl ?? null,
        embedConfig: (tool.embedConfig as Record<string, string>) ?? undefined,
        categoryId,
        pricing: tool.pricing,
        platforms: tool.platforms,
        github: tool.github ?? null,
        isOpenSource: tool.isOpenSource ?? false,
        status: "APPROVED",
        featured: tool.featured ?? false,
      },
    });

    // Remove existing tag associations and recreate them
    await prisma.toolTag.deleteMany({ where: { toolId: record.id } });
    for (const tagId of toolTagIds) {
      await prisma.toolTag.create({
        data: { toolId: record.id, tagId },
      });
    }

    toolCount++;
  }
  console.log(`  ${toolCount} tools upserted.\n`);

  // Summary
  const featuredCount = tools.filter((t) => t.featured).length;
  const iframeCount = tools.filter((t) => t.embedMode === "IFRAME").length;
  console.log("Seed complete!");
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Tags:       ${tags.length}`);
  console.log(`  Tools:      ${toolCount}`);
  console.log(`  Featured:   ${featuredCount}`);
  console.log(`  Embeddable: ${iframeCount} (IFRAME)`);
}

runWithPublication(main, () => publication, () => prisma.$disconnect())
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Seed failed");
    process.exitCode = 1;
  });
