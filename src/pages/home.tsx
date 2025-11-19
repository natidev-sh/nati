import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { homeChatInputValueAtom } from "../atoms/chatAtoms";
import { selectedAppIdAtom, appsListAtom } from "@/atoms/appAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { generateCuteAppName } from "@/lib/utils";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useSettings } from "@/hooks/useSettings";
import { SetupBanner } from "@/components/SetupBanner";
import { isPreviewOpenAtom } from "@/atoms/viewAtoms";
import { useState, useEffect, useCallback } from "react";
import { useStreamChat } from "@/hooks/useStreamChat";
import { HomeChatInput } from "@/components/chat/HomeChatInput";
import { usePostHog } from "posthog-js/react";
import { PrivacyBanner } from "@/components/TelemetryBanner";
import { INSPIRATION_PROMPTS } from "@/prompts/inspiration_prompts";
import { useAppVersion } from "@/hooks/useAppVersion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, ShieldCheck, Sparkles, MessageSquare } from "lucide-react";
import { ImportAppButton } from "@/components/ImportAppButton";
import { showError } from "@/lib/toast";
import { invalidateAppQuery } from "@/hooks/useLoadApp";
import { useQueryClient } from "@tanstack/react-query";

import type { FileAttachment } from "@/ipc/ipc_types";
import { NEON_TEMPLATE_IDS } from "@/shared/templates";
import { neonTemplateHook } from "@/client_logic/template_hook";
import { ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Adding an export for attachments
export interface HomeSubmitOptions {
  attachments?: FileAttachment[];
}

export default function HomePage() {
  const [inputValue, setInputValue] = useAtom(homeChatInputValueAtom);
  const [apps] = useAtom(appsListAtom);
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const { refreshApps } = useLoadApps();
  const { settings, updateSettings } = useSettings();
  const setIsPreviewOpen = useSetAtom(isPreviewOpenAtom);
  const [isLoading, setIsLoading] = useState(false);
  const { streamMessage } = useStreamChat({ hasChatId: false });
  const posthog = usePostHog();
  const appVersion = useAppVersion();
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [releaseUrl, setReleaseUrl] = useState("");
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  // Loading UI helpers
  const statusMessages = ["Scaffolding files", "Installing deps", "Warming AI"] as const;
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  useEffect(() => {
    if (!isLoading) return;
    // Cycle status messages every 1.2s
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusMessages.length);
    }, 1200);
    // Smooth progress toward ~92%
    const progressTimer = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.max(1, Math.floor((92 - p) * 0.08)) : p));
    }, 250);
    return () => {
      clearInterval(statusTimer);
      clearInterval(progressTimer);
    };
  }, [isLoading, statusMessages.length]);
  useEffect(() => {
    const updateLastVersionLaunched = async () => {
      if (
        appVersion &&
        settings &&
        settings.lastShownReleaseNotesVersion !== appVersion
      ) {
        await updateSettings({
          lastShownReleaseNotesVersion: appVersion,
        });

        try {
          const result = await IpcClient.getInstance().doesReleaseNoteExist({
            version: appVersion,
          });

          if (result.exists && result.url) {
            setReleaseUrl(result.url + "?hideHeader=true&theme=" + theme);
            setReleaseNotesOpen(true);
          }
        } catch (err) {
          console.warn(
            "Unable to check if release note exists for: " + appVersion,
            err,
          );
        }
      }
    };
    updateLastVersionLaunched();
  }, [appVersion, settings, updateSettings, theme]);

  // Get the appId from search params
  const appId = search.appId ? Number(search.appId) : null;

  // State for random prompts
  const [randomPrompts, setRandomPrompts] = useState<
    typeof INSPIRATION_PROMPTS
  >([]);

  // Framework badges detection for recent apps
  const [frameworkBadges, setFrameworkBadges] = useState<Record<number, string[]>>({});
  const detectFrameworks = useCallback((pkgJson: any): string[] => {
    const deps = {
      ...pkgJson?.dependencies,
      ...pkgJson?.devDependencies,
    } as Record<string, string> | undefined;
    if (!deps) return [];
    const badges: string[] = [];
    if (deps["next"]) badges.push("Next.js");
    if (deps["react"] && !badges.includes("Next.js")) badges.push("React");
    if (deps["astro"]) badges.push("Astro");
    if (deps["@sveltejs/kit"]) badges.push("SvelteKit");
    if (deps["remix"]) badges.push("Remix");
    if (deps["vite"]) badges.push("Vite");
    if (deps["express"]) badges.push("Express");
    return badges;
  }, []);

  // Load frameworks for the top 6 recent apps
  useEffect(() => {
    if (!apps || apps.length === 0) return;
    const sorted = [...apps].sort((a: any, b: any) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    const top = sorted.slice(0, 6);
    (async () => {
      const entries = await Promise.all(
        top.map(async (app: any) => {
          try {
            const pkgStr = await IpcClient.getInstance().readAppFile(app.id, "package.json");
            const pkg = JSON.parse(pkgStr);
            return [app.id, detectFrameworks(pkg)] as [number, string[]];
          } catch {
            return [app.id, []] as [number, string[]];
          }
        }),
      );
      setFrameworkBadges((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
  }, [apps, detectFrameworks]);

  // Function to get random prompts
  const getRandomPrompts = useCallback(() => {
    const shuffled = [...INSPIRATION_PROMPTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, []);

  // Initialize random prompts
  useEffect(() => {
    setRandomPrompts(getRandomPrompts());
  }, [getRandomPrompts]);

  // Redirect to app details page if appId is present
  useEffect(() => {
    if (appId) {
      navigate({ to: "/app-details", search: { appId } });
    }
  }, [appId, navigate]);

  const handleSubmit = async (options?: HomeSubmitOptions) => {
    const attachments = options?.attachments || [];

    if (!inputValue.trim() && attachments.length === 0) return;

    try {
      setIsLoading(true);
      setStatusIndex(0); // Scaffolding files
      setProgress(12);
      // Create the chat and navigate
      const result = await IpcClient.getInstance().createApp({
        name: generateCuteAppName(),
      });
      setProgress(30);
      if (
        settings?.selectedTemplateId &&
        NEON_TEMPLATE_IDS.has(settings.selectedTemplateId)
      ) {
        setStatusIndex(1); // Installing deps
        await neonTemplateHook({
          appId: result.app.id,
          appName: result.app.name,
        });
        setProgress(50);
      }

      // Stream the message with attachments
      setStatusIndex(2); // Warming AI
      streamMessage({
        prompt: inputValue,
        chatId: result.chatId,
        attachments,
      });
      setProgress(65);
      await new Promise((resolve) =>
        setTimeout(resolve, settings?.isTestMode ? 0 : 2000),
      );

      setInputValue("");
      setSelectedAppId(result.app.id);
      setIsPreviewOpen(false);
      await refreshApps(); // Ensure refreshApps is awaited if it's async
      setProgress(78);
      await invalidateAppQuery(queryClient, { appId: result.app.id });
      setProgress(90);
      posthog.capture("home:chat-submit");
      // Leave a small buffer to reach ~99% before navigation
      setProgress(99);
      navigate({ to: "/chat", search: { id: result.chatId } });
    } catch (error) {
      console.error("Failed to create chat:", error);
      showError("Failed to create app. " + (error as any).toString());
      setIsLoading(false); // Ensure loading state is reset on error
    }
    // No finally block needed for setIsLoading(false) here if navigation happens on success
  };

  // Loading overlay for app creation
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[rgba(237,50,121,0.06)] dark:bg-black/60 backdrop-blur-lg" />
        {/* Card */}
        <div className="relative flex h-full w-full items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass-surface border border-white/60 dark:border-white/10 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_36px_rgba(0,0,0,0.10)] animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-[#ed3279] to-[#c81e5d] p-[2px] shadow-sm shadow-primary/20">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-[#ed3279]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 glass-contrast-text">Building your app</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mx-auto">
              We're setting up your app with AI magic. This might take a moment...
            </p>
            {/* Progress bar */}
            <div className="mt-6">
              <div className="h-2 w-full rounded-full bg-white/50 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#ed3279] transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ed3279] animate-pulse" />
                <span>{statusMessages[statusIndex]}</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Optimizing template and preparing your workspace</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Home Page Content
  return (
    <div className="relative flex flex-col items-center justify-center max-w-3xl w-full m-auto p-8">
      <SetupBanner />

      <div className="w-full">
        <HomeChatInput onSubmit={handleSubmit} />

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-wrap gap-4 justify-center">
            {randomPrompts.map((item, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setInputValue(`Build me a ${item.label}`)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl glass-surface glass-hover active:scale-[0.98]"
              >
                <span className="glass-contrast-text">
                  {item.icon}
                </span>
                <span className="text-sm font-medium glass-contrast-text">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRandomPrompts(getRandomPrompts())}
            className="self-center flex items-center gap-2 px-4 py-2 rounded-xl glass-surface glass-hover active:scale-[0.98]"
          >
            <svg
              className="w-5 h-5 glass-contrast-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-medium glass-contrast-text">
              More ideas
            </span>
          </button>
        </div>
        {/* Recent Apps Section - Clean Sidebar-Style Design */}
        <AnimatePresence>
          {apps && apps.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <motion.div 
                className="flex items-center justify-between mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-sm font-semibold glass-contrast-text uppercase tracking-wide opacity-70">
                  Recent apps
                </h3>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ImportAppButton />
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {apps
                  .slice()
                  .sort((a: any, b: any) => {
                    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return bTime - aTime;
                  })
                  .slice(0, 6)
                  .map((app: any, index: number) => (
                    <motion.button
                      key={app.id}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate({ to: "/app-details", search: { appId: app.id } })}
                      className="group w-full text-left rounded-lg p-3 glass-surface border border-white/10 dark:border-white/5 transition-all duration-200 hover:bg-sidebar-accent/50 overflow-hidden will-change-auto"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-md bg-sidebar-accent flex items-center justify-center text-[11px] font-medium shrink-0">
                              {String(app.name).trim().charAt(0).toUpperCase() || "A"}
                            </div>
                            <span className="truncate font-medium text-[13px] glass-contrast-text">
                              {app.name || `App #${app.id}`}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {frameworkBadges[app.id]?.slice(0, 2).map((fw) => (
                              <span 
                                key={fw} 
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-sidebar-accent/60 text-sidebar-foreground/80"
                              >
                                {fw}
                              </span>
                            ))}
                            {app.githubRepo && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-sidebar-accent/60 text-sidebar-foreground/80">GitHub</span>
                            )}
                            {app.vercelProjectName && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Vercel</span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-sidebar-foreground/50 mt-1.5 truncate">
                            {formatDistanceToNow(new Date(app.updatedAt || app.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors shrink-0 mt-1" />
                      </div>
                    </motion.button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state - Clean Design */}
        <AnimatePresence>
          {(!apps || apps.length === 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <motion.div 
                className="w-full rounded-xl p-6 glass-surface border border-white/10 dark:border-white/5 text-center"
                whileHover={{ scale: 1.01 }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-sidebar-accent mb-3">
                  <Sparkles className="w-6 h-6 text-sidebar-foreground/70" />
                </div>

                <div className="text-base font-semibold glass-contrast-text mb-1">
                  No apps yet
                </div>
                
                <div className="text-sm text-sidebar-foreground/60 mb-4">
                  Start by describing your app idea above or import an existing project.
                </div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ImportAppButton />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <PrivacyBanner />

      {/* Release Notes Dialog */}
      <Dialog open={releaseNotesOpen} onOpenChange={setReleaseNotesOpen}>
        <DialogContent className="max-w-4xl bg-(--docs-bg) pr-0 pt-4 pl-4 gap-1">
          <DialogHeader>
            <DialogTitle>What's new in v{appVersion}?</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-10 top-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() =>
                window.open(
                  releaseUrl.replace("?hideHeader=true&theme=" + theme, ""),
                  "_blank",
                )
              }
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="overflow-auto h-[70vh] flex flex-col ">
            {releaseUrl && (
              <div className="flex-1">
                <iframe
                  src={releaseUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title={`Release notes for v${appVersion}`}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}
