import { useAtom, useAtomValue } from "jotai";
import { previewModeAtom, selectedAppIdAtom } from "../../atoms/appAtoms";
import { IpcClient } from "@/ipc/ipc_client";

import {
  Eye,
  Code,
  MoreVertical,
  Cog,
  Trash2,
  AlertTriangle,
  Wrench,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

import { useRunApp } from "@/hooks/useRunApp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showError, showSuccess } from "@/lib/toast";
import { useMutation } from "@tanstack/react-query";
import { useCheckProblems } from "@/hooks/useCheckProblems";
import { isPreviewOpenAtom } from "@/atoms/viewAtoms";

export type PreviewMode =
  | "preview"
  | "code"
  | "problems"
  | "configure"
  | "publish";

const BUTTON_CLASS_NAME =
  "no-app-region-drag cursor-pointer relative flex items-center gap-1 px-2 py-1 rounded-md text-[13px] font-medium z-10 glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 active:scale-[.99] transition-transform motion-reduce:transition-none motion-reduce:active:transform-none";

// Preview Header component with preview mode toggle
export const PreviewHeader = () => {
  const [previewMode, setPreviewMode] = useAtom(previewModeAtom);
  const [isPreviewOpen, setIsPreviewOpen] = useAtom(isPreviewOpenAtom);
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const previewRef = useRef<HTMLButtonElement>(null);
  const codeRef = useRef<HTMLButtonElement>(null);
  const problemsRef = useRef<HTMLButtonElement>(null);
  const configureRef = useRef<HTMLButtonElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { problemReport } = useCheckProblems(selectedAppId);
  const { restartApp, refreshAppIframe } = useRunApp();

  const isCompact = windowWidth < 860;
  const isVeryCompact = windowWidth < 640; // Ultra compact mode for very small screens

  // Track window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectPanel = (panel: PreviewMode) => {
    if (previewMode === panel) {
      setIsPreviewOpen(!isPreviewOpen);
    } else {
      setPreviewMode(panel);
      setIsPreviewOpen(true);
    }
  };

  const onCleanRestart = useCallback(() => {
    restartApp({ removeNodeModules: true });
  }, [restartApp]);

  const useClearSessionData = () => {
    return useMutation({
      mutationFn: () => {
        const ipcClient = IpcClient.getInstance();
        return ipcClient.clearSessionData();
      },
      onSuccess: async () => {
        await refreshAppIframe();
        showSuccess("Preview data cleared");
      },
      onError: (error) => {
        showError(`Error clearing preview data: ${error}`);
      },
    });
  };

  const { mutate: clearSessionData } = useClearSessionData();

  const onClearSessionData = useCallback(() => {
    clearSessionData();
  }, [clearSessionData]);

  // Get the problem count for the selected app
  const problemCount = problemReport ? problemReport.problems.length : 0;

  // Format the problem count for display
  const formatProblemCount = (count: number): string => {
    if (count === 0) return "";
    if (count > 100) return "100+";
    return count.toString();
  };

  const displayCount = formatProblemCount(problemCount);

  // Update indicator position when mode changes
  useEffect(() => {
    const updateIndicator = () => {
      let targetRef: React.RefObject<HTMLButtonElement | null>;

      switch (previewMode) {
        case "preview":
          targetRef = previewRef;
          break;
        case "code":
          targetRef = codeRef;
          break;
        case "problems":
          targetRef = problemsRef;
          break;
        case "configure":
          targetRef = configureRef;
          break;
        case "publish":
          targetRef = publishRef;
          break;
        default:
          return;
      }

      if (targetRef.current) {
        const button = targetRef.current;
        const container = button.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          const left = buttonRect.left - containerRect.left;
          const width = buttonRect.width;

          setIndicatorStyle({ left, width });
          if (!isPreviewOpen) {
            setIndicatorStyle({ left: left, width: 0 });
          }
        }
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateIndicator, 10);
    return () => clearTimeout(timeoutId);
  }, [previewMode, displayCount, isPreviewOpen, isCompact]);

  const renderButton = (
    mode: PreviewMode,
    ref: React.RefObject<HTMLButtonElement | null>,
    icon: React.ReactNode,
    text: string,
    testId: string,
    badge?: React.ReactNode,
  ) => {
    const buttonContent = (
      <button
        data-testid={testId}
        ref={ref}
        className={BUTTON_CLASS_NAME}
        onClick={() => selectPanel(mode)}
      >
        {icon}
        {!isCompact && <span>{text}</span>}
        {badge}
      </button>
    );

    if (isCompact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  const getModeLabel = (mode: PreviewMode): string => {
    switch (mode) {
      case "preview": return "Preview";
      case "code": return "Code";
      case "problems": return "Problems";
      case "configure": return "Configure";
      case "publish": return "Publish";
      default: return "Preview";
    }
  };

  const getModeIcon = (mode: PreviewMode): React.ReactNode => {
    switch (mode) {
      case "preview": return <Eye size={14} />;
      case "code": return <Code size={14} />;
      case "problems": return <AlertTriangle size={14} />;
      case "configure": return <Wrench size={14} />;
      case "publish": return <Globe size={14} />;
      default: return <Eye size={14} />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-2 py-1 mt-1">
        {isVeryCompact ? (
          // Ultra compact mode: Show dropdown instead of all buttons
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="no-app-region-drag flex items-center gap-1.5 px-2 py-1 rounded-md text-sm glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
              >
                {getModeIcon(previewMode)}
                <span className="text-xs font-medium">{getModeLabel(previewMode)}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => selectPanel("preview")}>
                <Eye size={16} />
                <span>Preview</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => selectPanel("problems")}>
                <AlertTriangle size={16} />
                <div className="flex items-center justify-between flex-1">
                  <span>Problems</span>
                  {displayCount && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                      {displayCount}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => selectPanel("code")}>
                <Code size={16} />
                <span>Code</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => selectPanel("configure")}>
                <Wrench size={16} />
                <span>Configure</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => selectPanel("publish")}>
                <Globe size={16} />
                <span>Publish</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Normal mode: Show all buttons
          <div className="relative flex rounded-2xl p-0.5 gap-0.5 overflow-hidden">
            <motion.div
              className="absolute top-0.5 bottom-0.5 bg-[var(--background-lightest)] shadow rounded-md ring-1 ring-white/20 dark:ring-white/10"
              animate={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
              transition={{
                type: "spring",
                stiffness: 600,
                damping: 35,
                mass: 0.6,
              }}
            />
            {renderButton(
              "preview",
              previewRef,
              <Eye size={14} />,
              "Preview",
              "preview-mode-button",
            )}
            {renderButton(
              "problems",
              problemsRef,
              <AlertTriangle size={14} />,
              "Problems",
              "problems-mode-button",
              displayCount && (
                <span className="ml-0.5 px-1 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full min-w-[16px] text-center">
                  {displayCount}
                </span>
              ),
            )}
            {renderButton(
              "code",
              codeRef,
              <Code size={14} />,
              "Code",
              "code-mode-button",
            )}
            {renderButton(
              "configure",
              configureRef,
              <Wrench size={14} />,
              "Configure",
              "configure-mode-button",
            )}
            {renderButton(
              "publish",
              publishRef,
              <Globe size={14} />,
              "Publish",
              "publish-mode-button",
            )}
          </div>
        )}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="preview-more-options-button"
                className="no-app-region-drag flex items-center justify-center p-1.5 rounded-md text-sm glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 dark:shadow-[0_0_0_3px_rgba(255,255,255,.06)]"
                title="More options"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onClick={onCleanRestart}>
                <Cog size={16} />
                <div className="flex flex-col">
                  <span>Rebuild</span>
                  <span className="text-xs text-muted-foreground">
                    Re-installs node_modules and restarts
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClearSessionData}>
                <Trash2 size={16} />
                <div className="flex flex-col">
                  <span>Clear Cache</span>
                  <span className="text-xs text-muted-foreground">
                    Clears cookies and local storage and other app cache
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
};
