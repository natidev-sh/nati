import React from "react";
import { Zap } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

interface DyadTokenSavingsProps {
  originalTokens: number;
  smartContextTokens: number;
}

export const DyadTokenSavings: React.FC<DyadTokenSavingsProps> = ({
  originalTokens,
  smartContextTokens,
}) => {
  const tokensSaved = originalTokens - smartContextTokens;
  const percentageSaved = Math.round((tokensSaved / originalTokens) * 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="my-2 rounded-2xl glass-surface border shadow-sm ring-1 ring-emerald-400/40 border-emerald-500/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_16px_rgba(16,185,129,0.18)] px-4 py-2 cursor-pointer select-none">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium glass-contrast-text">
              Saved {percentageSaved}% of codebase tokens with Smart Context
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        <div className="text-left">
          Saved {Math.round(tokensSaved).toLocaleString()} tokens
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
