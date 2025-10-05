import React, { useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  AlertTriangle,
  FileText,
} from "lucide-react";
import type { Problem } from "@/ipc/ipc_types";

type ProblemWithoutSnippet = Omit<Problem, "snippet">;

interface DyadProblemSummaryProps {
  summary?: string;
  children?: React.ReactNode;
}

interface ProblemItemProps {
  problem: ProblemWithoutSnippet;
  index: number;
}

const ProblemItem: React.FC<ProblemItemProps> = ({ problem, index }) => {
  return (
    <div className="flex items-start gap-3 py-2 px-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mt-0.5">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {index + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {problem.file}
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {problem.line}:{problem.column}
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
            TS{problem.code}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {problem.message}
        </p>
      </div>
    </div>
  );
};

export const DyadProblemSummary: React.FC<DyadProblemSummaryProps> = ({
  summary,
  children,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Parse problems from children content if available
  const problems: ProblemWithoutSnippet[] = React.useMemo(() => {
    if (!children || typeof children !== "string") return [];

    // Parse structured format with <problem> tags
    const problemTagRegex =
      /<problem\s+file="([^"]+)"\s+line="(\d+)"\s+column="(\d+)"\s+code="(\d+)">([^<]+)<\/problem>/g;
    const problems: ProblemWithoutSnippet[] = [];
    let match;

    while ((match = problemTagRegex.exec(children)) !== null) {
      try {
        problems.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          message: match[5].trim(),
          code: parseInt(match[4], 10),
        });
      } catch {
        return [
          {
            file: "unknown",
            line: 0,
            column: 0,
            message: children,
            code: 0,
          },
        ];
      }
    }

    return problems;
  }, [children]);

  const totalProblems = problems.length;
  const displaySummary =
    summary || `${totalProblems} problems found (TypeScript errors)`;

  return (
    <div
      className="my-2 rounded-2xl glass-surface border shadow-sm ring-1 ring-amber-400/40 border-amber-500/60 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.18)] px-4 py-3"
      data-testid="problem-summary"
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsContentVisible(!isContentVisible)}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-500" />
          <span className="glass-contrast-text font-medium text-sm">
            <span className="font-bold mr-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-md px-1">
              Auto-fix
            </span>
            {displaySummary}
          </span>
        </div>
        <button
          type="button"
          aria-label={isContentVisible ? "Hide details" : "Show details"}
          className="h-8 w-8 flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
        >
          {isContentVisible ? (
            <ChevronsDownUp size={20} className="glass-contrast-text" />
          ) : (
            <ChevronsUpDown size={20} className="glass-contrast-text" />
          )}
        </button>
      </div>

      {/* Content area - show individual problems */}
      {isContentVisible && totalProblems > 0 && (
        <div className="mt-3">
          <div className="rounded-xl glass-surface border overflow-hidden">
            {problems.map((problem, index) => (
              <ProblemItem
                key={`${problem.file}-${problem.line}-${problem.column}-${index}`}
                problem={problem}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback content area for raw children */}
      {isContentVisible && totalProblems === 0 && children && (
        <div className="mt-3 text-sm glass-contrast-text">
          <pre className="whitespace-pre-wrap font-mono text-xs glass-surface border p-3 rounded-xl">
            {children}
          </pre>
        </div>
      )}
    </div>
  );
};
