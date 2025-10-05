import type React from "react";
import type { ReactNode } from "react";
import { FileText } from "lucide-react";

interface DyadReadProps {
  children?: ReactNode;
  node?: any;
  path?: string;
}

export const DyadRead: React.FC<DyadReadProps> = ({
  children,
  node,
  path: pathProp,
}) => {
  const path = pathProp || node?.properties?.path || "";
  const fileName = path ? path.split("/").pop() : "";

  return (
    <div className="my-2 rounded-2xl glass-surface border shadow-sm ring-1 ring-sky-400/40 border-sky-500/60 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_16px_rgba(56,189,248,0.18)] px-4 py-2">
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-sky-600" />
        {fileName && (
          <span className="glass-contrast-text font-medium text-sm">{fileName}</span>
        )}
        <div className="text-xs text-sky-700 dark:text-sky-300 font-medium">Read</div>
      </div>
      {path && (
        <div className="text-xs glass-contrast-text/70 font-medium mb-1 font-mono break-all whitespace-pre-wrap">
          {path}
        </div>
      )}
      {children && (
        <div className="text-sm glass-contrast-text mt-2">{children}</div>
      )}
    </div>
  );
};
