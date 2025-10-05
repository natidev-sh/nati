import React, { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp, Loader } from "lucide-react";
import { VanillaMarkdownParser } from "./DyadMarkdownParser";
import { CustomTagState } from "./stateTypes";
import { DyadTokenSavings } from "./DyadTokenSavings";

interface DyadThinkProps {
  node?: any;
  children?: React.ReactNode;
}

export const DyadThink: React.FC<DyadThinkProps> = ({ children, node }) => {
  const state = node?.properties?.state as CustomTagState;
  const inProgress = state === "pending";
  const [isExpanded, setIsExpanded] = useState(inProgress);

  // Check if content matches token savings format
  const tokenSavingsMatch =
    typeof children === "string"
      ? children.match(
          /^dyad-token-savings\?original-tokens=([0-9.]+)&smart-context-tokens=([0-9.]+)$/,
        )
      : null;

  // If it's token savings format, render DyadTokenSavings component
  if (tokenSavingsMatch) {
    const originalTokens = parseFloat(tokenSavingsMatch[1]);
    const smartContextTokens = parseFloat(tokenSavingsMatch[2]);
    return (
      <DyadTokenSavings
        originalTokens={originalTokens}
        smartContextTokens={smartContextTokens}
      />
    );
  }

  // Collapse when transitioning from in-progress to not-in-progress
  useEffect(() => {
    if (!inProgress && isExpanded) {
      setIsExpanded(false);
    }
  }, [inProgress]);

  return (
    <div
      className={`relative my-2 rounded-2xl glass-surface border shadow-sm ring-1 px-3 sm:px-4 py-3 cursor-pointer ${
        inProgress
          ? "border-violet-500 ring-violet-400/40 shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_0_16px_rgba(167,139,250,0.18)]"
          : "border-border"
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      aria-expanded={isExpanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {/* Top-left label badge */}
      <div
        className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-violet-600 dark:text-violet-400 bg-white/90 dark:bg-black/50 backdrop-blur-sm border border-white/60 dark:border-white/10"
        style={{ zIndex: 1 }}
      >
        <Brain size={16} className="text-violet-600 dark:text-violet-400" />
        <span>Thinking</span>
        {inProgress && (
          <Loader size={14} className="ml-1 text-violet-600 dark:text-violet-400 animate-spin" />
        )}
      </div>

      {/* Indicator icon */}
      <button
        type="button"
        aria-label={isExpanded ? "Collapse" : "Expand"}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-gray-500"
        style={{ zIndex: 1 }}
      >
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Main content with smooth transition */}
      <div
        className="pt-6 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? "none" : "0px",
          opacity: isExpanded ? 1 : 0,
          marginBottom: isExpanded ? "0" : "-6px",
        }}
      >
        <div className="px-0 text-sm glass-contrast-text">
          {typeof children === "string" ? (
            <VanillaMarkdownParser content={children} />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};
