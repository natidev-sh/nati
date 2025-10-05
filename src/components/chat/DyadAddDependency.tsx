import type React from "react";
import type { ReactNode } from "react";
import { useState } from "react";

import { IpcClient } from "../../ipc/ipc_client";

import { Package, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { CodeHighlight } from "./CodeHighlight";

interface DyadAddDependencyProps {
  children?: ReactNode;
  node?: any;
  packages?: string;
}

export const DyadAddDependency: React.FC<DyadAddDependencyProps> = ({
  children,
  node,
}) => {
  // Extract package attribute from the node if available
  const packages = node?.properties?.packages?.split(" ") || "";
  const [isContentVisible, setIsContentVisible] = useState(false);
  const hasChildren = !!children;

  return (
    <div
      className={`my-2 rounded-2xl glass-surface border shadow-sm px-4 py-3 select-none ring-1 ring-sky-400/40 border-sky-400/50 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_16px_rgba(56,189,248,0.18)] ${
        hasChildren ? "" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="glass-contrast-text opacity-80" />
            <div className="text-sm font-medium glass-contrast-text">Add dependency</div>
          </div>
          {packages.length > 0 && (
            <div className="text-xs glass-contrast-text/80">
              <div>Do you want to install these packages?</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {packages.map((p: string) => (
                  <button
                    key={p}
                    onClick={() =>
                      IpcClient.getInstance().openExternalUrl(
                        `https://www.npmjs.com/package/${p}`,
                      )
                    }
                    className="px-2 py-1 rounded-full glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-xs font-mono"
                    title={`Open ${p} on npmjs.com`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {hasChildren && (
          <button
            type="button"
            aria-label={isContentVisible ? "Hide install command" : "Show install command"}
            aria-expanded={isContentVisible}
            onClick={() => setIsContentVisible(!isContentVisible)}
            className="h-8 w-8 flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
          >
            {isContentVisible ? (
              <ChevronsDownUp size={18} className="glass-contrast-text" />
            ) : (
              <ChevronsUpDown size={18} className="glass-contrast-text" />
            )}
          </button>
        )}
      </div>

      {packages.length > 0 && (
        <div className="text-[11px] glass-contrast-text/70 mt-1">
          Make sure these packages are what you want.
        </div>
      )}

      {/* Show content if it's visible and has children */}
      {isContentVisible && hasChildren && (
        <div className="mt-3 select-text">
          <div className="text-xs">
            <CodeHighlight className="language-shell">{children}</CodeHighlight>
          </div>
        </div>
      )}
    </div>
  );
};
