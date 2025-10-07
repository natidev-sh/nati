import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  appBasePathAtom,
  appsListAtom,
  selectedAppIdAtom,
} from "@/atoms/appAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, MessageCircle, Pencil, Folder, Trash2, Copy, Calendar, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitHubConnector } from "@/components/GitHubConnector";
import { SupabaseConnector } from "@/components/SupabaseConnector";
import { SupabaseDbBrowser } from "@/components/SupabaseDbBrowser";
import { showError, showSuccess } from "@/lib/toast";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { invalidateAppQuery } from "@/hooks/useLoadApp";
import { useDebounce } from "@/hooks/useDebounce";
import { useCheckName } from "@/hooks/useCheckName";
import { AppUpgrades } from "@/components/AppUpgrades";
import { CapacitorControls } from "@/components/CapacitorControls";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function AppDetailsPage() {
  // Asset: NATIDB logo for DB Browser button
  const natiDbLogo = new URL('../../assets/icon/NATIDB.png', import.meta.url).href;
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ from: "/app-details" as const });
  const [appsList] = useAtom(appsListAtom);
  const { refreshApps } = useLoadApps();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isRenameConfirmDialogOpen, setIsRenameConfirmDialogOpen] =
    useState(false);
  const [renameFolderAlso, setRenameFolderAlso] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRenameFolderDialogOpen, setIsRenameFolderDialogOpen] =
    useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const appBasePath = useAtomValue(appBasePathAtom);

  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [newCopyAppName, setNewCopyAppName] = useState("");
  const [isDbBrowserOpen, setIsDbBrowserOpen] = useState(false);

  // When navigated from AppList with a contextual action, open the dialog
  useEffect(() => {
    if (!search) return;
    const action = (search as any).action as string | undefined;
    if (!action) return;
    if (action === "rename") {
      setIsRenameDialogOpen(true);
    } else if (action === "delete") {
      setIsDeleteDialogOpen(true);
    } else if (action === "db-browser") {
      setIsDbBrowserOpen(true);
    }
    // Clean the URL (remove action) without navigation flicker
    navigate({ to: "/app-details", search: { appId: (search as any).appId }, replace: true });
  }, [search]);

  

  const queryClient = useQueryClient();
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);

  const debouncedNewCopyAppName = useDebounce(newCopyAppName, 150);
  const { data: checkNameResult, isLoading: isCheckingName } = useCheckName(
    debouncedNewCopyAppName,
  );
  const nameExists = checkNameResult?.exists ?? false;

  // Get the appId from search params and find the corresponding app
  const appId = search.appId ? Number(search.appId) : null;
  const selectedApp = appId ? appsList.find((app) => app.id === appId) : null;

  // --- Tech Stack detection (inside component) ---
  type TechMeta = { name: string; version?: string | null; source: string; category: "Frontend" | "Backend" | "DB" | "Infra" | "Hosting" | "Tools" };
  const [techStack, setTechStack] = useState<TechMeta[]>([]);
  const getVer = (pkg: any, key: string): string | null => {
    const v = pkg?.dependencies?.[key] ?? pkg?.devDependencies?.[key];
    return typeof v === "string" ? v : null;
  };
  const detectFrameworks = useCallback((pkgJson: any, opts?: { docker?: boolean; integrations?: { github?: boolean; vercel?: boolean; supabase?: boolean; neon?: boolean }, tailwindCfg?: boolean, prismaProvider?: string | null, nodeRuntime?: string | null }): TechMeta[] => {
    const deps = {
      ...(pkgJson?.dependencies || {}),
      ...(pkgJson?.devDependencies || {}),
    } as Record<string, string>;
    const out: TechMeta[] = [];
    // Frontend
    if (deps["next"]) out.push({ name: "Next.js", version: getVer(pkgJson, "next"), source: "dependency:next", category: "Frontend" });
    if (deps["react"]) out.push({ name: "React", version: getVer(pkgJson, "react"), source: "dependency:react", category: "Frontend" });
    if (deps["astro"]) out.push({ name: "Astro", version: getVer(pkgJson, "astro"), source: "dependency:astro", category: "Frontend" });
    if (deps["@sveltejs/kit"]) out.push({ name: "SvelteKit", version: getVer(pkgJson, "@sveltejs/kit"), source: "dependency:@sveltejs/kit", category: "Frontend" });
    if (deps["remix"]) out.push({ name: "Remix", version: getVer(pkgJson, "remix"), source: "dependency:remix", category: "Frontend" });
    if (deps["vite"]) out.push({ name: "Vite", version: getVer(pkgJson, "vite"), source: "dependency:vite", category: "Frontend" });
    if (deps["tailwindcss"]) out.push({ name: "Tailwind", version: getVer(pkgJson, "tailwindcss"), source: "dependency:tailwindcss", category: "Frontend" });
    // Tools
    if (deps["typescript"]) out.push({ name: "TypeScript", version: getVer(pkgJson, "typescript"), source: "dependency:typescript", category: "Tools" });
    if (deps["eslint"]) out.push({ name: "ESLint", version: getVer(pkgJson, "eslint"), source: "dependency:eslint", category: "Tools" });
    if (deps["prettier"]) out.push({ name: "Prettier", version: getVer(pkgJson, "prettier"), source: "dependency:prettier", category: "Tools" });
    if (deps["jest"] || Object.keys(deps).some((k) => k.startsWith("@jest/"))) out.push({ name: "Jest", version: getVer(pkgJson, "jest"), source: "dependency:jest", category: "Tools" });
    if (deps["vitest"]) out.push({ name: "Vitest", version: getVer(pkgJson, "vitest"), source: "dependency:vitest", category: "Tools" });
    if (deps["@playwright/test"]) out.push({ name: "Playwright", version: getVer(pkgJson, "@playwright/test"), source: "dependency:@playwright/test", category: "Tools" });
    if (deps["cypress"]) out.push({ name: "Cypress", version: getVer(pkgJson, "cypress"), source: "dependency:cypress", category: "Tools" });
    // Backend
    if (deps["express"]) out.push({ name: "Express", version: getVer(pkgJson, "express"), source: "dependency:express", category: "Backend" });
    if (deps["@prisma/client"] || deps["prisma"]) out.push({ name: "Prisma", version: getVer(pkgJson, "@prisma/client") ?? getVer(pkgJson, "prisma"), source: deps["@prisma/client"] ? "dependency:@prisma/client" : "dependency:prisma", category: "Backend" });
    // DB
    if (deps["pg"]) out.push({ name: "PostgreSQL", version: getVer(pkgJson, "pg"), source: "dependency:pg", category: "DB" });
    if (opts?.prismaProvider) out.push({ name: `Prisma(${opts.prismaProvider})`, version: getVer(pkgJson, "@prisma/client") ?? getVer(pkgJson, "prisma"), source: "file:schema.prisma", category: "DB" });
    // Infra
    if (opts?.docker) out.push({ name: "Docker", version: null, source: opts.docker ? "file:Dockerfile|docker-compose.yml" : "", category: "Infra" });
    if (opts?.nodeRuntime) out.push({ name: "Node.js", version: opts.nodeRuntime, source: "package.json:engines.node", category: "Infra" });
    if (opts?.tailwindCfg) out.push({ name: "Tailwind", version: getVer(pkgJson, "tailwindcss"), source: "file:tailwind.config.*", category: "Frontend" });
    // Hosting / integrations
    if (opts?.integrations?.vercel) out.push({ name: "Vercel", version: null, source: "integration:Vercel", category: "Hosting" });
    if (opts?.integrations?.supabase) out.push({ name: "Supabase", version: null, source: "integration:Supabase", category: "DB" });
    if (opts?.integrations?.neon) out.push({ name: "Neon", version: null, source: "integration:Neon", category: "DB" });
    if (opts?.integrations?.github) out.push({ name: "GitHub", version: null, source: "integration:GitHub", category: "Tools" });
    // Deduplicate by name keeping first occurrence with version
    const seen = new Set<string>();
    return out.filter((t) => (seen.has(t.name) ? false : (seen.add(t.name), true)));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!appId) return;
        const client = IpcClient.getInstance();
        const pkgStr = await client.readAppFile(appId, "package.json");
        const pkg = JSON.parse(pkgStr);
        let docker = false;
        try {
          const df = await client.readAppFile(appId, "Dockerfile");
          docker = !!df?.length;
        } catch {}
        if (!docker) {
          try {
            const dc = await client.readAppFile(appId, "docker-compose.yml");
            docker = !!dc?.length;
          } catch {}
        }
        // Tailwind config presence
        let tailwindCfg = false;
        const tryRead = async (file: string) => {
          try { const c = await client.readAppFile(appId, file); return !!c?.length; } catch { return false; }
        };
        tailwindCfg = await tryRead("tailwind.config.js") || await tryRead("tailwind.config.cjs") || await tryRead("tailwind.config.ts");

        // Prisma provider from schema.prisma
        let prismaProvider: string | null = null;
        try {
          const schema = await client.readAppFile(appId, "prisma/schema.prisma");
          const m = schema.match(/provider\s*=\s*"([^"]+)"/);
          if (m) prismaProvider = m[1];
        } catch {}

        // Node runtime from engines
        const nodeRuntime: string | null = typeof pkg?.engines?.node === 'string' ? pkg.engines.node : null;

        const integrations = {
          github: Boolean((selectedApp as any)?.githubRepo),
          vercel: Boolean((selectedApp as any)?.vercelProjectName),
          supabase: Boolean((selectedApp as any)?.supabaseProjectName || (selectedApp as any)?.supabaseProjectId),
          neon: Boolean((selectedApp as any)?.neonProjectId),
        };
        setTechStack(detectFrameworks(pkg, { docker, integrations, tailwindCfg, prismaProvider, nodeRuntime }));
      } catch {
        setTechStack([]);
      }
    })();
  }, [appId, detectFrameworks, selectedApp]);

  // Group techs by category for display
  const grouped = useMemo(() => {
    const cat: Record<string, TechMeta[]> = { Frontend: [], Backend: [], DB: [], Infra: [], Hosting: [], Tools: [] };
    for (const t of techStack) {
      (cat[t.category] ||= []).push(t);
    }
    return cat;
  }, [techStack]);

  // Brand icons (inline SVG to avoid external assets)
  const BrandIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
    switch (name) {
      case "React":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <g fill="none" stroke="#61DAFB" strokeWidth="1.5">
              <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-60 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" />
              <circle cx="12" cy="12" r="2" fill="#61DAFB" stroke="none" />
            </g>
          </svg>
        );
      case "Next.js":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.21 0 4.25-.72 5.9-1.94L9 8v8h2v-4.59l6.49 6.49A9.96 9.96 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
          </svg>
        );
      case "Vite":
        return (
          <svg viewBox="0 0 256 257" className={className} aria-hidden>
            <defs>
              <linearGradient id="VITE_A" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%">
                <stop stopColor="#41D1FF" offset="0%" />
                <stop stopColor="#BD34FE" offset="100%" />
              </linearGradient>
              <linearGradient id="VITE_B" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%">
                <stop stopColor="#FFEA83" offset="0%" />
                <stop stopColor="#FFDD35" offset="8.333%" />
                <stop stopColor="#FFA800" offset="100%" />
              </linearGradient>
            </defs>
            <path fill="url(#VITE_A)" d="M255.153 37.938L134.897 252.976c-2.483 4.468-8.883 4.466-11.364-.004L.875 37.94c-2.79-5.017 1.64-11.02 7.21-9.86l119.08 24.622a6.5 6.5 0 0 0 2.53-.001l118.237-24.615c5.563-1.159 9.997 4.826 7.216 9.85Z"/>
            <path fill="url(#VITE_B)" d="M185.432.063L96.44 17.86a3.25 3.25 0 0 0-2.61 3.346l4.36 74.27a3.25 3.25 0 0 0 4.58 2.71l24.55-12.02c1.98-.97 4.34-.09 5.24 1.9l27.2 58.68c1.1 2.37 4.5 2.2 5.32-.25l38.64-117.24c.86-2.6-1.52-5.17-4.23-4.61l-27.54 5.6a3.25 3.25 0 0 1-3.82-3.78l5.7-22.39c.66-2.59-1.67-4.96-4.3-4.44Z"/>
          </svg>
        );
      case "Astro":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#FF5D01" d="M163.6 179.7c-14.9 8.5-29.9 10.3-44.8 5.4-9.1-3-17.2-8.1-24.3-15.2-1.3-1.3-.6-3.5 1.3-3.8 8.7-1.9 21.3 0 37.8 5.6 22 7.4 36.8 9.4 44.3 5.9 1.6-.7 3.2 1.2 1.9 2.1-4.9 3.4-10.7 6.7-16.2 10z"/>
            <path fill="#000" d="M129.6 36.7c-1.8 0-3.4 1.2-3.9 2.9l-38.4 118.5c-.7 2.3 1.7 4.3 3.8 3.2a152 152 0 0 1 73-16.2 152 152 0 0 1 73 16.2c2.1 1.1 4.5-.9 3.8-3.2L202.5 39.6a4 4 0 0 0-3.9-2.9h-69z"/>
          </svg>
        );
      case "SvelteKit":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#FF3E00" d="M128 28c-28 0-43 8-55 19a44 44 0 0 0-9 53l1 2 25-14-1-2a16 16 0 0 1 3-19c7-7 18-11 36-11s29 4 36 11a16 16 0 0 1-3 25l-60 35c-26 15-31 43-15 63 9 11 25 19 55 19s46-8 55-19a44 44 0 0 0 9-53l-1-2-25 14 1 2a16 16 0 0 1-3 19c-7 7-18 11-36 11s-29-4-36-11a16 16 0 0 1 3-25l60-35c26-15 31-43 15-63-9-11-25-19-55-19Z"/>
          </svg>
        );
      case "Remix":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#000" d="M40 64h176v48H88a16 16 0 0 0 0 32h128v48H144a56 56 0 0 1 0-112h72V64H40z" />
          </svg>
        );
      case "Express":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="92" fontFamily="Arial,Helvetica,sans-serif" fill="currentColor">ex</text>
          </svg>
        );
      case "ESLint":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="#4B32C3" d="M12 2l7.794 4.5v9L12 20 4.206 15.5v-9L12 2z" />
          </svg>
        );
      case "Prettier":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <circle cx="12" cy="12" r="10" fill="#1a2b34" />
            <rect x="7" y="8" width="10" height="2" rx="1" fill="#F7B93E"/>
            <rect x="7" y="12" width="6" height="2" rx="1" fill="#56B6C2"/>
            <rect x="7" y="16" width="8" height="2" rx="1" fill="#A3BE8C"/>
          </svg>
        );
      case "Jest":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="#C21325" d="M19 5l-2 5-2-5 2-2 2 2zM5 13a5 5 0 0010 0H5z" />
          </svg>
        );
      case "Vitest":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="#FFD166" d="M12 2l10 6-10 6L2 8l10-6z"/>
            <path fill="#06D6A0" d="M12 14l10-6v8l-10 6-10-6V8l10 6z"/>
          </svg>
        );
      case "Playwright":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="#5A3E85" d="M12 2l8 4v8l-8 4-8-4V6l8-4z"/>
            <circle cx="9.5" cy="10" r="1.5" fill="#E15E99"/>
            <circle cx="14.5" cy="10" r="1.5" fill="#E15E99"/>
          </svg>
        );
      case "Cypress":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <circle cx="12" cy="12" r="10" fill="#24292e" />
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fill="#fff">cy</text>
          </svg>
        );
      case "Node.js":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#83CD29" d="M128 16l102 59v118l-102 59L26 193V75l102-59z"/>
            <path fill="#fff" d="M168 153c0 17-9 26-28 26-12 0-21-4-28-11l13-15c4 4 9 7 15 7 6 0 9-3 9-9v-47h19v49zm-59-47v73l-19-11v-62h19z"/>
          </svg>
        );
      case "TypeScript":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <rect width="24" height="24" rx="4" fill="#3178C6" />
            <path fill="#fff" d="M10.2 8.5h-5v2h1.9v6h2.1v-6h2v-2Zm3.4 8.3c.7.5 1.6.8 2.7.8 1.2 0 2.1-.3 2.7-.8.7-.5 1-1.1 1-1.8 0-.7-.2-1.2-.7-1.6-.5-.4-1.3-.7-2.4-1l-.7-.2c-.6-.2-.9-.4-.9-.7 0-.5.4-.7 1.1-.7.7 0 1.4.2 2.1.6l.9-1.6a5.4 5.4 0 0 0-2.9-.8c-1.1 0-2 .3-2.6.8-.7.5-1 1.2-1 2 0 .7.2 1.2.7 1.6.4.4 1.2.7 2.3 1l.7.2c.7.2 1 .4 1 .7 0 .5-.5.8-1.4.8-.9 0-1.8-.3-2.6-.8l-1 .6Z" />
          </svg>
        );
      case "Tailwind":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="#38BDF8" d="M12 6c-2.667 0-4.333 1.333-5 4 1-1.333 2.167-1.833 3.5-1.5.761.19 1.302.74 1.958 1.405C13.26 11.27 14.42 12.5 17 12.5c2.667 0 4.333-1.333 5-4-1 1.333-2.167 1.833-3.5 1.5-.761-.19-1.302-.74-1.958-1.405C15.74 7.23 14.58 6 12 6Zm-7 6c-2.667 0-4.333 1.333-5 4 1-1.333 2.167-1.833 3.5-1.5.761.19 1.302.74 1.958 1.405C7.26 17.27 8.42 18.5 11 18.5c2.667 0 4.333-1.333 5-4-1 1.333-2.167 1.833-3.5 1.5-.761-.19-1.302-.74-1.958-1.405C9.74 13.23 8.58 12 6 12Z" />
          </svg>
        );
      case "Prisma":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#2D3748" d="M196 186.6 117.7 21.8a8 8 0 0 0-14.5 0L35 157.3a8 8 0 0 0 4.1 10.5l97.5 44.5a8 8 0 0 0 10.7-3.9l48.7-102.8a8 8 0 1 0-14.5-6.9l-46 97.1-84.2-38.4 61-132.9 73.3 157.4a8 8 0 1 0 14.4-6.9Z" />
          </svg>
        );
      case "PostgreSQL":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#336791" d="M128 24c57.3 0 104 39.8 104 88.9 0 35.2-23.6 65.4-57.1 79.1-3.8 1.6-7.1 4.2-9.2 7.7-5.3 8.8-14.9 20.3-27.7 20.3-28.8 0-20.7-30.9-43.9-30.9-8.4 0-16.6 4.8-24.3 10.6-3.3 2.5-7.9-1-6.3-4.7 4.7-10.8 7.5-21.9 4.3-30.1C55.2 150.4 24 130 24 112.9 24 63.8 70.7 24 128 24Z"/>
            <circle cx="165" cy="105" r="12" fill="#fff"/>
          </svg>
        );
      case "Docker":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#2496ED" d="M240 132c-7-7-17-10-28-8-3-12-11-20-25-23l-7-1-4 6c-8 14-10 31-7 49H32c-3 0-6 3-6 6 4 27 25 48 64 48 62 0 110-27 134-76 6-1 12-2 16-6 4-3 6-7 6-12 0-5-2-9-6-13zM64 92h24v24H64V92zm28 0h24v24H92V92zm28 0h24v24h-24V92zm-56 28h24v24H64v-24zm28 0h24v24H92v-24zm28 0h24v24h-24v-24zm28-28h24v24h-24V92z"/>
          </svg>
        );
      case "GitHub":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.73.08-.73 1.21.09 1.85 1.25 1.85 1.25 1.08 1.85 2.84 1.31 3.53 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.31-1.23 3.31-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.9 1.24 3.22 0 4.62-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5Z"/>
          </svg>
        );
      case "Vercel":
        return (
          <svg viewBox="0 0 24 24" className={className} aria-hidden>
            <path fill="currentColor" d="M12 3l9 16H3l9-16z" />
          </svg>
        );
      case "Supabase":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <path fill="#3ECF8E" d="M168.4 20.1L75 148.3a8 8 0 0 0 6.5 12.7h55.7l-21.6 74.9a8 8 0 0 0 13.8 7.6l93.4-128.2a8 8 0 0 0-6.5-12.7h-55.7l21.6-74.9a8 8 0 0 0-13.8-7.6z"/>
          </svg>
        );
      case "Neon":
        return (
          <svg viewBox="0 0 256 256" className={className} aria-hidden>
            <circle cx="128" cy="128" r="100" fill="#00E1FF" />
            <path d="M88 88h24v80H88zM144 88h24v80h-24z" fill="#0A2540"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const versionBadgeClass = (name: string) => {
    switch (name) {
      case "React": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
      case "Next.js": return "bg-gray-200 text-gray-900 dark:bg-gray-700/50 dark:text-gray-100";
      case "Vite": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "Tailwind": return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
      case "TypeScript": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Prisma":
      case "Prisma(postgresql)": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "PostgreSQL": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      case "ESLint": return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
      case "Prettier": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "Jest": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
      case "Vitest": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Playwright": return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
      case "Cypress": return "bg-neutral-200 text-neutral-800 dark:bg-neutral-700/50 dark:text-neutral-200";
      case "Node.js": return "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300";
      default: return "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/80";
    }
  };

  const TechPill: React.FC<{ name: string; version?: string | null; source?: string }> = ({ name, version, source }) => {
    const toCopy = version ? `${name}@${version}` : name;
    return (
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(toCopy).catch(() => {})}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 text-gray-900 dark:text-gray-100 select-none cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-colors"
        title={[name, version ? ` • ${version}` : "", source ? `\n${source}` : "", "\n(click to copy)"] .join("")}
      >
        <span className="h-3.5 w-3.5 inline-flex">
          <BrandIcon name={name} className="h-full w-full" />
        </span>
        <span className="select-none">{name}</span>
        {version && <span className={`ml-0.5 px-1 rounded ${versionBadgeClass(name)}`}>{version}</span>}
      </button>
    );
  };

  // Keyboard shortcut: Ctrl/Cmd+Shift+D opens DB Browser
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (ctrlOrCmd && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        if (selectedApp?.supabaseProjectId) setIsDbBrowserOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedApp]);

  const handleDeleteApp = async () => {
    if (!appId) return;

    try {
      setIsDeleting(true);
      await IpcClient.getInstance().deleteApp(appId);
      setIsDeleteDialogOpen(false);
      await refreshApps();
      navigate({ to: "/", search: {} });
    } catch (error) {
      setIsDeleteDialogOpen(false);
      showError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenRenameDialog = () => {
    if (selectedApp) {
      setNewAppName(selectedApp.name);
      setIsRenameDialogOpen(true);
    }
  };

  const handleOpenRenameFolderDialog = () => {
    if (selectedApp) {
      setNewFolderName(selectedApp.path.split("/").pop() || selectedApp.path);
      setIsRenameFolderDialogOpen(true);
    }
  };

  const handleRenameApp = async (renameFolder: boolean) => {
    if (!appId || !selectedApp || !newAppName.trim()) return;

    try {
      setIsRenaming(true);

      // Determine the new path based on user's choice
      const appPath = renameFolder ? newAppName : selectedApp.path;

      await IpcClient.getInstance().renameApp({
        appId,
        appName: newAppName,
        appPath,
      });

      setIsRenameDialogOpen(false);
      setIsRenameConfirmDialogOpen(false);
      setRenameFolderAlso(false);
      await refreshApps();
    } catch (error) {
      console.error("Failed to rename app:", error);
      alert(
        `Error renaming app: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameFolderOnly = async () => {
    if (!appId || !selectedApp || !newFolderName.trim()) return;

    try {
      setIsRenamingFolder(true);

      await IpcClient.getInstance().renameApp({
        appId,
        appName: selectedApp.name, // Keep the app name the same
        appPath: newFolderName, // Change only the folder path
      });

      setIsRenameFolderDialogOpen(false);
      await refreshApps();
    } catch (error) {
      console.error("Failed to rename folder:", error);
      alert(
        `Error renaming folder: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCopyAppName(e.target.value);
  };

  const handleOpenCopyDialog = () => {
    if (selectedApp) {
      setNewCopyAppName(`${selectedApp.name}-copy`);
      setIsCopyDialogOpen(true);
    }
  };

  const copyAppMutation = useMutation({
    mutationFn: async ({ withHistory }: { withHistory: boolean }) => {
      if (!appId || !newCopyAppName.trim()) {
        throw new Error("Invalid app ID or name for copying.");
      }
      return IpcClient.getInstance().copyApp({
        appId,
        newAppName: newCopyAppName,
        withHistory,
      });
    },
    onSuccess: async (data) => {
      const appId = data.app.id;
      setSelectedAppId(appId);
      await invalidateAppQuery(queryClient, { appId });
      await refreshApps();
      await IpcClient.getInstance().createChat(appId);
      setIsCopyDialogOpen(false);
      navigate({ to: "/app-details", search: { appId } });
    },
    onError: (error) => {
      showError(error);
    },
  });

  if (!selectedApp) {
    return (
      <div className="relative min-h-screen p-8">
        <Button
          onClick={() => router.history.back()}
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 flex items-center gap-1 bg-(--background-lightest) py-5"
        >
          <ArrowLeft className="h-3 w-4" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold">App not found</h2>
        </div>
      </div>
    );
  }

  const fullAppPath = appBasePath.replace("$APP_BASE_PATH", selectedApp.path);
  // In a future iteration, replace these with real created/updated timestamps from the app record if available
  const createdAt = new Date();
  const updatedAt = new Date();
  const createdAbs = createdAt.toLocaleString();
  const updatedAbs = updatedAt.toLocaleString();
  const createdRel = formatDistanceToNow(createdAt, { addSuffix: true });
  const updatedRel = formatDistanceToNow(updatedAt, { addSuffix: true });

  return (
    <div
      className="relative min-h-screen p-3 sm:p-4 w-full bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black"
      data-testid="app-details-page"
    >
      <Button
        onClick={() => router.history.back()}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 flex items-center gap-1 bg-(--background-lightest) py-2"
      >
        <ArrowLeft className="h-3 w-4" />
        Back
      </Button>

      <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Left column: title/menu, metadata chips, sticky CTA */}
          <div className="lg:col-span-5">
            <div className="relative p-4 sm:p-5 rounded-2xl glass-surface border shadow-sm">
              <div className="flex items-start gap-2">
                <h2 className="text-xl sm:text-2xl font-bold glass-contrast-text flex-1 truncate">{selectedApp.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-7 w-7 hover:bg-white/70 dark:hover:bg-white/10"
                  onClick={handleOpenRenameDialog}
                  data-testid="app-details-rename-app-button"
                  title="Rename app"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-white/70 dark:hover:bg-white/10"
                      data-testid="app-details-more-options-button"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-2 glass-surface" align="end">
                    <div className="flex flex-col space-y-0.5">
                      <Button onClick={handleOpenRenameFolderDialog} variant="ghost" size="sm" className="h-8 justify-start text-xs hover:bg-white/70 dark:hover:bg-white/10">Rename folder</Button>
                      <Button onClick={handleOpenCopyDialog} variant="ghost" size="sm" className="h-8 justify-start text-xs hover:bg-white/70 dark:hover:bg-white/10">Copy app</Button>
                      <Button onClick={() => setIsDeleteDialogOpen(true)} variant="ghost" size="sm" className="h-8 justify-start text-xs hover:bg-white/70 dark:hover:bg-white/10">Delete</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Action bar */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    if (!appId) return;
                    navigate({ to: "/chat" });
                  }}
                  className="cursor-pointer w-full py-3 sm:py-4 flex justify-center items-center gap-2 glass-surface glass-hover border text-zinc-900 dark:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open in Chat
                </Button>
                <div className="flex gap-2 flex-col xs:flex-row sm:flex-row">
                  <Button onClick={handleOpenCopyDialog} variant="outline" className="flex-1 glass-button glass-hover"><Copy className="h-4 w-4 mr-1" />Copy</Button>
                  <Button onClick={() => setIsDeleteDialogOpen(true)} variant="destructive" className="flex-1 cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-1" />Delete
                  </Button>
                </div>
              </div>

              {/* Metadata section: modern chips with icons */}
              <TooltipProvider>
                <div className="mt-4 mb-1 space-y-2 text-[12px]">
                  {/* Created */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-3 py-2 rounded-xl glass-surface border cursor-default">
                        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-1.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 opacity-70" />
                            <span className="opacity-80">Created</span>
                          </div>
                          <div className="sm:ml-auto font-medium glass-contrast-text">
                          </div>
                          <div className="text-[11px] opacity-70 sm:ml-2">{createdRel}</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs">{createdAbs}</div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Updated */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-3 py-2 rounded-xl glass-surface border cursor-default">
                        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-1.5">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 opacity-70" />
                            <span className="opacity-80">Updated</span>
                          </div>
                          <div className="sm:ml-auto font-medium glass-contrast-text">
                          </div>
                          <div className="text-[11px] opacity-70 sm:ml-2">{updatedRel}</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs">{updatedAbs}</div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Path */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-3 py-2 rounded-xl glass-surface border">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wide opacity-80">Path</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-7 px-2 py-0.5 hover:bg-white/70 dark:hover:bg-white/10"
                            onClick={() => {
                              navigator.clipboard.writeText(fullAppPath).then(() => showSuccess("Path copied"));
                            }}
                            title="Copy path"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="ml-1">Copy</span>
                          </Button>
                        </div>
                        <div className="mt-1.5 rounded-md bg-black/5 dark:bg-white/5 px-2 py-1.5 font-mono text-[11px] break-all whitespace-pre-wrap">
                          {fullAppPath}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="max-w-[360px] break-all text-xs">{fullAppPath}</div>
                    </TooltipContent>
                  </Tooltip>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 py-0.5 hover:bg-white/70 dark:hover:bg-white/10 justify-start w-fit"
                    onClick={() => IpcClient.getInstance().showItemInFolder(fullAppPath)}
                    title="Show in File Explorer"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span className="ml-1">Show in File Explorer</span>
                  </Button>
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* Right column: Collapsible sections */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="p-3 sm:p-4 rounded-2xl glass-surface border shadow-sm">
              <Accordion type="single" collapsible defaultValue="tech-stack">
                <AccordionItem value="tech-stack">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Tech Stack</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {(["Frontend","Backend","DB","Infra","Hosting","Tools"] as const).map((k) => (
                        grouped[k].length > 0 ? (
                          <div key={k}>
                            <div className="text-[11px] uppercase tracking-wide opacity-70 mb-1">{k}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {grouped[k].map((t) => (
                                <TechPill key={`${k}-${t.name}`} name={t.name} version={t.version ?? undefined} source={t.source} />
                              ))}
                            </div>
                          </div>
                        ) : null
                      ))}
                      {techStack.length === 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">No stack detected yet.</span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="integrations">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Integrations</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="border rounded-md p-3 sm:p-4 glass-surface">
                        <GitHubConnector appId={appId} folderName={selectedApp.path} />
                      </div>
                      {appId && <SupabaseConnector appId={appId} />}
                      {(appId && (selectedApp as any).supabaseProjectId) && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!appId) return;
                              navigate({ to: "/db-browser", search: { appId: Number(appId) } });
                            }}
                            className="cursor-pointer"
                          >
                            <img src={natiDbLogo} alt="DB" className="h-4 w-auto mr-1 object-contain" />
                            Open DB Browser
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="mobile">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Mobile Development</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2">
                      {appId && <CapacitorControls appId={appId} />}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="upgrades">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Upgrades</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2">
                      <AppUpgrades appId={appId} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="max-w-sm p-4">
            <DialogHeader className="pb-2">
              <DialogTitle>Rename App</DialogTitle>
            </DialogHeader>
            <div className="relative my-2">
              <Input
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newAppName.trim() && !isRenaming) {
                    setIsRenameDialogOpen(false);
                    setIsRenameConfirmDialogOpen(true);
                  }
                }}
                placeholder="Enter new app name"
                className="pr-14"
                autoFocus
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] opacity-70">Enter</span>
            </div>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRenameDialogOpen(false)}
                disabled={isRenaming}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsRenameDialogOpen(false);
                  setIsRenameConfirmDialogOpen(true);
                }}
                disabled={isRenaming || !newAppName.trim()}
                size="sm"
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Confirm Dialog */}
        <Dialog open={isRenameConfirmDialogOpen} onOpenChange={setIsRenameConfirmDialogOpen}>
          <DialogContent
            className="max-w-sm p-4"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newAppName.trim() && !isRenaming) {
                handleRenameApp(renameFolderAlso);
              }
            }}
          >
            <DialogHeader className="pb-2">
              <DialogTitle>Confirm rename</DialogTitle>
              <DialogDescription className="text-xs">
                You are about to rename the app to <span className="font-medium">{newAppName || "(empty)"}</span>.
              </DialogDescription>
            </DialogHeader>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renameFolderAlso}
                onChange={(e) => setRenameFolderAlso(e.target.checked)}
              />
              Also rename the folder on disk
            </label>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"></div>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRenameConfirmDialogOpen(false)}
                disabled={isRenaming}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRenameApp(renameFolderAlso)}
                disabled={isRenaming || !newAppName.trim()}
                size="sm"
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Folder Dialog */}
        <Dialog
          open={isRenameFolderDialogOpen}
          onOpenChange={setIsRenameFolderDialogOpen}
        >
          <DialogContent className="max-w-sm p-4">
            <DialogHeader className="pb-2">
              <DialogTitle>Rename app folder</DialogTitle>
              <DialogDescription className="text-xs">
                This will change only the folder name, not the app name.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter new folder name"
              className="my-2"
              autoFocus
            />
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRenameFolderDialogOpen(false)}
                disabled={isRenamingFolder}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameFolderOnly}
                disabled={isRenamingFolder || !newFolderName.trim()}
                size="sm"
              >
                {isRenamingFolder ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Renaming...
                  </>
                ) : (
                  "Rename Folder"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Copy App Dialog */}
        {selectedApp && (
          <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
            <DialogContent className="max-w-md p-4">
              <DialogHeader className="pb-2">
                <DialogTitle>Copy "{selectedApp.name}"</DialogTitle>
                <DialogDescription className="text-sm">
                  <p>Create a copy of this app.</p>
                  <p>
                    Note: this does not copy over the Supabase project or GitHub
                    project.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 my-2">
                <div>
                  <Label htmlFor="newAppName">New app name</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newAppName"
                      value={newCopyAppName}
                      onChange={handleAppNameChange}
                      placeholder="Enter new app name"
                      className="pr-8"
                      disabled={copyAppMutation.isPending}
                    />
                    {isCheckingName && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {nameExists && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      An app with this name already exists. Please choose
                      another name.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start p-2 h-auto relative text-sm"
                    onClick={() =>
                      copyAppMutation.mutate({ withHistory: true })
                    }
                    disabled={
                      copyAppMutation.isPending ||
                      nameExists ||
                      !newCopyAppName.trim() ||
                      isCheckingName
                    }
                  >
                    {copyAppMutation.isPending &&
                      copyAppMutation.variables?.withHistory === true && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    <div className="absolute top-1 right-1">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 text-[10px]">
                        Recommended
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-xs">
                        Copy app with history
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Copies the entire app, including the Git version
                        history.
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start p-2 h-auto text-sm"
                    onClick={() =>
                      copyAppMutation.mutate({ withHistory: false })
                    }
                    disabled={
                      copyAppMutation.isPending ||
                      nameExists ||
                      !newCopyAppName.trim() ||
                      isCheckingName
                    }
                  >
                    {copyAppMutation.isPending &&
                      copyAppMutation.variables?.withHistory === false && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    <div className="text-left">
                      <p className="font-medium text-xs">
                        Copy app without history
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Useful if the current app has a Git-related issue.
                      </p>
                    </div>
                  </Button>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                  disabled={copyAppMutation.isPending}
                  size="sm"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DB Browser Modal */}
        {appId && (
          <Dialog open={isDbBrowserOpen} onOpenChange={setIsDbBrowserOpen}>
            <DialogContent className="max-w-7xl w-[96vw] h-[90vh] p-0 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background/80 backdrop-blur">
                  <DialogTitle>Supabase DB Browser</DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsDbBrowserOpen(false)}>
                    Close
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
                  <SupabaseDbBrowser appId={appId} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-sm p-4 rounded-2xl glass-surface border shadow-sm backdrop-blur-md select-none">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Trash2 className="h-4 w-4" /> Delete "{selectedApp.name}"?
              </DialogTitle>
              <DialogDescription className="text-xs glass-contrast-text">
                This action is irreversible. All app files and chat history will
                be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                size="sm"
                className="rounded-xl glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteApp}
                disabled={isDeleting}
                className="rounded-xl shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 flex items-center gap-1 cursor-pointer" 
                size="sm"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete App"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
