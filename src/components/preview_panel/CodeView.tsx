import { FileEditor } from "./FileEditor";
import { FileTree } from "./FileTree";
import { RefreshCw } from "lucide-react";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useAtomValue } from "jotai";
import { useMemo, useState, useEffect } from "react";
import { selectedFileAtom } from "@/atoms/viewAtoms";

interface App {
  id?: number;
  files?: string[];
}

export interface CodeViewProps {
  loading: boolean;
  app: App | null;
}

// Code view component that displays app files or status messages
export const CodeView = ({ loading, app }: CodeViewProps) => {
  const selectedFile = useAtomValue(selectedFileAtom);
  const { refreshApp } = useLoadApp(app?.id ?? null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  if (loading) {
    return <div className="text-center py-4">Loading files...</div>;
  }

  if (!app) {
    return (
      <div className="text-center py-4 text-gray-500">No app selected</div>
    );
  }

  if (app.files && app.files.length > 0) {
    const filteredFiles = useMemo(() => {
      const query = debouncedQ.trim().toLowerCase();
      if (!query) return app.files!;
      const tokens = query.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return app.files!;
      const isSubsequence = (text: string, needle: string) => {
        let i = 0;
        for (let c of text) {
          if (c === needle[i]) i++;
          if (i === needle.length) return true;
        }
        return false;
      };
      const matchesFuzzy = (path: string) => {
        const p = path.toLowerCase();
        return tokens.every((tok) => isSubsequence(p, tok));
      };
      return app.files!.filter((f) => matchesFuzzy(f));
    }, [app.files, debouncedQ]);
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center p-2 mb-2 gap-2 glass-surface border shadow-sm rounded-2xl ring-1 ring-white/20 dark:ring-white/10">
          <button
            onClick={() => refreshApp()}
            className="p-1 rounded glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 active:scale-[.99] motion-reduce:transition-none motion-reduce:active:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !app.id}
            title="Refresh Files"
          >
            <RefreshCw size={16} />
          </button>
          <div className="text-sm text-gray-700 dark:text-gray-300">{filteredFiles.length}/{app.files.length} files</div>
          <div className="flex-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files and folders…"
            className="w-60 rounded-md border bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 overflow-auto pr-2">
            <FileTree files={filteredFiles} appId={app.id} onRequestRefresh={() => refreshApp()} highlightQuery={debouncedQ} />
          </div>
          <div className="w-2/3">
            {selectedFile ? (
              <FileEditor appId={app.id ?? null} filePath={selectedFile.path} />
            ) : (
              <div className="text-center py-4 text-gray-500">
                Select a file to view
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-center py-4 text-gray-500">No files found</div>;
};
