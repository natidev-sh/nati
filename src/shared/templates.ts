export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  isOfficial: boolean;
  isExperimental?: boolean;
  requiresNeon?: boolean;
}

// API Template interface from the external API
export interface ApiTemplate {
  githubOrg: string;
  githubRepo: string;
  title: string;
  description: string;
  imageUrl: string;
}

export const DEFAULT_TEMPLATE_ID = "react";
export const DEFAULT_TEMPLATE = {
  id: "react",
  title: "React.js Template",
  description: "Uses React.js, Vite, Shadcn, Tailwind and TypeScript.",
  imageUrl:
    "https://github.com/natidev-sh/nextjs-template/blob/main/screenshots/next-thumbnail.png?raw=true",
  isOfficial: true,
};

const PORTAL_MINI_STORE_ID = "portal-mini-store";
export const NEON_TEMPLATE_IDS = new Set<string>([PORTAL_MINI_STORE_ID]);

export const localTemplatesData: Template[] = [
  DEFAULT_TEMPLATE,
  {
    id: "next",
    title: "Next.js Template",
    description: "Uses Next.js, React.js, Shadcn, Tailwind and TypeScript.",
    imageUrl:
      "https://github.com/user-attachments/assets/96258e4f-abce-4910-a62a-a9dff77965f2",
    githubUrl: "https://github.com/natidev-sh/nextjs-template",
    isOfficial: true,
  },
  {
    id: "vue",
    title: "Vue.js Template",
    description: "Uses Vue 3, Vite, Pinia, Vue Router and TypeScript.",
    imageUrl:
      "https://raw.githubusercontent.com/natidev-sh/nati/main/assets/templates/vue-template-cover.png",
    githubUrl: "https://github.com/natidev-sh/nati-vuejs-template",
    isOfficial: true,
  },
];
