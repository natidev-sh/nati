import React, { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCountTokens } from "@/hooks/useCountTokens";
import {
  MessageSquare,
  Code,
  Bot,
  AlignLeft,
  ExternalLink,
} from "lucide-react";
import { chatInputValueAtom } from "@/atoms/chatAtoms";
import { useAtom } from "jotai";
import { useSettings } from "@/hooks/useSettings";
import { IpcClient } from "@/ipc/ipc_client";

interface TokenBarProps {
  chatId?: number;
}

export function TokenBar({ chatId }: TokenBarProps) {
  const [inputValue] = useAtom(chatInputValueAtom);
  const { countTokens, result } = useCountTokens();
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  useEffect(() => {
    if (!chatId) return;
    // Mark this as used, we need to re-trigger token count
    // when selected model changes.
    void settings?.selectedModel;

    const debounceTimer = setTimeout(() => {
      countTokens(chatId, inputValue).catch((err) => {
        setError("Failed to count tokens");
        console.error("Token counting error:", err);
      });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [chatId, inputValue, countTokens, settings?.selectedModel]);

  if (!chatId || !result) {
    return null;
  }

  const {
    totalTokens,
    messageHistoryTokens,
    codebaseTokens,
    mentionedAppsTokens,
    systemPromptTokens,
    inputTokens,
    contextWindow,
  } = result;

  const percentUsed = Math.min((totalTokens / contextWindow) * 100, 100);

  // Calculate widths for each token type
  const messageHistoryPercent = (messageHistoryTokens / contextWindow) * 100;
  const codebasePercent = (codebaseTokens / contextWindow) * 100;
  const mentionedAppsPercent = (mentionedAppsTokens / contextWindow) * 100;
  const systemPromptPercent = (systemPromptTokens / contextWindow) * 100;
  const inputPercent = (inputTokens / contextWindow) * 100;

  return (
    <div className="px-3 pb-2 text-xs">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              {/* Header chips */}
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg glass-surface border text-gray-700 dark:text-gray-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] opacity-80">Tokens</span>
                  <span className="font-semibold ml-1">{totalTokens.toLocaleString()}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg glass-surface border text-gray-700 dark:text-gray-100">
                  <span className="text-[11px] opacity-80">Context</span>
                  <span className="font-semibold ml-1">{Math.round(percentUsed)}%</span>
                  <span className="opacity-70 ml-1">of {(contextWindow / 1000).toFixed(0)}K</span>
                </span>
              </div>

              {/* Progress rail */}
              <div className="w-full h-2 rounded-full overflow-hidden flex glass-surface border bg-white/70 dark:bg-white/5">
                {/* Message history tokens */}
                <div
                  className="h-full bg-blue-500/80 transition-[width] duration-300"
                  style={{ width: `${messageHistoryPercent}%` }}
                />
                {/* Codebase tokens */}
                <div
                  className="h-full bg-emerald-500/80 transition-[width] duration-300"
                  style={{ width: `${codebasePercent}%` }}
                />
                {/* Mentioned apps tokens */}
                <div
                  className="h-full bg-orange-500/80 transition-[width] duration-300"
                  style={{ width: `${mentionedAppsPercent}%` }}
                />
                {/* System prompt tokens */}
                <div
                  className="h-full bg-violet-500/80 transition-[width] duration-300"
                  style={{ width: `${systemPromptPercent}%` }}
                />
                {/* Input tokens */}
                <div
                  className="h-full bg-yellow-500/80 transition-[width] duration-300"
                  style={{ width: `${inputPercent}%` }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={2} className="w-72 p-2 rounded-xl border shadow-xl backdrop-blur-md bg-white/95 dark:bg-black/80 text-gray-800 dark:text-gray-100">
            <div className="space-y-1">
              <div className="font-semibold tracking-tight">Token Usage Breakdown</div>
              <div className="grid grid-cols-[20px_1fr_auto] gap-x-2 items-center text-[12px]">
                <MessageSquare size={12} className="text-blue-500" />
                <span className="opacity-90">Message History</span>
                <span>{messageHistoryTokens.toLocaleString()}</span>

                <Code size={12} className="text-emerald-500" />
                <span className="opacity-90">Codebase</span>
                <span>{codebaseTokens.toLocaleString()}</span>

                <ExternalLink size={12} className="text-orange-500" />
                <span className="opacity-90">Mentioned Apps</span>
                <span>{mentionedAppsTokens.toLocaleString()}</span>

                <Bot size={12} className="text-violet-500" />
                <span className="opacity-90">System Prompt</span>
                <span>{systemPromptTokens.toLocaleString()}</span>

                <AlignLeft size={12} className="text-yellow-500" />
                <span className="opacity-90">Current Input</span>
                <span>{inputTokens.toLocaleString()}</span>
              </div>
              <div className="pt-1 border-t border-border/70">
                <div className="flex justify-between font-medium">
                  <span className="opacity-90">Total</span>
                  <span>{totalTokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      {(!settings?.enableProSmartFilesContextMode ||
        !settings?.enableDyadPro) && (
        <div className="text-xs text-center text-muted-foreground mt-2">
          Optimize your tokens with{" "}
          <a
            onClick={() =>
              settings?.enableDyadPro
                ? IpcClient.getInstance().openExternalUrl(
                    "https://www.dyad.sh/docs/guides/ai-models/pro-modes#smart-context",
                  )
                : IpcClient.getInstance().openExternalUrl(
                    "https://natidev.com/pro#ai",
                  )
            }
            className="text-blue-500 dark:text-blue-400 cursor-pointer hover:underline"
          >
            Nati Pro's Smart Context
          </a>
        </div>
      )}
    </div>
  );
}
