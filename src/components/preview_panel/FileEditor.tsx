import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useLoadAppFile } from "@/hooks/useLoadAppFile";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronRight, Circle, Save } from "lucide-react";
import "@/components/chat/monaco";
import { IpcClient } from "@/ipc/ipc_client";
import { showError, showSuccess, showWarning } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/hooks/useSettings";
import { useCheckProblems } from "@/hooks/useCheckProblems";
import { getLanguage } from "@/utils/get_language";

interface FileEditorProps {
  appId: number | null;
  filePath: string;
}

interface BreadcrumbProps {
  path: string;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isSaving: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  path,
  hasUnsavedChanges,
  onSave,
  isSaving,
}) => {
  const segments = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex items-center gap-1 overflow-hidden min-w-0">
          {segments.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
              )}
              <span className="hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer truncate">
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="h-6 w-6 p-0"
                data-testid="save-file-button"
              >
                <Save size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasUnsavedChanges ? "Save changes" : "No unsaved changes"}
            </TooltipContent>
          </Tooltip>
          {hasUnsavedChanges && (
            <Circle
              size={8}
              fill="currentColor"
              className="text-amber-600 dark:text-amber-400"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const FileEditor = ({ appId, filePath }: FileEditorProps) => {
  const { content, loading, error } = useLoadAppFile(appId, filePath);
  const { theme } = useTheme();
  const [value, setValue] = useState<string | undefined>(undefined);
  const [displayUnsavedChanges, setDisplayUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { settings } = useSettings();
  // Use refs for values that need to be current in event handlers
  const originalValueRef = useRef<string | undefined>(undefined);
  const editorRef = useRef<any>(null);
  const isSavingRef = useRef<boolean>(false);
  const needsSaveRef = useRef<boolean>(false);
  const currentValueRef = useRef<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const { checkProblems } = useCheckProblems(appId);

  const isImage = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i.test(filePath);
  const isSvg = /\.svg$/i.test(filePath);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{x:number;y:number}>({x:0,y:0});

  useEffect(() => {
    let mounted = true;
    setImageUrl(null);
    setImageErr(null);
    if (appId && isImage) {
      IpcClient.getInstance()
        .readAppFileDataUrl(appId, filePath)
        .then(async (url) => {
          if (!mounted) return;
          if (isSvg && (!url || !url.startsWith("data:image/svg+xml"))) {
            // Fallback: read text and construct utf8 data URL
            try {
              const svgText = await IpcClient.getInstance().readAppFile(appId, filePath);
              const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
              setImageUrl(dataUrl);
              return;
            } catch (e) {
              // fall through to set url as-is
            }
          }
          setImageUrl(url);
        })
        .catch(async (err) => {
          if (!mounted) return;
          if (isSvg) {
            // Try text->utf8 data url as a final fallback
            try {
              const svgText = await IpcClient.getInstance().readAppFile(appId, filePath);
              const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
              setImageUrl(dataUrl);
              return;
            } catch {}
          }
          setImageErr(String(err));
          setImageUrl(null);
        });
    }
    return () => {
      mounted = false;
    };
  }, [appId, filePath, isImage]);

  // Update state when content loads
  useEffect(() => {
    if (content !== null) {
      setValue(content);
      originalValueRef.current = content;
      currentValueRef.current = content;
      needsSaveRef.current = false;
      setDisplayUnsavedChanges(false);
      setIsSaving(false);
    }
  }, [content, filePath]);

  // Sync the UI with the needsSave ref
  useEffect(() => {
    setDisplayUnsavedChanges(needsSaveRef.current);
  }, [needsSaveRef.current]);

  // Determine if dark mode based on theme
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const editorTheme = isDarkMode ? "dyad-dark" : "dyad-light";

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Keyboard shortcuts
    if (monaco) {
      // Save: Ctrl/Cmd + S
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (needsSaveRef.current) saveFile();
      });

      // Save + Check Problems: Ctrl/Cmd + Enter
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (settings?.keyboard?.enableCtrlEnterSaveCheck !== false) {
          const run = async () => {
            await saveFile();
            if (settings?.enableAutoFixProblems) {
              checkProblems();
            }
          };
          run();
        }
      });

      // Toggle comment: Ctrl/Cmd + /
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        editor.getAction?.("editor.action.commentLine")?.run();
      });

      // Format document: Ctrl/Cmd + Shift + F
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => editor.getAction?.("editor.action.formatDocument")?.run(),
      );

      // Duplicate line down: Shift + Alt + Down
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => editor.getAction?.("editor.action.copyLinesDownAction")?.run(),
      );

      // Move line up/down: Alt + Up/Down
      editor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
        () => editor.getAction?.("editor.action.moveLinesUpAction")?.run(),
      );
      editor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => editor.getAction?.("editor.action.moveLinesDownAction")?.run(),
      );
    }

    // Save on blur if needed
    editor.onDidBlurEditorText(() => {
      if (
        needsSaveRef.current &&
        (settings?.keyboard?.enableSaveOnBlur !== false)
      ) {
        saveFile();
      }
    });

    // Right-click context menu (custom)
    const domNode = editor.getDomNode();
    if (domNode) {
      const onCtx = (e: MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOpen(true);
      };
      const onClickAnywhere = () => setMenuOpen(false);
      domNode.addEventListener("contextmenu", onCtx);
      window.addEventListener("click", onClickAnywhere);
      window.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") setMenuOpen(false);
      });
      // Cleanup
      editor.onDidDispose(() => {
        domNode.removeEventListener("contextmenu", onCtx);
        window.removeEventListener("click", onClickAnywhere);
      });
    }
  };

  // Handle content change
  const handleEditorChange = (newValue: string | undefined) => {
    setValue(newValue);
    currentValueRef.current = newValue;

    const hasChanged = newValue !== originalValueRef.current;
    needsSaveRef.current = hasChanged;
    setDisplayUnsavedChanges(hasChanged);
  };

  // Save the file
  const saveFile = async () => {
    if (
      !appId ||
      !currentValueRef.current ||
      !needsSaveRef.current ||
      isSavingRef.current
    )
      return;

    try {
      isSavingRef.current = true;
      setIsSaving(true);

      const ipcClient = IpcClient.getInstance();
      const { warning } = await ipcClient.editAppFile(
        appId,
        filePath,
        currentValueRef.current,
      );
      await queryClient.invalidateQueries({ queryKey: ["versions", appId] });
      if (settings?.enableAutoFixProblems) {
        checkProblems();
      }
      if (warning) {
        showWarning(warning);
      } else {
        showSuccess("File saved");
      }

      originalValueRef.current = currentValueRef.current;
      needsSaveRef.current = false;
      setDisplayUnsavedChanges(false);
    } catch (error) {
      showError(error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  if (loading && !isImage) {
    return <div className="p-4">Loading file content...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  if (!content && !isImage) {
    return <div className="p-4 text-gray-500">No content available</div>;
  }

  return (
    <div className="h-full flex flex-col relative">
      <Breadcrumb
        path={filePath}
        hasUnsavedChanges={displayUnsavedChanges}
        onSave={saveFile}
        isSaving={isSaving}
      />
      <div className="flex-1 overflow-auto">
        {isImage ? (
          <div className="h-full w-full flex items-center justify-center p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={filePath}
                className="max-w-full max-h-full rounded-xl border glass-surface"
              />
            ) : (
              <div className="text-sm text-gray-500">
                {imageErr ? `Failed to load image: ${imageErr}` : "Loading image…"}
              </div>
            )}
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage={getLanguage(filePath)}
            value={value}
            theme={editorTheme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              fontFamily: "monospace",
              fontSize: 13,
              lineNumbers: "on",
            }}
          />
        )}
      </div>
      {/* Context menu overlay */}
      {menuOpen && (
        <div
          className="absolute z-50"
          style={{ left: menuPos.x, top: menuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-[180px] rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("chat:mention-file", { detail: { path: filePath } }));
                setMenuOpen(false);
              }}
            >
              Mention in Chat
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                navigator.clipboard.writeText(filePath);
                setMenuOpen(false);
              }}
            >
              Copy Path
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
