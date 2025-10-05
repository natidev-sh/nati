import type React from "react";
import type { ReactNode } from "react";
import { FileEdit } from "lucide-react";

interface DyadRenameProps {
  children?: ReactNode;
  node?: any;
  from?: string;
  to?: string;
}

export const DyadRename: React.FC<DyadRenameProps> = ({
  children,
  node,
  from: fromProp,
  to: toProp,
}) => {
  // Use props directly if provided, otherwise extract from node
  const from = fromProp || node?.properties?.from || "";
  const to = toProp || node?.properties?.to || "";

  // Extract filenames from paths
  const fromFileName = from ? from.split("/").pop() : "";
  const toFileName = to ? to.split("/").pop() : "";

  return (
    <div className="my-2 rounded-2xl glass-surface border shadow-sm ring-1 ring-amber-400/40 border-amber-500/60 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.18)] px-4 py-2">
      <div className="flex items-center gap-2">
        <FileEdit size={16} className="text-amber-600 dark:text-amber-400" />
        {(fromFileName || toFileName) && (
          <span className="glass-contrast-text font-medium text-sm">
            {fromFileName && toFileName
              ? `${fromFileName} → ${toFileName}`
              : fromFileName || toFileName}
          </span>
        )}
        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Rename</div>
      </div>
      {(from || to) && (
        <div className="flex flex-col text-xs glass-contrast-text/70 font-medium mb-1 mt-1">
          {from && (
            <div>
              <span className="opacity-80">From:</span> <span className="font-mono break-all">{from}</span>
            </div>
          )}
          {to && (
            <div>
              <span className="opacity-80">To:</span> <span className="font-mono break-all">{to}</span>
            </div>
          )}
        </div>
      )}
      <div className="text-sm glass-contrast-text mt-2">{children}</div>
    </div>
  );
};
