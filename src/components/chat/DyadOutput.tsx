import React, { useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { useStreamChat } from "@/hooks/useStreamChat";
interface DyadOutputProps {
  type: "error" | "warning";
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

  // If the type is not warning, it is an error (in case LLM gives a weird "type")
  const isError = type !== "warning";
  const borderColor = isError
    ? "border-red-500 ring-red-400/40 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_0_16px_rgba(248,113,113,0.18)] border-2"
    : "border-amber-500 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.18)]";
  const iconColor = isError ? "text-red-500" : "text-amber-500";
  const icon = isError ? (
    <XCircle size={16} className={iconColor} />
  ) : (
    <AlertTriangle size={16} className={iconColor} />
  );
  const label = isError ? "Error" : "Warning";

  const handleAIFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message && selectedChatId) {
      streamMessage({
        prompt: `Fix the error: ${message}`,
        chatId: selectedChatId,
      });
    }
  };

  return (
    <div
      className={`relative my-2 rounded-2xl glass-surface border shadow-sm ring-1 px-3 sm:px-4 py-3 cursor-pointer min-h-18 ${borderColor}`}
      onClick={() => setIsContentVisible(!isContentVisible)}
    >
      {/* Top-left label badge */}
      <div
        className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${iconColor} bg-white/90 dark:bg-black/50 backdrop-blur-sm border border-white/60 dark:border-white/10`}
        style={{ zIndex: 1 }}
      >
        {icon}
        <span>{label}</span>
      </div>

      {/* Fix with AI button - always visible for errors */}
      {isError && message && (
        <div className="absolute top-9 left-2">
          <button
            onClick={handleAIFix}
            className="cursor-pointer flex items-center justify-center bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md text-xs px-2 w-28 h-6 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
          >
            <Sparkles size={16} className="mr-1" />
            <span>Fix with AI</span>
          </button>
        </div>
      )}

      {/* Main content, padded to avoid label */}
      <div className={`flex items-start justify-between ${isError ? "pl-36" : "pl-24"} pr-10 sm:pr-12`}>
        <div className="flex-1 min-w-0">
          {message && (
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm break-words">
              {message.slice(0, isContentVisible ? undefined : 100) +
                (!isContentVisible ? "..." : "")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsContentVisible(!isContentVisible);
          }}
          className="ml-2 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
        >
          {isContentVisible ? (
            <ChevronsDownUp size={20} className="glass-contrast-text" />
          ) : (
            <ChevronsUpDown size={20} className="glass-contrast-text" />
          )}
        </button>
      </div>

      {/* Content area */}
      {isContentVisible && children && (
        <div className="mt-4 pl-20 sm:pl-24 text-sm glass-contrast-text">
          {children}
        </div>
      )}
    </div>
  );
};
