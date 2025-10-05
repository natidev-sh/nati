import type React from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Database,
  Loader,
  CircleX,
} from "lucide-react";
import { CodeHighlight } from "./CodeHighlight";
import { CustomTagState } from "./stateTypes";

interface DyadExecuteSqlProps {
  children?: ReactNode;
  node?: any;
  description?: string;
}

export const DyadExecuteSql: React.FC<DyadExecuteSqlProps> = ({
  children,
  node,
  description,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const state = node?.properties?.state as CustomTagState;
  const inProgress = state === "pending";
  const aborted = state === "aborted";
  const queryDescription = description || node?.properties?.description;

  return (
    <div
      className={`my-2 rounded-2xl glass-surface border shadow-sm ring-1 px-3 sm:px-4 py-3 cursor-pointer ${
        inProgress
          ? "border-amber-500 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.18)]"
          : aborted
            ? "border-red-500 ring-red-400/40 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_0_16px_rgba(248,113,113,0.18)] border-2"
            : "border-border"
      }`}
      onClick={() => setIsContentVisible(!isContentVisible)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Database size={16} className="glass-contrast-text" />
          <span className="glass-contrast-text font-medium text-sm truncate">
            <span className="mr-2 px-1 rounded-md border glass-contrast-text/70 text-[10px]">SQL</span>
            {queryDescription}
          </span>
          {inProgress && (
            <div className="flex items-center text-amber-600 text-xs">
              <Loader size={14} className="ml-1 animate-spin" />
              <span className="ml-1">Executing...</span>
            </div>
          )}
          {aborted && (
            <div className="flex items-center text-red-600 text-xs">
              <CircleX size={14} className="ml-1" />
              <span className="ml-1">Did not finish</span>
            </div>
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
      {isContentVisible && (
        <div className="mt-2 text-xs">
          <CodeHighlight className="language-sql">{children}</CodeHighlight>
        </div>
      )}
    </div>
  );
};
