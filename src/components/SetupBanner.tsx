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
      "https://www.natidev.com/pro?utm_source=dyad-app&utm_medium=app&utm_campaign=setup-banner",
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
      <div className="flex flex-col items-center">
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
            "text-sm font-medium",
            "bg-white/70 dark:bg-zinc-900/70 backdrop-blur border",
            "border-zinc-200 dark:border-zinc-700",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_6px_20px_rgba(0,0,0,0.08)]",
            "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_36px_rgba(237,50,121,0.22)]",
            "transition-all duration-300",
            "cursor-pointer"
          )}
        >
          {/* subtle gradient ring on hover */}
          <span className="pointer-events-none absolute -inset-px rounded-full bg-[linear-gradient(120deg,rgba(237,50,121,0.18),rgba(100,108,255,0.18))] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-[#ed3279] to-[#6a4cff] text-white shadow-sm">
              <Star className="h-3.5 w-3.5" />
            </span>
            <span className="glass-contrast-text">Star it on GitHub</span>
            <Github className="h-4 w-4 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
          </span>
        </button>

        <h1 className="select-none text-center text-5xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 tracking-tight">
          Build your app with
          {" "}
          <span className="relative inline-block align-middle">
            {/* Gradient text */}
            <span className="relative z-10 bg-gradient-to-r from-[#ed3279] via-fuchsia-500 to-[#6a4cff] bg-clip-text text-transparent [text-shadow:0_0_18px_rgba(237,50,121,0.35)]">
              Nati
            </span>
            {/* Glossy highlight line under text */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80"
            />
            </span>
        </h1>
        
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
      {/* Always-visible small CTA */}
      <div className="flex justify-center mt-1">
        <button
          type="button"
          onClick={() =>
            IpcClient.getInstance().openExternalUrl(
              "https://github.com/natidev-sh/nati",
            )
          }
          className={cn(
            "group relative inline-flex items-center gap-2 rounded-full px-3 py-1.5",
            "text-xs font-medium",
            "bg-white/70 dark:bg-zinc-900/70 backdrop-blur border",
            "border-zinc-200 dark:border-zinc-700",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_14px_rgba(0,0,0,0.08)]",
            "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(237,50,121,0.20)]",
            "transition-all duration-300 mb-2",
          )}
          aria-label="Star nati on GitHub"
        >
          <span className="pointer-events-none absolute -inset-px rounded-full bg-[linear-gradient(120deg,rgba(237,50,121,0.14),rgba(100,108,255,0.14))] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-[#ed3279] to-[#6a4cff] text-white shadow-sm">
              <Star className="h-3 w-3" />
            </span>
            <span className="glass-contrast-text">Star it on GitHub</span>
            <Github className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
          </span>
        </button>
      </div>

      <p className="text-xl text-zinc-700 dark:text-zinc-300 p-4">Setup Nati</p>
      <div className={bannerClasses}>
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={itemsNeedAction}
        >
          <AccordionItem
            value="node-setup"
            className={cn(
              nodeCheckError
                ? "bg-red-50 dark:bg-red-900/30"
                : isNodeSetupComplete
                  ? "bg-green-50 dark:bg-green-900/30"
                  : "bg-yellow-50 dark:bg-yellow-900/30",
            )}
          >
            <AccordionTrigger className="px-4 py-3 transition-colors w-full hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isNodeSetupComplete, nodeCheckError)}
                  <span className="font-medium text-sm">
                    1. Install Node.js (App Runtime)
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4 bg-white dark:bg-zinc-900 border-t border-inherit">
              {nodeCheckError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error checking Node.js status. Try installing Node.js.
                </p>
              )}
              {isNodeSetupComplete ? (
                <p className="text-sm">
                  Node.js ({nodeSystemInfo!.nodeVersion}) installed.{" "}
                  {nodeSystemInfo!.pnpmVersion && (
                    <span className="text-xs text-gray-500">
                      {" "}
                      (optional) pnpm ({nodeSystemInfo!.pnpmVersion}) installed.
                    </span>
                  )}
                </p>
              ) : (
                <div className="text-sm">
                  <p>Node.js is required to run apps locally.</p>
                  {nodeInstallStep === "waiting-for-continue" && (
                    <p className="mt-1">
                      After you have installed Node.js, click "Continue". If the
                      installer didn't work, try{" "}
                      <a
                        className="text-blue-500 dark:text-blue-400 hover:underline"
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
              isAnyProviderSetup()
                ? "bg-green-50 dark:bg-green-900/30"
                : "bg-yellow-50 dark:bg-yellow-900/30",
            )}
          >
            <AccordionTrigger
              className={cn(
                "px-4 py-3 transition-colors w-full hover:no-underline",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {getStatusIcon(isAnyProviderSetup())}
                  <span className="font-medium text-sm">
                    2. Setup AI Model Access
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4 bg-white dark:bg-zinc-900 border-t border-inherit">
              <p className="text-sm mb-3">
                Connect your preferred AI provider to start generating code.
              </p>
              <SetupProviderCard
                variant="google"
                onClick={handleGoogleSetupClick}
                tabIndex={isNodeSetupComplete ? 0 : -1}
                leadingIcon={
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                }
                title="Setup Google Gemini API Key"
                subtitle={
                  <>
                    <GiftIcon className="w-3 h-3" />
                    Use Google Gemini for free
                  </>
                }
              />

              <SetupProviderCard
                className="mt-2"
                variant="openrouter"
                onClick={handleOpenRouterSetupClick}
                tabIndex={isNodeSetupComplete ? 0 : -1}
                leadingIcon={
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                }
                title="Setup OpenRouter API Key"
                subtitle={
                  <>
                    <GiftIcon className="w-3 h-3" />
                    Free models available
                  </>
                }
              />

              <div className="relative mt-2">
                {/* SOON badge */}
                <span
                  className="absolute -top-2 -right-2 z-10 select-none rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide shadow-sm bg-gradient-to-r from-[#ed3279] to-[#6a4cff] text-white ring-1 ring-white/40 dark:ring-white/10 animate-[pulse_2.2s_ease-in-out_infinite]"
                >
                  SOON
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-not-allowed">
                      <SetupProviderCard
                        className="opacity-60 saturate-75"
                        variant="dyad"
                        onClick={() => {}}
                        tabIndex={-1}
                        leadingIcon={
                          <img src={logo} alt="nati Logo" className="w-6 h-6 mr-0.5" />
                        }
                        title="nati Pro (coming soon)"
                        subtitle={
                          <>
                            <GlobeIcon className="w-3 h-3" />
                            Access all AI models with one plan
                          </>
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>Pro is launching soon</TooltipContent>
                </Tooltip>
              </div>

              <div
                className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
                onClick={handleOtherProvidersClick}
                role="button"
                tabIndex={isNodeSetupComplete ? 0 : -1}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full">
                      <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-800 dark:text-gray-300">
                        Setup other AI providers
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        OpenAI, Anthropic, OpenRouter and more
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
    <div className="mt-3 p-3 bg-(--background-lighter) border rounded-lg text-sm">
      <p>
        If you run into issues, read our{" "}
        <a
          onClick={() => {
            IpcClient.getInstance().openExternalUrl(
              "https://www.natidev.com/docs/help/nodejs",
            );
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Node.js troubleshooting guide
        </a>
        .{" "}
      </p>
      <p className="mt-2">
        Still stuck? Click the <b>Help</b> button in the bottom-left corner and
        then <b>Report a Bug</b>.
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
        <Button className="mt-3" onClick={handleNodeInstallClick}>
          Install Node.js Runtime
        </Button>
      );
    case "continue-processing":
      return (
        <Button className="mt-3" onClick={finishNodeInstall} disabled>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking Node.js setup...
          </div>
        </Button>
      );
    case "waiting-for-continue":
      return (
        <Button className="mt-3" onClick={finishNodeInstall}>
          <div className="flex items-center gap-2">
            Continue | I installed Node.js
          </div>
        </Button>
      );
    case "finished-checking":
      return (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">
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
