import type React from "react";
import type { ReactNode } from "react";
import { Globe } from "lucide-react";

interface DyadWebSearchProps {
  children?: ReactNode;
  node?: any;
  query?: string;
}

export const DyadWebSearch: React.FC<DyadWebSearchProps> = ({
  children,
  node: _node,
  query: queryProp,
}) => {
  const query = queryProp || (typeof children === "string" ? children : "");

  return (
    <div className="my-2 rounded-2xl glass-surface border shadow-sm ring-1 ring-sky-400/40 border-sky-500/60 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_0_16px_rgba(56,189,248,0.18)] px-4 py-2">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-sky-600" />
        <div className="text-xs text-sky-700 dark:text-sky-300 font-medium">Web Search</div>
      </div>
      <div className="text-sm italic glass-contrast-text mt-2">{query || children}</div>
    </div>
  );
};
