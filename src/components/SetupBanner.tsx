import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  GiftIcon,
  Sparkles,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Settings,
  GlobeIcon,
  Star,
  Github,
} from "lucide-react";
import { providerSettingsRoute } from "@/routes/settings/providers/$provider";

import SetupProviderCard from "@/components/SetupProviderCard";
import { UpdateBanner } from "@/components/UpdateBanner";

import { useState, useEffect, useCallback } from "react";
import { IpcClient } from "@/ipc/ipc_client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NodeSystemInfo } from "@/ipc/ipc_types";
import { usePostHog } from "posthog-js/react";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useScrollAndNavigateTo } from "@/hooks/useScrollAndNavigateTo";
// @ts-ignore
import logo from "../../assets/logo.svg";

type NodeInstallStep =
  | "install"
  | "waiting-for-continue"
  | "continue-processing"
  | "finished-checking";

export function SetupBanner() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const { isAnyProviderSetup, isLoading: loading } =
    useLanguageModelProviders();
  const [nodeSystemInfo, setNodeSystemInfo] = useState<NodeSystemInfo | null>(
    null,
  );
  const [nodeCheckError, setNodeCheckError] = useState<boolean>(false);
  const [nodeInstallStep, setNodeInstallStep] =
    useState<NodeInstallStep>("install");
  const checkNode = useCallback(async () => {
    try {
      setNodeCheckError(false);
      const status = await IpcClient.getInstance().getNodejsStatus();
      setNodeSystemInfo(status);
    } catch (error) {
      console.error("Failed to check Node.js status:", error);
      setNodeSystemInfo(null);
      setNodeCheckError(true);
    }
  }, [setNodeSystemInfo, setNodeCheckError]);

  useEffect(() => {
    checkNode();
  }, [checkNode]);

  const settingsScrollAndNavigateTo = useScrollAndNavigateTo("/settings", {
    behavior: "smooth",
    block: "start",
  });

  const handleGoogleSetupClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:google:click");
    navigate({
      to: providerSettingsRoute.id,
      params: { provider: "google" },
    });
  };

  const handleOpenRouterSetupClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:openrouter:click");
    navigate({
      to: providerSettingsRoute.id,
      params: { provider: "openrouter" },
    });
  };
  const handleDyadProSetupClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:dyad:click");
    IpcClient.getInstance().openExternalUrl(
      "https://natiweb.vercel.app/",
    );
  };

  const handleOtherProvidersClick = () => {
    posthog.capture("setup-flow:ai-provider-setup:other:click");
    settingsScrollAndNavigateTo("provider-settings");
  };

  const handleNodeInstallClick = useCallback(async () => {
    posthog.capture("setup-flow:start-node-install-click");
    setNodeInstallStep("waiting-for-continue");
    IpcClient.getInstance().openExternalUrl(nodeSystemInfo!.nodeDownloadUrl);
  }, [nodeSystemInfo, setNodeInstallStep]);

  const finishNodeInstall = useCallback(async () => {
    posthog.capture("setup-flow:continue-node-install-click");
    setNodeInstallStep("continue-processing");
    await IpcClient.getInstance().reloadEnvPath();
    await checkNode();
    setNodeInstallStep("finished-checking");
  }, [checkNode, setNodeInstallStep]);

  // We only check for node version because pnpm is not required for the app to run.
  const isNodeSetupComplete = Boolean(nodeSystemInfo?.nodeVersion);

  const itemsNeedAction: string[] = [];
  if (!isNodeSetupComplete && nodeSystemInfo) {
    itemsNeedAction.push("node-setup");
  }
  if (!isAnyProviderSetup() && !loading) {
    itemsNeedAction.push("ai-setup");
  }

  if (itemsNeedAction.length === 0) {
    return (
      <div className="flex flex-col items-center space-y-6 py-8">
        {/* GitHub Star CTA with enhanced design */}
        <button
          type="button"
          onClick={() =>
            IpcClient.getInstance().openExternalUrl(
              "https://github.com/natidev-sh/nati",
            )
          }
          className={cn(
            "group relative inline-flex items-center gap-2.5 rounded-full px-5 py-2.5",
            "text-sm font-semibold",
            "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-2",
            "border-zinc-200/80 dark:border-zinc-700/80",
            "shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgba(237,50,121,0.3)]",
            "transition-all duration-500 ease-out",
            "hover:scale-105 active:scale-95",
            "cursor-pointer"
          )}
        >
          {/* Animated gradient ring */}
          <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-[#ed3279] via-fuchsia-500 to-[#6a4cff] opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500" />
          <span className="relative flex items-center gap-2.5">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-[#ed3279] via-fuchsia-500 to-[#6a4cff] text-white shadow-lg animate-pulse">
              <Star className="h-4 w-4 fill-current" />
            </span>
            <span className="bg-gradient-to-r from-zinc-700 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              Star us on GitHub
            </span>
            <Github className="h-4.5 w-4.5 text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100 transition-colors duration-300" />
          </span>
        </button>

        {/* Hero heading with enhanced typography */}
        <div className="text-center space-y-3">
          <h1 className="select-none text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-600 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Build your app with
            </span>
            <br />
            <span className="relative inline-block mt-2">
              {/* Glow effect */}
              <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#ed3279] via-fuchsia-500 to-[#6a4cff] opacity-30 animate-pulse" />
              {/* Main gradient text */}
              <span className="relative bg-gradient-to-r from-[#ed3279] via-fuchsia-500 to-[#6a4cff] bg-clip-text text-transparent font-black">
                Nati
              </span>
              {/* Underline decoration */}
              <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path
                  d="M0,7 Q50,0 100,7 T200,7"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ed3279" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#d946ef" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#6a4cff" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>
        </div>
      </div>
    );
  }

  const bannerClasses = cn(
    "w-full mb-6 border rounded-xl shadow-sm overflow-hidden",
    "border-zinc-200 dark:border-zinc-700",
  );

  const getStatusIcon = (isComplete: boolean, hasError: boolean = false) => {
    if (hasError) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return isComplete ? (
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
    );
  };

  return (
    <>
      {/* Enhanced header section */}
      <div className="flex flex-col items-center space-y-4 mb-8 mt-4">
        {/* GitHub Star CTA */}
        <button
          type="button"
          onClick={() =>
            IpcClient.getInstance().openExternalUrl(
              "https://github.com/natidev-sh/nati",
            )
          }
          className={cn(
            "group relative inline-flex items-center gap-2 rounded-full px-4 py-2",
            "text-xs font-semibold",
            "bg-gradient-to-r from-white/90 to-white/70 dark:from-zinc-900/90 dark:to-zinc-900/70",
            "backdrop-blur-xl border-2",
            "border-zinc-300/50 dark:border-zinc-600/50",
            "shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgba(237,50,121,0.25)]",
            "transition-all duration-400 ease-out",
            "hover:scale-105 active:scale-95",
          )}
          aria-label="Star nati on GitHub"
        >
          <span className="pointer-events-none absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#ed3279] via-fuchsia-500 to-[#6a4cff] opacity-0 group-hover:opacity-100 blur transition-opacity duration-400" />
          <span className="relative flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-[#ed3279] to-[#6a4cff] text-white shadow-md">
              <Star className="h-3 w-3 fill-current" />
            </span>
            <span className="bg-gradient-to-r from-zinc-700 to-zinc-900 dark:from-zinc-200 dark:to-zinc-100 bg-clip-text text-transparent">
              Star us on GitHub
            </span>
            <Github className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100 transition-colors" />
          </span>
        </button>

        {/* Setup title with gradient */}
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-600 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-300 bg-clip-text text-transparent">
            Setup Nati
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Get started in just a few steps
          </p>
        </div>
      </div>

      {/* Modern setup cards container */}
      <div className={cn(
        "w-full mb-6 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900/90 dark:to-zinc-800/50",
        "border-2 border-zinc-200/60 dark:border-zinc-700/60",
        "shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
        "backdrop-blur-sm"
      )}>
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={itemsNeedAction}
        >
          <AccordionItem
            value="node-setup"
            className={cn(
              "transition-all duration-300 border-b border-zinc-200/50 dark:border-zinc-700/50 last:border-b-0",
              nodeCheckError
                ? "bg-gradient-to-r from-red-50/80 to-red-100/40 dark:from-red-950/30 dark:to-red-900/20"
                : isNodeSetupComplete
                  ? "bg-gradient-to-r from-green-50/80 to-emerald-100/40 dark:from-green-950/30 dark:to-emerald-900/20"
                  : "bg-gradient-to-r from-yellow-50/80 to-amber-100/40 dark:from-yellow-950/30 dark:to-amber-900/20",
            )}
          >
            <AccordionTrigger className="px-6 py-4 transition-all duration-200 w-full hover:no-underline group">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                    "group-hover:scale-110",
                    nodeCheckError
                      ? "bg-red-100 dark:bg-red-900/50"
                      : isNodeSetupComplete
                        ? "bg-green-100 dark:bg-green-900/50"
                        : "bg-yellow-100 dark:bg-yellow-900/50"
                  )}>
                    {getStatusIcon(isNodeSetupComplete, nodeCheckError)}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-base block">
                      1. Install Node.js
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Required runtime for local development
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4 pb-6 bg-white/50 dark:bg-zinc-900/50 border-t border-zinc-200/50 dark:border-zinc-700/50">
              {nodeCheckError && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    Error checking Node.js status. Try installing Node.js.
                  </p>
                </div>
              )}
              {isNodeSetupComplete ? (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 border-2 border-green-200/60 dark:border-green-800/40 rounded-xl">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✓ Node.js ({nodeSystemInfo!.nodeVersion}) installed
                    {nodeSystemInfo!.pnpmVersion && (
                      <span className="text-xs text-green-700 dark:text-green-300 ml-2">
                        (optional) pnpm ({nodeSystemInfo!.pnpmVersion}) installed
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-3">
                    Node.js is required to run apps locally.
                  </p>
                  {nodeInstallStep === "waiting-for-continue" && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        After you have installed Node.js, click "Continue". If the
                        installer didn't work, try{" "}
                        <a
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 font-semibold cursor-pointer transition-colors"
                          onClick={() => {
                            IpcClient.getInstance().openExternalUrl(
                              "https://nodejs.org/en/download",
                            );
                          }}
                        >
                          more download options
                        </a>
                        .
                      </p>
                    </div>
                  )}
                  <NodeInstallButton
                    nodeInstallStep={nodeInstallStep}
                    handleNodeInstallClick={handleNodeInstallClick}
                    finishNodeInstall={finishNodeInstall}
                  />
                </div>
              )}
              <NodeJsHelpCallout />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="ai-setup"
            className={cn(
              "transition-all duration-300 border-b border-zinc-200/50 dark:border-zinc-700/50 last:border-b-0",
              isAnyProviderSetup()
                ? "bg-gradient-to-r from-green-50/80 to-emerald-100/40 dark:from-green-950/30 dark:to-emerald-900/20"
                : "bg-gradient-to-r from-yellow-50/80 to-amber-100/40 dark:from-yellow-950/30 dark:to-amber-900/20",
            )}
          >
            <AccordionTrigger
              className={cn(
                "px-6 py-4 transition-all duration-200 w-full hover:no-underline group",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                    "group-hover:scale-110",
                    isAnyProviderSetup()
                      ? "bg-green-100 dark:bg-green-900/50"
                      : "bg-yellow-100 dark:bg-yellow-900/50"
                  )}>
                    {getStatusIcon(isAnyProviderSetup())}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-base block">
                      2. Setup AI Model Access
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Connect your preferred AI provider
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4 pb-6 bg-white/50 dark:bg-zinc-900/50 border-t border-zinc-200/50 dark:border-zinc-700/50">
              <p className="text-sm mb-4 text-zinc-700 dark:text-zinc-300 font-medium">
                Connect your preferred AI provider to start generating code.
              </p>
              <div className="space-y-3">
                <SetupProviderCard
                  variant="google"
                  onClick={handleGoogleSetupClick}
                  tabIndex={isNodeSetupComplete ? 0 : -1}
                  leadingIcon={
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  }
                  title="Setup Google Gemini API Key"
                  subtitle={
                    <>
                      <GiftIcon className="w-3.5 h-3.5" />
                      Use Google Gemini for free
                    </>
                  }
                />

                <SetupProviderCard
                  variant="openrouter"
                  onClick={handleOpenRouterSetupClick}
                  tabIndex={isNodeSetupComplete ? 0 : -1}
                  leadingIcon={
                    <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  }
                  title="Setup OpenRouter API Key"
                  subtitle={
                    <>
                      <GiftIcon className="w-3.5 h-3.5" />
                      Free models available
                    </>
                  }
                />

                <SetupProviderCard
                  variant="dyad"
                  onClick={handleDyadProSetupClick}
                  tabIndex={isNodeSetupComplete ? 0 : -1}
                  leadingIcon={
                    <img src={logo} alt="nati Logo" className="w-6 h-6 mr-0.5" />
                  }
                  title="nati Pro"
                  subtitle={
                    <>
                      <GlobeIcon className="w-3.5 h-3.5" />
                      Access all AI models with one plan
                    </>
                  }
                />

                <div
                  className="mt-3 p-4 bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-900/50 border-2 border-zinc-200/60 dark:border-zinc-700/60 rounded-xl cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-300"
                  onClick={handleOtherProvidersClick}
                  role="button"
                  tabIndex={isNodeSetupComplete ? 0 : -1}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 p-2 rounded-lg">
                        <Settings className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          Setup other AI providers
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                          OpenAI, Anthropic, and more
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}

function NodeJsHelpCallout() {
  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border-2 border-blue-200/60 dark:border-blue-800/40 rounded-xl text-sm">
      <p className="text-zinc-700 dark:text-zinc-300">
        If you run into issues, read our{" "}
        <a
          onClick={() => {
            IpcClient.getInstance().openExternalUrl(
              "https://www.natidev.com/docs/help/nodejs",
            );
          }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 font-semibold cursor-pointer transition-colors"
        >
          Node.js troubleshooting guide
        </a>
        .
      </p>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Still stuck? Click the <span className="font-semibold text-zinc-800 dark:text-zinc-200">Help</span> button in the bottom-left corner and
        then <span className="font-semibold text-zinc-800 dark:text-zinc-200">Report a Bug</span>.
      </p>
    </div>
  );
}

function NodeInstallButton({
  nodeInstallStep,
  handleNodeInstallClick,
  finishNodeInstall,
}: {
  nodeInstallStep: NodeInstallStep;
  handleNodeInstallClick: () => void;
  finishNodeInstall: () => void;
}) {
  switch (nodeInstallStep) {
    case "install":
      return (
        <Button 
          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
          onClick={handleNodeInstallClick}
        >
          Install Node.js Runtime
        </Button>
      );
    case "continue-processing":
      return (
        <Button 
          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-70" 
          onClick={finishNodeInstall} 
          disabled
        >
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking Node.js setup...
          </div>
        </Button>
      );
    case "waiting-for-continue":
      return (
        <Button 
          className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
          onClick={finishNodeInstall}
        >
          <div className="flex items-center gap-2">
            Continue | I installed Node.js
          </div>
        </Button>
      );
    case "finished-checking":
      return (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 font-medium">
          Node.js not detected. Closing and re-opening nati usually fixes this.
        </div>
      );
    default:
      const _exhaustiveCheck: never = nodeInstallStep;
  }
}

export const OpenRouterSetupBanner = ({
  className,
}: {
  className?: string;
}) => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  return (
    <SetupProviderCard
      className={cn("mt-2", className)}
      variant="openrouter"
      onClick={() => {
        posthog.capture("setup-flow:ai-provider-setup:openrouter:click");
        navigate({
          to: providerSettingsRoute.id,
          params: { provider: "openrouter" },
        });
      }}
      tabIndex={0}
      leadingIcon={
        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      }
      title="Setup OpenRouter API Key"
      subtitle={
        <>
          <GiftIcon className="w-3 h-3" />
          Free models available
        </>
      }
    />
  );
};
