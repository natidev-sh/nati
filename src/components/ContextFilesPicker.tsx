import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { InfoIcon, Settings2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useSettings } from "@/hooks/useSettings";
import { useContextPaths } from "@/hooks/useContextPaths";
import type { ContextPathResult } from "@/lib/schemas";

export function ContextFilesPicker() {
  const { settings } = useSettings();
  const {
    contextPaths,
    smartContextAutoIncludes,
    excludePaths,
    updateContextPaths,
    updateSmartContextAutoIncludes,
    updateExcludePaths,
  } = useContextPaths();
  const [isOpen, setIsOpen] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [newAutoIncludePath, setNewAutoIncludePath] = useState("");
  const [newExcludePath, setNewExcludePath] = useState("");
  const [qInclude, setQInclude] = useState("");
  const [qExclude, setQExclude] = useState("");
  const [qAuto, setQAuto] = useState("");

  // Handlers for Explorer buttons (best-effort; works in Chromium/Electron)
  const handlePickFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    // @ts-ignore - non-standard but supported in Chromium
    input.webkitdirectory = true;
    input.onchange = () => {
      const files = (input as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      // Derive the selected top-level directory from first file's relative path
      const anyFile = files[0] as any;
      const rel = (anyFile?.webkitRelativePath as string) || "";
      const topFolder = rel.split("/")[0] || "";
      if (topFolder) {
        setNewPath(`${topFolder}/**/*`);
      }
    };
    input.click();
  };

  const handlePickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const files = (input as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      const f = files[0];
      // We cannot read absolute paths in browsers; use file name as a hint
      setNewPath(f.name);
    };
    input.click();
  };

  const addPath = () => {
    if (
      newPath.trim() === "" ||
      contextPaths.find((p: ContextPathResult) => p.globPath === newPath)
    ) {
      setNewPath("");
      return;
    }
    const newPaths = [
      ...contextPaths.map(({ globPath }: ContextPathResult) => ({ globPath })),
      {
        globPath: newPath,
      },
    ];
    updateContextPaths(newPaths);
    setNewPath("");
  };

  const removePath = (pathToRemove: string) => {
    const newPaths = contextPaths
      .filter((p: ContextPathResult) => p.globPath !== pathToRemove)
      .map(({ globPath }: ContextPathResult) => ({ globPath }));
    updateContextPaths(newPaths);
  };

  const addAutoIncludePath = () => {
    if (
      newAutoIncludePath.trim() === "" ||
      smartContextAutoIncludes.find(
        (p: ContextPathResult) => p.globPath === newAutoIncludePath,
      )
    ) {
      setNewAutoIncludePath("");
      return;
    }
    const newPaths = [
      ...smartContextAutoIncludes.map(({ globPath }: ContextPathResult) => ({
        globPath,
      })),
      {
        globPath: newAutoIncludePath,
      },
    ];
    updateSmartContextAutoIncludes(newPaths);
    setNewAutoIncludePath("");
  };

  const removeAutoIncludePath = (pathToRemove: string) => {
    const newPaths = smartContextAutoIncludes
      .filter((p: ContextPathResult) => p.globPath !== pathToRemove)
      .map(({ globPath }: ContextPathResult) => ({ globPath }));
    updateSmartContextAutoIncludes(newPaths);
  };

  const addExcludePath = () => {
    if (
      newExcludePath.trim() === "" ||
      excludePaths.find((p: ContextPathResult) => p.globPath === newExcludePath)
    ) {
      setNewExcludePath("");
      return;
    }
    const newPaths = [
      ...excludePaths.map(({ globPath }: ContextPathResult) => ({ globPath })),
      {
        globPath: newExcludePath,
      },
    ];
    updateExcludePaths(newPaths);
    setNewExcludePath("");
  };

  const removeExcludePath = (pathToRemove: string) => {
    const newPaths = excludePaths
      .filter((p: ContextPathResult) => p.globPath !== pathToRemove)
      .map(({ globPath }: ContextPathResult) => ({ globPath }));
    updateExcludePaths(newPaths);
  };

  const isSmartContextEnabled =
    settings?.enableDyadPro && settings?.enableProSmartFilesContextMode;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="has-[>svg]:px-2"
              size="sm"
              data-testid="codebase-context-button"
            >
              <Settings2 className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Codebase Context</TooltipContent>
      </Tooltip>

      <PopoverContent
        className="w-96 max-h-[80vh] overflow-y-auto rounded-2xl glass-surface ring-1 ring-white/30 dark:ring-white/10 border border-white/60 dark:border-white/10 p-4"
        align="start"
      >
        <div className="relative space-y-4 select-none">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium glass-contrast-text">Nati Codebase Context</h3>
              {isSmartContextEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-[rgba(237,50,121,0.10)] text-[#ed3279] ring-1 ring-[#ed3279]/20">
                  Smart Context
                </span>
              )}
            </div>

            {excludePaths.length > 0 && (
              <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
                <Input
                  type="text"
                  placeholder="Filter excluded paths"
                  value={qExclude}
                  onChange={(e) => setQExclude(e.target.value)}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground select-none">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      Select the files to use as context.{" "}
                      <InfoIcon className="size-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    {isSmartContextEnabled ? (
                      <p>
                        With Smart Context, Nati uses the most relevant files as
                        context.
                      </p>
                    ) : (
                      <p>By default, Nati uses your whole codebase.</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </div>

          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              data-testid="manual-context-files-input"
              type="text"
              placeholder="src/**/*.tsx"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addPath();
                }
              }}
            />
            <Button
              type="submit"
              onClick={addPath}
              data-testid="manual-context-files-add-button"
            >
              Add
            </Button>
            <Button variant="outline" type="button" onClick={handlePickFolder} title="Add from explorer (folder)">
              Add from explorer
            </Button>
          </div>

          {/* Filter includes */}
          {contextPaths.length > 0 && (
            <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
              <Input
                type="text"
                placeholder="Filter included paths"
                value={qInclude}
                onChange={(e) => setQInclude(e.target.value)}
              />
            </div>
          )}

          {/* Optional: quick file picker */}
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Button variant="ghost" type="button" onClick={handlePickFile} title="Pick a single file">Pick file…</Button>
          </div>

          <TooltipProvider>
            {contextPaths.length > 0 ? (
              <div className="space-y-2">
                {contextPaths
                  .filter((p: ContextPathResult) => p.globPath.toLowerCase().includes(qInclude.trim().toLowerCase()))
                  .map((p: ContextPathResult) => (
                  <div
                    key={p.globPath}
                    className="flex items-center justify-between gap-2 rounded-lg glass-surface ring-1 ring-white/30 dark:ring-white/10 p-2"
                  >
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate font-mono text-sm">
                            {p.globPath}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{p.globPath}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-muted-foreground">
                        {p.files} files, ~{p.tokens} tokens
                      </span>
                    </div>

              {smartContextAutoIncludes.length > 0 && (
                <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Filter auto-include paths"
                    value={qAuto}
                    onChange={(e) => setQAuto(e.target.value)}
                  />
                </div>
              )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePath(p.globPath)}
                        data-testid="manual-context-files-remove-button"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center glass-surface">
                <p className="text-sm text-muted-foreground">
                  {isSmartContextEnabled
                    ? "Nati will use Smart Context to automatically find the most relevant files to use as context."
                    : "Nati will use the entire codebase as context."}
                </p>
              </div>
            )}
          </TooltipProvider>

          <div className="pt-2">
            <div>
              <h3 className="font-medium">Exclude Paths</h3>
              <p className="text-sm text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help">
                        These files will be excluded from the context.{" "}
                        <InfoIcon className="ml-2 size-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>
                        Exclude paths take precedence - files that match both
                        include and exclude patterns will be excluded.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </p>
            </div>

            <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
              <Input
                data-testid="exclude-context-files-input"
                type="text"
                placeholder="node_modules/**/*"
                value={newExcludePath}
                onChange={(e) => setNewExcludePath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addExcludePath();
                  }
                }}
              />
              <Button
                type="submit"
                onClick={addExcludePath}
                data-testid="exclude-context-files-add-button"
              >
                Add
              </Button>
            </div>

            <TooltipProvider>
              {excludePaths.length > 0 && (
                <div className="space-y-2 mt-4">
                  {excludePaths
                    .filter((p: ContextPathResult) => p.globPath.toLowerCase().includes(qExclude.trim().toLowerCase()))
                    .map((p: ContextPathResult) => (
                    <div
                      key={p.globPath}
                      className="flex items-center justify-between gap-2 rounded-lg glass-surface ring-1 ring-red-200/70 p-2"
                    >
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate font-mono text-sm text-red-600">
                              {p.globPath}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{p.globPath}</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground">
                          {p.files} files, ~{p.tokens} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExcludePath(p.globPath)}
                          data-testid="exclude-context-files-remove-button"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TooltipProvider>
          </div>

          {isSmartContextEnabled && (
            <div className="pt-2">
              <div>
                <h3 className="font-medium">Smart Context Auto-includes</h3>
                <p className="text-sm text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-help">
                          These files will always be included in the context.{" "}
                          <InfoIcon className="ml-2 size-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>
                          Auto-include files are always included in the context
                          in addition to the files selected as relevant by Smart
                          Context.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </p>
              </div>

              <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                <Input
                  data-testid="auto-include-context-files-input"
                  type="text"
                  placeholder="src/**/*.config.ts"
                  value={newAutoIncludePath}
                  onChange={(e) => setNewAutoIncludePath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addAutoIncludePath();
                    }
                  }}
                />
                <Button
                  type="submit"
                  onClick={addAutoIncludePath}
                  data-testid="auto-include-context-files-add-button"
                >
                  Add
                </Button>
              </div>

              <TooltipProvider>
                {smartContextAutoIncludes.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {smartContextAutoIncludes
                      .filter((p: ContextPathResult) => p.globPath.toLowerCase().includes(qAuto.trim().toLowerCase()))
                      .map((p: ContextPathResult) => (
                      <div
                        key={p.globPath}
                        className="flex items-center justify-between gap-2 rounded-lg glass-surface ring-1 ring-white/30 dark:ring-white/10 p-2"
                      >
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate font-mono text-sm">
                                {p.globPath}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{p.globPath}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-xs text-muted-foreground">
                            {p.files} files, ~{p.tokens} tokens
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAutoIncludePath(p.globPath)}
                            data-testid="auto-include-context-files-remove-button"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
