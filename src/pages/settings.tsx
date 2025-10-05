import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { ProviderSettingsGrid } from "@/components/ProviderSettings";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { IpcClient } from "@/ipc/ipc_client";
import { showSuccess, showError } from "@/lib/toast";
import { AutoApproveSwitch } from "@/components/AutoApproveSwitch";
import { TelemetrySwitch } from "@/components/TelemetrySwitch";
import { MaxChatTurnsSelector } from "@/components/MaxChatTurnsSelector";
import { ThinkingBudgetSelector } from "@/components/ThinkingBudgetSelector";
import { useSettings } from "@/hooks/useSettings";
import { useAppVersion } from "@/hooks/useAppVersion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cog, Sliders, Brain, BarChart3, Plug2, Wrench, FlaskConical, ShieldAlert, Sun, Moon, Monitor, Search, ChevronUp, Keyboard } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { GitHubIntegration } from "@/components/GitHubIntegration";
import { VercelIntegration } from "@/components/VercelIntegration";
import { SupabaseIntegration } from "@/components/SupabaseIntegration";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AutoFixProblemsSwitch } from "@/components/AutoFixProblemsSwitch";
import { AutoUpdateSwitch } from "@/components/AutoUpdateSwitch";
import { ReleaseChannelSelector } from "@/components/ReleaseChannelSelector";
import { NeonIntegration } from "@/components/NeonIntegration";
import { RuntimeModeSelector } from "@/components/RuntimeModeSelector";
import { ToolsMcpSettings } from "@/components/settings/ToolsMcpSettings";
import { KeyboardShortcutsSettings } from "@/components/settings/KeyboardShortcutsSettings";

export default function SettingsPage() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const appVersion = useAppVersion();
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("general-settings");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showTop, setShowTop] = useState(false);

  const navItems = useMemo(
    () => [
      { id: "general-settings", label: "General" },
      { id: "workflow-settings", label: "Workflow" },
      { id: "ai-settings", label: "AI" },
      { id: "keyboard-settings", label: "Keyboard" },
      { id: "provider-settings", label: "Providers" },
      { id: "telemetry", label: "Telemetry" },
      { id: "integrations", label: "Integrations" },
      { id: "tools-mcp", label: "Tools (MCP)" },
      { id: "experiments", label: "Experiments" },
      { id: "danger-zone", label: "Danger Zone" },
    ],
    [],
  );

  const filteredNavItems = useMemo(() => {
    const q = sidebarQuery.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [navItems, sidebarQuery]);

  // Smooth scroll behavior
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("scroll-smooth");
    return () => el.classList.remove("scroll-smooth");
  }, []);

  // Observe sections for active link highlighting
  useEffect(() => {
    const root = contentRef.current ?? document;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0));
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    const sectionIds = navItems.map((n) => n.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => !!n);
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navItems]);

  // Show floating "Top" button after scrolling
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Simple highlight component for headings/blurbs
  const Highlight: React.FC<{ text: string }> = ({ text }) => {
    const q = sidebarQuery.trim();
    if (!q) return <>{text}</>;
    const regex = new RegExp(`(${q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "ig");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="rounded px-0.5 bg-yellow-300/60 dark:bg-yellow-600/40">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    );
  };

  const handleResetEverything = async () => {
    setIsResetting(true);
    try {
      const ipcClient = IpcClient.getInstance();
      await ipcClient.resetAll();
      showSuccess("Successfully reset everything. Restart the application.");
    } catch (error) {
      console.error("Error resetting:", error);
      showError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsResetting(false);
      setIsResetDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-8 py-6 from-gray-50 to-white dark:from-gray-900 dark:to-black select-none">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => router.history.back()}
          variant="ghost"
          size="sm"
          className="no-app-region-drag flex items-center gap-2 mb-6 py-2 px-3 rounded-2xl glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 active:scale-[.99] motion-reduce:transition-none motion-reduce:active:transform-none"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Go Back</span>
        </Button>
        <div className="flex justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Cog className="h-5 w-5" />
            </div>
    {/* Jump to Top floating button */}
    {showTop && (
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full glass-button glass-hover glass-active flex items-center justify-center outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
        aria-label="Jump to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400"><Highlight text="Customize appearance, workflow, providers, and integrations." /></p>
            </div>
          </div>
        </div>

        {/* Sticky sidebar + content */}
        <div className="grid grid-cols-12 gap-6" ref={contentRef}>
          {/* Sidebar */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-16 rounded-2xl glass-surface p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl glass-surface border shadow-sm outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-sm select-text"
                  value={sidebarQuery}
                  onChange={(e) => setSidebarQuery(e.target.value)}
                />
              </div>
              <nav className="space-y-1">
                {filteredNavItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`relative block px-3 py-2 rounded-xl glass-button glass-hover transition-colors ${
                      activeId === item.id ? "ring-1 ring-white/30 dark:ring-white/10" : "opacity-90 hover:opacity-100"
                    }`}
                  >
                    {activeId === item.id && (
                      <span
                        aria-hidden
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full"
                        style={{ backgroundColor: "#ed3378" }}
                      />
                    )}
                    <Highlight text={item.label} />
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
          <GeneralSettings appVersion={appVersion} />
          <WorkflowSettings />
          <AISettings />

          {/* Keyboard Settings */}
          <div
            id="keyboard-settings"
            className="rounded-2xl glass-surface glass-hover p-6 scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <Keyboard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold glass-contrast-text">
                Keyboard Shortcuts
              </h2>
            </div>
            <KeyboardShortcutsSettings />
          </div>

          <div
            id="provider-settings"
            className="rounded-2xl glass-surface glass-hover scroll-mt-24"
          >
            <div className="p-6 border-b border-gray-200/60 dark:border-white/10 flex items-center gap-3">
              <Plug2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                <Highlight text="Providers" />
              </h2>
            </div>
            <div className="p-2">
              <ProviderSettingsGrid />
            </div>
          </div>

          <div className="space-y-6">
            <div
              id="telemetry"
            className="rounded-2xl glass-surface glass-hover p-6 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold glass-contrast-text">Telemetry</h2>
              </div>
              <div className="space-y-2">
                <TelemetrySwitch />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This records anonymous usage data to improve the product.
                </div>
              </div>

              <div className="mt-3 flex items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="mr-2 font-medium">Telemetry ID:</span>
                <span className="inline-flex items-center gap-2 bg-gray-100/80 dark:bg-gray-700/70 px-2.5 py-1 rounded-md text-gray-800 dark:text-gray-200 font-mono border border-gray-200/60 dark:border-white/10">
                  {settings ? settings.telemetryUserId : "n/a"}
                </span>
              </div>
            </div>
          </div>

          {/* Integrations Section */}
          <div
            id="integrations"
            className="rounded-2xl glass-surface glass-hover p-6 scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <Plug2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-semibold glass-contrast-text">
                <Highlight text="Integrations" />
              </h2>
            </div>
            <div className="space-y-4">
              <GitHubIntegration />
              <VercelIntegration />
              <SupabaseIntegration />
              <NeonIntegration />
            </div>
          </div>

          {/* Tools (MCP) */}
          <div
            id="tools-mcp"
            className="rounded-2xl glass-surface glass-hover p-6 scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-semibold glass-contrast-text">
                <Highlight text="Tools (MCP)" />
              </h2>
            </div>
            <ToolsMcpSettings />
          </div>

          {/* Experiments Section */}
          <div
            id="experiments"
            className="rounded-2xl glass-surface glass-hover p-6 scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <FlaskConical className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <h2 className="text-lg font-semibold glass-contrast-text">
                <Highlight text="Experiments" />
              </h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-native-git"
                    checked={!!settings?.enableNativeGit}
                    onCheckedChange={(checked) => {
                      updateSettings({
                        enableNativeGit: checked,
                      });
                    }}
                  />
                  <Label htmlFor="enable-native-git">Enable Native Git</Label>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <Highlight text="Native Git offers faster performance but requires" />{" "}
                  <a
                    onClick={() => {
                      IpcClient.getInstance().openExternalUrl(
                        "https://git-scm.com/downloads",
                      );
                    }}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    installing Git
                  </a>
                  .
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            id="danger-zone"
            className="rounded-2xl p-6 glass-surface glass-active scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Reset Everything
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Highlight text="This will delete all your apps, chats, and settings. This action cannot be undone." />
                  </p>
                </div>
                <button
                  onClick={() => setIsResetDialogOpen(true)}
                  disabled={isResetting}
                  className="rounded-md border border-red-200/60 dark:border-red-800 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isResetting ? "Resetting..." : "Reset Everything"}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset Everything"
        message="Are you sure you want to reset everything? This will delete all your apps, chats, and settings. This action cannot be undone."
        confirmText="Reset Everything"
        cancelText="Cancel"
        onConfirm={handleResetEverything}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}

export function GeneralSettings({ appVersion }: { appVersion: string | null }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      id="general-settings"
      className="rounded-2xl glass-surface glass-hover p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Sliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold glass-contrast-text">
          General Settings
        </h2>
      </div>

      <div className="space-y-4 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium glass-contrast-text select-none">Theme</label>

          <div className="relative rounded-2xl p-1 flex gap-1 glass-surface border shadow-sm ring-1 ring-white/20 dark:ring-white/10">
            {(["system", "light", "dark"] as const).map((option) => {
              const isActive = theme === option;
              const label = option.charAt(0).toUpperCase() + option.slice(1);
              const Icon = option === "system" ? Monitor : option === "light" ? Sun : Moon;
              return (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl
                    outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15
                    glass-button glass-hover glass-active
                    active:scale-[.99] motion-reduce:transition-none motion-reduce:active:transform-none
                    ${isActive ? "ring-1 ring-white/30 dark:ring-white/10 relative" : "opacity-80 hover:opacity-100"}
                  `}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline select-none">{label}</span>
                  {isActive && (
                    <span
                      aria-hidden
                      className="ml-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#ed3378" }}
                      title="Selected"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Choose how Nati adapts its colors. “System” follows your OS preference.</p>
      </div>

      <div className="space-y-1 mt-6">
        <AutoUpdateSwitch />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          This will automatically update the app when new versions are
          available.
        </div>
      </div>

      <div className="mt-6">
        <ReleaseChannelSelector />
      </div>

      <div className="mt-6">
        <RuntimeModeSelector />
      </div>

      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-6">
        <span className="mr-2 font-medium">App Version:</span>
        <span className="bg-gray-100/80 dark:bg-gray-700/70 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono border border-gray-200/60 dark:border-white/10">
          {appVersion ? appVersion : "-"}
        </span>
      </div>
    </div>
  );
}

export function WorkflowSettings() {
  return (
    <div
      id="workflow-settings"
      className="rounded-2xl glass-surface glass-hover p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Cog className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        <h2 className="text-lg font-semibold glass-contrast-text">
          Workflow Settings
        </h2>
      </div>

      <div className="space-y-1">
        <AutoApproveSwitch showToast={false} />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          This will automatically approve code changes and run them.
        </div>
      </div>

      <div className="space-y-1 mt-6">
        <AutoFixProblemsSwitch />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          This will automatically fix TypeScript errors.
        </div>
      </div>
    </div>
  );
}
export function AISettings() {
  return (
    <div
      id="ai-settings"
      className="rounded-2xl glass-surface glass-hover p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Brain className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
        <h2 className="text-lg font-semibold glass-contrast-text">
          AI Settings
        </h2>
      </div>

      <div className="mt-4">
        <ThinkingBudgetSelector />
      </div>

      <div className="mt-6">
        <MaxChatTurnsSelector />
      </div>
    </div>
  );
}
