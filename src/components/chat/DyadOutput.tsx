import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  AlertTriangle,
  XCircle,
  Sparkles,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { useStreamChat } from "@/hooks/useStreamChat";
import { isPreviewOpenAtom, selectedFileAtom } from "@/atoms/viewAtoms";
import { previewModeAtom } from "@/atoms/appAtoms";
import { showOpened } from "@/lib/toast";
interface DyadOutputProps {
  type: "error" | "warning" | "info";
  message?: string;
  children?: React.ReactNode;
}

export const DyadOutput: React.FC<DyadOutputProps> = ({
  type,
  message,
  children,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const selectedChatId = useAtomValue(selectedChatIdAtom);
  const { streamMessage } = useStreamChat();
  const [copied, setCopied] = useState(false);
  const detailsText = typeof children === "string" ? children : "";
  const setSelectedFile = useSetAtom(selectedFileAtom);
  const setPreviewOpen = useSetAtom(isPreviewOpenAtom);
  const setPreviewMode = useSetAtom(previewModeAtom);

  // If the type is not warning, it is an error (in case LLM gives a weird "type")
  const isError = type === "error";
  const isWarning = type === "warning";
  const isInfo = type === "info";
  const palette = isError
    ? {
        border: "border-red-500 ring-red-400/40 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_0_16px_rgba(248,113,113,0.18)] border-2",
        icon: "text-red-500",
        label: "Error",
      }
    : isWarning
    ? {
        border: "border-amber-500 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.18)]",
        icon: "text-amber-500",
        label: "Warning",
      }
    : {
        border: "border-sky-500 ring-sky-400/40 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_16px_rgba(56,189,248,0.18)]",
        icon: "text-sky-500",
        label: "Info",
      };
  const icon = isError ? (
    <XCircle size={16} className={palette.icon} />
  ) : isWarning ? (
    <AlertTriangle size={16} className={palette.icon} />
  ) : (
    <Info size={16} className={palette.icon} />
  );
  const label = palette.label;
  const borderColor = palette.border;

  const handleAIFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message && selectedChatId) {
      streamMessage({
        prompt: `Fix the error: ${message}`,
        chatId: selectedChatId,
      });
    }
  };

  const handleExplain = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedChatId) {
      const details = detailsText ? `\n\nDetails:\n\n\`\`\`\n${detailsText.slice(0, 6000)}\n\`\`\`` : "";
      const prompt = `Explain this ${type} in plain English, likely causes, and concrete steps to fix.${details ? "" : " Keep it concise."}\n\nSummary: ${message ?? ""}${details}`;
      streamMessage({ prompt, chatId: selectedChatId });
    }
  };

  const openFileInPreview = (path: string, line?: number, column?: number) => {
    if (!path) return;
    setSelectedFile({ path, line, column } as any);
    try { setPreviewMode("code" as any); } catch {}
    setPreviewOpen(true);
    try { window.dispatchEvent(new CustomEvent("filetree:focus", { detail: { path } })); } catch {}
    try { showOpened(path, "file", { source: "chat" }); } catch {}
  };

  const fileMatches = useMemo(() => {
    const out: { path: string; line?: number; column?: number }[] = [];
    const text = `${message ?? ""}\n${detailsText ?? ""}`;
    if (!text) return out;
    const win = /([A-Za-z]:\\[^\s:]+\.[a-zA-Z0-9]+)(?::(\d+))?(?::(\d+))?/g;
    const nix = /(\/[\w@\-\.\s\/]+\.[a-zA-Z0-9]+)(?::(\d+))?(?::(\d+))?/g;
    let m: RegExpExecArray | null;
    const push = (p: string, ln?: string, col?: string) => {
      if (!out.find((x) => x.path === p && String(x.line||"") === String(ln||"") && String(x.column||"") === String(col||""))) {
        out.push({ path: p, line: ln ? Number(ln) : undefined, column: col ? Number(col) : undefined });
      }
    };
    while ((m = win.exec(text)) !== null) push(m[1], m[2], m[3]);
    while ((m = nix.exec(text)) !== null) push(m[1], m[2], m[3]);
    return out.slice(0, 5);
  }, [message, detailsText]);

  const seenKey = useMemo(() => (isError && message ? `${type}:${message.slice(0, 200)}:${(detailsText||'').slice(0,200)}` : null), [isError, type, message, detailsText]);
  useEffect(() => {
    if (!seenKey) return;
    if (!(window as any).__dyad_seen_errors) (window as any).__dyad_seen_errors = new Set<string>();
    const seen: Set<string> = (window as any).__dyad_seen_errors;
    if (!seen.has(seenKey)) {
      setIsContentVisible(true);
      seen.add(seenKey);
    }
  }, [seenKey]);

  return (
    <div
      className={`relative my-2 rounded-2xl glass-surface border shadow-sm ring-1 px-3 sm:px-4 py-3 cursor-pointer min-h-18 ${borderColor}`}
      onClick={() => setIsContentVisible(!isContentVisible)}
    >
      {/* Top-left label badge */}
      <div
        className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${palette.icon} bg-white/90 dark:bg-black/50 backdrop-blur-sm border border-white/60 dark:border-white/10`}
        style={{ zIndex: 1 }}
      >
        {icon}
        <span>{label}</span>
      </div>

      {(isError || isWarning) && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isError && message && (
            <button
              onClick={handleAIFix}
              className="cursor-pointer inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-red-600/90 hover:bg-red-600 text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
              title="Fix with AI"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Fix</span>
            </button>
          )}
          <button
            onClick={handleExplain}
            className="cursor-pointer inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white/70 hover:bg-white/90 text-gray-900 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white shadow-sm outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
            title="Explain"
          >
            <Info size={14} />
            <span className="hidden sm:inline">Explain</span>
          </button>
        </div>
      )}

      {/* Main content, padded to avoid label */}
      <div className={`flex items-start justify-between ${isError ? "pl-28" : "pl-24"} pr-10 sm:pr-12`}>
        <div className="flex-1 min-w-0">
          {message && (
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm break-words">
              {message.slice(0, isContentVisible ? undefined : 100) +
                (!isContentVisible ? "..." : "")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {detailsText && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  navigator.clipboard.writeText(detailsText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                } catch {}
              }}
              className="h-8 px-2 inline-flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-xs"
              title="Copy details"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsContentVisible(!isContentVisible);
            }}
            className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
          >
            {isContentVisible ? (
              <ChevronsDownUp size={20} className="glass-contrast-text" />
            ) : (
              <ChevronsUpDown size={20} className="glass-contrast-text" />
            )}
          </button>
        </div>
      </div>

      {isContentVisible && children && (
        <div className="mt-3 pl-20 sm:pl-24 space-y-2">
          {fileMatches.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {fileMatches.map((f) => (
                <button
                  key={`${f.path}:${f.line || 0}:${f.column || 0}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileInPreview(f.path, f.line, f.column);
                  }}
                  className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md border glass-surface text-xs hover:bg-white/10"
                  title={`${f.path}${f.line ? ":" + f.line : ""}${f.column ? ":" + f.column : ""}`}
                >
                  <span className="font-mono truncate max-w-[280px]">{f.path}{f.line ? `:${f.line}` : ""}{f.column ? `:${f.column}` : ""}</span>
                </button>
              ))}
            </div>
          )}
          <pre className="max-h-72 overflow-auto rounded-lg bg-black/80 text-white/90 text-xs leading-relaxed p-3 ring-1 ring-white/10">
            <code>{detailsText || (children as any)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
