import { useAtom } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useRouter, useLocation } from "@tanstack/react-router";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
// @ts-ignore
import logo from "../../assets/logo.svg";
import { providerSettingsRoute } from "@/routes/settings/providers/$provider";
import { cn } from "@/lib/utils";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { useEffect, useState } from "react";
import { DyadProSuccessDialog } from "@/components/DyadProSuccessDialog";
import { useTheme } from "@/contexts/ThemeContext";
import { IpcClient } from "@/ipc/ipc_client";
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { UserBudgetInfo } from "@/ipc/ipc_types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PreviewHeader } from "@/components/preview_panel/PreviewHeader";
import { NatiAuthButton } from "@/components/NatiAuthButton";
import { MdDiamond } from "react-icons/md";

export const TitleBar = () => {
  const [selectedAppId] = useAtom(selectedAppIdAtom);
  const { apps } = useLoadApps();
  const { navigate } = useRouter();
  const location = useLocation();
  const { settings, refreshSettings } = useSettings();
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [showWindowControls, setShowWindowControls] = useState(false);

  useEffect(() => {
    // Check if we're running on Windows
    const checkPlatform = async () => {
      try {
        const platform = await IpcClient.getInstance().getSystemPlatform();
        setShowWindowControls(platform !== "darwin");
      } catch (error) {
        console.error("Failed to get platform info:", error);
      }
    };

    checkPlatform();
  }, []);

  const showDyadProSuccessDialog = () => {
    setIsSuccessDialogOpen(true);
  };

  const { lastDeepLink } = useDeepLink();
  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "dyad-pro-return") {
        await refreshSettings();
        showDyadProSuccessDialog();
      }
    };
    handleDeepLink();
  }, [lastDeepLink]);

  // Pro button hidden for now

  return (
    <>
      <div className="@container z-11 w-full h-11 bg-(--sidebar) absolute top-0 left-0 app-region-drag flex items-center px-3">
        <div className="flex items-center gap-2 no-app-region-drag">
          <img src={logo} alt="Nati Logo" className="w-6 h-6 mr-0.5" />
          <span className="hidden @md:block text-sm font-medium select-none glass-contrast-text opacity-70 hover:opacity-90 transition-colors font-mono tracking-wide">nati.dev</span>
        </div>

        {/* Spacer to push header to the right */}
        <div className="flex-1" />

        {/* Preview Header */}
        {location.pathname === "/chat" && (
          <div className="no-app-region-drag mr-3">
            <PreviewHeader />
          </div>
        )}

        {/* Pro Credits Display */}
        {settings?.natiUser?.isPro && (
          <div className="no-app-region-drag mr-2">
            <NatiProButton isNatiProEnabled={true} />
          </div>
        )}

        {/* User Authentication */}
        <div className="no-app-region-drag mr-2">
          <NatiAuthButton />
        </div>

        {showWindowControls && <WindowsControls />}
      </div>

      <DyadProSuccessDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </>
  );
};

function WindowsControls() {
  const { isDarkMode } = useTheme();
  const ipcClient = IpcClient.getInstance();

  const minimizeWindow = () => {
    ipcClient.minimizeWindow();
  };

  const maximizeWindow = () => {
    ipcClient.maximizeWindow();
  };

  const closeWindow = () => {
    ipcClient.closeWindow();
  };

  return (
    <div className="ml-auto flex no-app-region-drag">
      <button
        className="w-9 h-9 mx-0.5 flex items-center justify-center rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
        onClick={minimizeWindow}
        aria-label="Minimize"
      >
        <svg
          width="12"
          height="1"
          viewBox="0 0 12 1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="12" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        className="w-9 h-9 mx-0.5 flex items-center justify-center rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
        onClick={maximizeWindow}
        aria-label="Maximize"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0.5" y="0.5" width="11" height="11" stroke="currentColor" />
        </svg>
      </button>
      <button
        className="w-9 h-9 ml-0.5 flex items-center justify-center rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-red-500/90 hover:text-white transition-colors outline-none focus-visible:ring-2 ring-red-400/70"
        onClick={closeWindow}
        aria-label="Close"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}

export function NatiProButton({
  isNatiProEnabled,
}: {
  isNatiProEnabled: boolean;
}) {
  const { navigate } = useRouter();
  const { userBudget, isLoadingUserBudget } = useUserBudgetInfo();
  const { settings } = useSettings();
  
  const hasApiKey = !!settings?.providerSettings?.auto?.apiKey?.value;
  
  return (
    <button
      data-testid="title-bar-nati-pro-button"
      onClick={() => {
        navigate({
          to: providerSettingsRoute.id,
          params: { provider: "auto" },
        });
      }}
      className="no-app-region-drag flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-foreground/80 hover:text-foreground transition-colors outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
    >
      <span className="opacity-90 flex items-center gap-1">
        <MdDiamond className="text-zinc-400" size={14} aria-hidden />
        Pro
      </span>
      {isNatiProEnabled && (
        <>
          {isLoadingUserBudget ? (
            <span className="opacity-50">...</span>
          ) : userBudget && hasApiKey ? (
            <AICreditStatus userBudget={userBudget} />
          ) : !hasApiKey ? (
            <span className="opacity-50">Setup</span>
          ) : null}
        </>
      )}
    </button>
  );
}

export function AICreditStatus({ userBudget }: { userBudget: UserBudgetInfo }) {
  const remaining = Math.round(
    userBudget.totalCredits - userBudget.usedCredits,
  );
  const used = Math.round(userBudget.usedCredits);
  const total = Math.round(userBudget.totalCredits);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="opacity-70">
          {remaining.toLocaleString()}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-semibold">{remaining.toLocaleString()} credits remaining</p>
          <p className="text-xs opacity-80">Used: {used.toLocaleString()} / {total.toLocaleString()}</p>
          <p className="text-xs opacity-60">Updates after each AI request</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
