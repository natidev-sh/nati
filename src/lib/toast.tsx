import { toast } from "sonner";
import { PostHog } from "posthog-js";
import React from "react";
import { File as FileIcon, Folder as FolderIcon, CheckCircle2, Info as InfoIcon, AlertTriangle, MessageSquare } from "lucide-react";
import { CustomErrorToast } from "../components/CustomErrorToast";
import { InputRequestToast } from "../components/InputRequestToast";
import { McpConsentToast } from "../components/McpConsentToast";

/**
 * Toast utility functions for consistent notifications across the app
 */

/**
 * Show a success toast
 * @param message The message to display
 */
export const showSuccess = (message: string) => {
  toast.custom((t) => (
    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl glass-surface border ring-1 ring-white/20 dark:ring-white/10 px-3 py-2 shadow-md">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span className="text-sm">{message}</span>
    </div>
  ), { duration: 1500 });
};

/** Tiny toast: "Opened <path>" with icon */
// Coalescing batch state for showOpened
let __openedTimer: any = null;
let __openedCount = 0;
let __openedPath = "";
let __openedKind: "file" | "folder" = "file";
let __openedSource: "chat" | "other" = "other";

export const showOpened = (
  path: string,
  kind: "file" | "folder" = "file",
  opts?: { source?: "chat" | "other" }
) => {
  __openedPath = path;
  __openedKind = kind;
  __openedSource = opts?.source === "chat" ? "chat" : "other";
  __openedCount++;
  if (__openedTimer) clearTimeout(__openedTimer);
  __openedTimer = setTimeout(() => {
    const Icon = __openedKind === "folder" ? FolderIcon : FileIcon;
    const truncate = (p: string) => (p.length > 60 ? `…${p.slice(-59)}` : p);
    const count = __openedCount;
    const source = __openedSource;
    __openedCount = 0;
    __openedTimer = null;
    toast.custom(() => (
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl glass-surface border ring-1 ring-white/20 dark:ring-white/10 px-3 py-1.5 shadow-md">
        <Icon className="h-4 w-4 text-(--primary)" />
        {count > 1 ? (
          <span className="text-sm">Opened {count} items</span>
        ) : (
          <span className="text-sm">Opened <code className="font-mono text-[12px]">{truncate(__openedPath)}</code></span>
        )}
        {source === "chat" && (
          <span className="inline-flex items-center gap-1 text-[11px] opacity-70 ml-1"><MessageSquare className="h-3 w-3" /> from chat</span>
        )}
      </div>
    ), { duration: 1400 });
  }, 300);
};

/**
 * Show an error toast
 * @param message The error message to display
 */
export const showError = (message: any) => {
  const errorMessage = message.toString();
  console.error(message);

  const onCopy = (toastId: string | number) => {
    navigator.clipboard.writeText(errorMessage);

    // Update the toast to show the 'copied' state
    toast.custom(
      (t) => (
        <CustomErrorToast
          message={errorMessage}
          toastId={t}
          copied={true}
          onCopy={() => onCopy(t)}
        />
      ),
      { id: toastId, duration: Infinity },
    );

    // After 2 seconds, revert the toast back to the original state
    setTimeout(() => {
      toast.custom(
        (t) => (
          <CustomErrorToast
            message={errorMessage}
            toastId={t}
            copied={false}
            onCopy={() => onCopy(t)}
          />
        ),
        { id: toastId, duration: Infinity },
      );
    }, 2000);
  };

  // Use custom error toast with enhanced features
  const toastId = toast.custom(
    (t) => (
      <CustomErrorToast
        message={errorMessage}
        toastId={t}
        onCopy={() => onCopy(t)}
      />
    ),
    { duration: 8_000 },
  );

  return toastId;
};

/**
 * Show a warning toast
 * @param message The warning message to display
 */
export const showWarning = (message: string) => {
  console.warn(message);
  toast.custom(() => (
    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl glass-surface border ring-1 ring-white/20 dark:ring-white/10 px-3 py-2 shadow-md">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <span className="text-sm">{message}</span>
    </div>
  ), { duration: 2000 });
};

/**
 * Show an info toast
 * @param message The info message to display
 */
export const showInfo = (message: string) => {
  toast.custom(() => (
    <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl glass-surface border ring-1 ring-white/20 dark:ring-white/10 px-3 py-2 shadow-md">
      <InfoIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
      <span className="text-sm">{message}</span>
    </div>
  ), { duration: 1500 });
};

/** Action toast with button */
export const showAction = (message: string, actionLabel: string, onClick: () => void) => {
  const id = Math.random().toString(36).slice(2);
  toast.custom(() => (
    <div className="pointer-events-auto inline-flex items-center gap-3 rounded-xl glass-surface border ring-1 ring-white/20 dark:ring-white/10 px-3 py-2 shadow-md">
      <InfoIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
      <span className="text-sm">{message}</span>
      <button
        className="ml-2 px-2 py-1 text-xs rounded-md glass-button glass-hover glass-active"
        onClick={() => { try { onClick(); } finally { toast.dismiss(id as any); } }}
      >
        {actionLabel}
      </button>
    </div>
  ), { id: id as any, duration: 3000 });
};

/**
 * Show an input request toast for interactive prompts (y/n)
 * @param message The prompt message to display
 * @param onResponse Callback function called when user responds
 */
export const showInputRequest = (
  message: string,
  onResponse: (response: "y" | "n") => void,
) => {
  const toastId = toast.custom(
    (t) => (
      <InputRequestToast
        message={message}
        toastId={t}
        onResponse={onResponse}
      />
    ),
    { duration: Infinity }, // Don't auto-close
  );

  return toastId;
};

export function showMcpConsentToast(args: {
  serverName: string;
  toolName: string;
  toolDescription?: string | null;
  inputPreview?: string | null;
  onDecision: (d: "accept-once" | "accept-always" | "decline") => void;
}) {
  const toastId = toast.custom(
    (t) => (
      <McpConsentToast
        toastId={t}
        serverName={args.serverName}
        toolName={args.toolName}
        toolDescription={args.toolDescription}
        inputPreview={args.inputPreview}
        onDecision={args.onDecision}
      />
    ),
    { duration: Infinity },
  );
  return toastId;
}

export const showExtraFilesToast = ({
  files,
  error,
  posthog,
}: {
  files: string[];
  error?: string;
  posthog: PostHog;
}) => {
  if (error) {
    showError(
      `Error committing files ${files.join(", ")} changed outside of Nati: ${error}`,
    );
    posthog.capture("extra-files:error", {
      files: files,
      error,
    });
  } else {
    showWarning(
      `Files changed outside of Nati have automatically been committed:
    \n\n${files.join("\n")}`,
    );
    posthog.capture("extra-files:warning", {
      files: files,
    });
  }
};

// Re-export for direct use
export { toast };
