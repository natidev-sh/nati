import React from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  FileJson,
  FileCode,
  FileImage,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X,
  MessageSquarePlus,
} from "lucide-react";
import { selectedFileAtom } from "@/atoms/viewAtoms";
import { useSetAtom, useAtomValue } from "jotai";
import { IpcClient } from "@/ipc/ipc_client";
import { createPortal } from "react-dom";

interface FileTreeProps {
  files: string[];
  appId?: number; // required for file operations
  onRequestRefresh?: () => void; // optional callback to refresh file list after ops
  // Optional: show modified/unsaved indicator for these paths
  modifiedPaths?: Set<string>;
  // Optional: git status per path (e.g., M/A/D/U)
  gitStatuses?: Record<string, "M" | "A" | "D" | "U">;
  // Optional: highlight query for names
  highlightQuery?: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
}

// Convert flat file list to tree structure
const buildFileTree = (files: string[]): TreeNode[] => {
  const root: TreeNode[] = [];

  files.forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");

      // Check if this node already exists at the current level
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        // If we found the node, just drill down to its children for the next level
        currentLevel = existingNode.children;
      } else {
        // Create a new node
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLastPart,
          children: [],
        };
        currentLevel.push(newNode);
        currentLevel = newNode.children;
      }
    });
  });

  return root;
};

// File tree component
export const FileTree = ({ files, appId, onRequestRefresh, modifiedPaths, gitStatuses, highlightQuery }: FileTreeProps) => {
  const treeData = React.useMemo(() => buildFileTree(files), [files]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [focusedPath, setFocusedPath] = React.useState<string | null>(null);
  const [expandTarget, setExpandTarget] = React.useState<string | null>(null);
  const [ctx, setCtx] = React.useState<{
    show: boolean;
    x: number;
    y: number;
    node: TreeNode | null;
  }>({ show: false, x: 0, y: 0, node: null });
  // Allow top-level actions to open a file directly
  const setSelectedFileTop = useSetAtom(selectedFileAtom);

  // Rename/Delete modals
  const [renameModal, setRenameModal] = React.useState<{
    open: boolean;
    path: string | null;
    name: string;
  }>({ open: false, path: null, name: "" });
  const [confirmModal, setConfirmModal] = React.useState<{
    open: boolean;
    path: string | null;
    name: string;
  }>({ open: false, path: null, name: "" });

  // Restore last focus/selection
  React.useEffect(() => {
    const last = localStorage.getItem("filetree:lastPath");
    if (last) setFocusedPath(last);
  }, []);

  // Broadcast the flat files list so other components (e.g., ChatInput) can consume it
  React.useEffect(() => {
    try {
      const evt = new CustomEvent("filetree:files", { detail: { files } });
      window.dispatchEvent(evt);
    } catch (e) {
      // no-op
    }
  }, [files]);

  const closeContext = () => setCtx((s) => ({ ...s, show: false }));

  // Keyboard navigation across visible rows
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const items = containerRef.current?.querySelectorAll<HTMLElement>("[data-treeitem='1']");
    if (!items || items.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    let index = -1;
    items.forEach((el, i) => {
      if (el === active) index = i;
    });
    const moveFocus = (next: number) => {
      const target = items[next] as HTMLElement | undefined;
      if (target) {
        target.focus();
      }
    };
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(Math.min(items.length - 1, Math.max(0, index + 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(Math.max(0, index === -1 ? 0 : index - 1));
    }
  };

  // Close context menu on outside click or ESC
  React.useEffect(() => {
    const onDocClick = () => closeContext();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContext();
    };
    if (ctx.show) {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [ctx.show]);

  // Listen for external focus/expand requests
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { path?: string } | undefined;
      const path = detail?.path;
      if (!path) return;
      setExpandTarget(path);
      // Scroll after a tick
      setTimeout(() => {
        const el = containerRef.current?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`);
        el?.scrollIntoView({ block: "center" });
        el?.focus();
      }, 50);
    };
    window.addEventListener("filetree:focus", handler as EventListener);
    return () => window.removeEventListener("filetree:focus", handler as EventListener);
  }, []);

  return (
    <div
      ref={containerRef}
      className="file-tree mt-2 glass-surface border shadow-sm rounded-2xl p-2 text-[13px]"
      role="tree"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <TreeNodes
        nodes={treeData}
        level={0}
        appId={appId}
        modifiedPaths={modifiedPaths}
        gitStatuses={gitStatuses}
        focusedPath={focusedPath}
        setFocusedPath={setFocusedPath}
        setContextMenu={setCtx}
        highlightQuery={highlightQuery}
        expandTarget={expandTarget}
      />

      {ctx.show && ctx.node && createPortal(
        <div
          className="fixed z-50 min-w-[200px] max-w-[280px] rounded-xl glass-surface border shadow-sm p-1 text-[13px] backdrop-blur-md"
          style={{
            left: Math.max(8, Math.min(ctx.x, window.innerWidth - 220)),
            top: Math.max(8, Math.min(ctx.y, window.innerHeight - 220)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ContextMenuItem icon={<ChevronRight size={14} />} label="Open" onClick={() => {
            // Open selects the file directly
            const node = ctx.node;
            if (node && !node.isDirectory) {
              setSelectedFileTop({ path: node.path });
              localStorage.setItem("filetree:lastPath", node.path);
            }
            closeContext();
          }} />
          <ContextMenuItem icon={<ExternalLink size={14} />} label="Reveal in Explorer" onClick={async () => {
            const p = ctx.node?.path;
            if (p) {
              if (appId != null) {
                try {
                  await IpcClient.getInstance().revealInFolder({ appId, filePath: p });
                } catch (e) {
                  console.error(e);
                }
              } else {
                const evt = new CustomEvent("filetree:reveal", { detail: { path: p } });
                window.dispatchEvent(evt);
              }
            }
            closeContext();
          }} />
          {/* Send to chat (files and folders) */}
          {ctx.node && (
            <ContextMenuItem icon={<MessageSquarePlus size={14} />} label={ctx.node.isDirectory? "Send folder to chat" : "Send to chat"} onClick={() => {
              const p = ctx.node?.path;
              if (p) {
                try {
                  const evt = new CustomEvent("chat:mention-file", { detail: { path: p } });
                  window.dispatchEvent(evt);
                } catch {}
              }
              closeContext();
            }} />
          )}

          {/* Rename/Delete only for files to avoid directory op issues */}
          {ctx.node && !ctx.node.isDirectory && (
            <>
              <ContextMenuItem icon={<Pencil size={14} />} label="Rename" onClick={() => {
                const node = ctx.node;
                if (!node) return;
                setRenameModal({ open: true, path: node.path, name: node.name });
                closeContext();
              }} />
              <ContextMenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => {
                const node = ctx.node;
                if (!node) return;
                setConfirmModal({ open: true, path: node.path, name: node.name });
                closeContext();
              }} />
            </>
          )}
        </div>,
        document.body
      )}

      {/* Rename Modal */}
      <RenameModal
        open={renameModal.open}
        name={renameModal.name}
        onCancel={() => setRenameModal({ open: false, path: null, name: "" })}
        onSubmit={async (newName) => {
          if (!renameModal.path || !appId) {
            setRenameModal({ open: false, path: null, name: "" });
            return;
          }
          const parts = renameModal.path.split("/");
          parts[parts.length - 1] = newName;
          const newPath = parts.join("/");
          try {
            await IpcClient.getInstance().renameFile({ appId, oldPath: renameModal.path, newPath });
            setFocusedPath(newPath);
            localStorage.setItem("filetree:lastPath", newPath);
            onRequestRefresh?.();
          } catch (e) {
            console.error(e);
          } finally {
            setRenameModal({ open: false, path: null, name: "" });
          }
        }}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        message={`Delete ${confirmModal.name}?`}
        onCancel={() => setConfirmModal({ open: false, path: null, name: "" })}
        onConfirm={async () => {
          if (!confirmModal.path || !appId) {
            setConfirmModal({ open: false, path: null, name: "" });
            return;
          }
          try {
            await IpcClient.getInstance().deleteFile({ appId, filePath: confirmModal.path });
            onRequestRefresh?.();
          } catch (e) {
            console.error(e);
          } finally {
            setConfirmModal({ open: false, path: null, name: "" });
          }
        }}
      />
    </div>
  );
};

function ContextMenuItem({ label, onClick, danger, icon }: { label: string; onClick: () => void; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${danger ? "text-red-600" : ""}`}
      onClick={onClick}
    >
      {icon && <span className="shrink-0 text-gray-500 dark:text-gray-400">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}

// Rename Modal
function RenameModal({ open, name, onCancel, onSubmit }: { open: boolean; name: string; onCancel: () => void; onSubmit: (newName: string) => void }) {
  const [value, setValue] = React.useState(name);
  React.useEffect(() => setValue(name), [name, open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative glass-surface rounded-2xl border shadow-sm p-3 w-[320px]">
        <div className="text-sm font-medium mb-2">Rename</div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit(value.trim());
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          className="w-full px-2 py-1.5 rounded-xl glass-surface border outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-2 py-1 rounded-lg glass-button glass-hover" onClick={onCancel}>
            <span className="inline-flex items-center gap-1"><X size={14} /> Cancel</span>
          </button>
          <button className="px-2 py-1 rounded-lg glass-button glass-hover glass-active" onClick={() => onSubmit(value)}>
            <span className="inline-flex items-center gap-1"><Check size={14} /> Save</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Confirm Modal
function ConfirmModal({ open, message, onCancel, onConfirm }: { open: boolean; message: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onKeyDown={(e) => {
      if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    }}>
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative glass-surface rounded-2xl border shadow-sm p-3 w-[320px]">
        <div className="text-sm mb-3">{message}</div>
        <div className="mt-1 flex justify-end gap-2">
          <button className="px-2 py-1 rounded-lg glass-button glass-hover" onClick={onCancel}>
            <span className="inline-flex items-center gap-1"><X size={14} /> Cancel</span>
          </button>
          <button className="px-2 py-1 rounded-lg glass-button glass-hover glass-active text-red-600" onClick={onConfirm}>
            <span className="inline-flex items-center gap-1"><Trash2 size={14} /> Delete</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface TreeNodesProps {
  nodes: TreeNode[];
  level: number;
  appId?: number;
  modifiedPaths?: Set<string>;
  gitStatuses?: Record<string, "M" | "A" | "D" | "U">;
  focusedPath: string | null;
  setFocusedPath: (p: string | null) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{ show: boolean; x: number; y: number; node: TreeNode | null }>>;
  highlightQuery?: string | null;
  expandTarget?: string | null;
}

// Sort nodes to show directories first
const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
  return [...nodes].sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });
};

// Tree nodes component
const TreeNodes = React.memo(({ nodes, level, appId, modifiedPaths, gitStatuses, focusedPath, setFocusedPath, setContextMenu, highlightQuery, expandTarget }: TreeNodesProps) => (
  <ul className="">
    {sortNodes(nodes).map((node, index) => (
      <TreeNode
        key={`${node.path}-${index}`}
        node={node}
        level={level}
        isLast={index === nodes.length - 1}
        appId={appId}
        modifiedPaths={modifiedPaths}
        gitStatuses={gitStatuses}
        focusedPath={focusedPath}
        setFocusedPath={setFocusedPath}
        setContextMenu={setContextMenu}
        highlightQuery={highlightQuery}
        expandTarget={expandTarget}
      />
    ))}
  </ul>
));

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  isLast: boolean;
  appId?: number;
  modifiedPaths?: Set<string>;
  gitStatuses?: Record<string, "M" | "A" | "D" | "U">;
  focusedPath: string | null;
  setFocusedPath: (p: string | null) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{ show: boolean; x: number; y: number; node: TreeNode | null }>>;
  highlightQuery?: string | null;
  expandTarget?: string | null;
}

// Icon helper
function getFileIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (/(package\.json|\.json)$/.test(lower)) return <FileJson size={14} className="text-amber-600 dark:text-amber-400" />;
  if (/(\.ts$|\.tsx$|\.js$|\.jsx$|\.mjs$|\.cjs$)/.test(lower)) return <FileCode size={14} className="text-sky-600 dark:text-sky-400" />;
  if (/(\.md$|readme)/.test(lower)) return <FileText size={14} className="text-emerald-600 dark:text-emerald-400" />;
  if (/(\.png$|\.jpg$|\.jpeg$|\.gif$|\.svg$|\.webp$)/.test(lower)) return <FileImage size={14} className="text-pink-600 dark:text-pink-400" />;
  return <FileText size={14} className="text-gray-500" />;
}

// Individual tree node component
const TreeNode = ({ node, level, isLast, appId, modifiedPaths, gitStatuses, focusedPath, setFocusedPath, setContextMenu, highlightQuery, expandTarget }: TreeNodeProps) => {
  const [expanded, setExpanded] = React.useState(level < 2);
  const setSelectedFile = useSetAtom(selectedFileAtom);
  const selected = useAtomValue(selectedFileAtom);
  const isActive = !node.isDirectory && selected?.path === node.path;

  // Expand directories along the expandTarget path
  React.useEffect(() => {
    if (!expandTarget) return;
    if (node.isDirectory) {
      if (expandTarget === node.path || expandTarget.startsWith(node.path + "/")) {
        setExpanded(true);
      }
    }
  }, [expandTarget, node.isDirectory, node.path]);

  const onRowClick = () => {
    if (node.isDirectory) {
      setExpanded((e) => !e);
    } else {
      setSelectedFile({ path: node.path });
      localStorage.setItem("filetree:lastPath", node.path);
    }
  };

  const onRowDoubleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (!node.isDirectory) {
      setSelectedFile({ path: node.path });
      localStorage.setItem("filetree:lastPath", node.path);
    } else {
      setExpanded((v) => !v);
    }
  };

  const onChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((e2) => !e2);
  };

  const onContextMenu: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, node });
  };

  // Indentation width per level
  const pad = { paddingLeft: `${level * 12}px` };

  const onKeyDownRow: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onRowClick();
    } else if (e.key === "ArrowRight" && node.isDirectory && !expanded) {
      e.preventDefault();
      setExpanded(true);
    } else if (e.key === "ArrowLeft" && node.isDirectory && expanded) {
      e.preventDefault();
      setExpanded(false);
    }
  };

  return (
    <li className="py-0.5">
      <div
        className={`relative flex items-center rounded cursor-pointer px-1 py-0.5 text-[13px] outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 active:scale-[.99] motion-reduce:transition-none motion-reduce:active:transform-none ${
          isActive ? "glass-active ring-1 ring-white/30 dark:ring-white/10" : "glass-button glass-hover"
        }`}
        style={pad}
        onClick={onRowClick}
        onDoubleClick={onRowDoubleClick}
        onContextMenu={onContextMenu}
        data-treeitem="1"
        role="treeitem"
        aria-expanded={node.isDirectory ? expanded : undefined}
        tabIndex={focusedPath === node.path ? 0 : -1}
        onFocus={() => setFocusedPath(node.path)}
        onKeyDown={onKeyDownRow}
        data-path={node.path}
      >
        {/* Indentation guide + branch char */}
        {level > 0 && (
          <span className="absolute left-0 top-0 bottom-0 border-l border-gray-200/60 dark:border-white/10" />
        )}
        <span className="w-3 mr-1 text-gray-400 select-none">{level > 0 ? (isLast ? "└" : "├") : ""}</span>

        {/* Chevron / spacer */}
        {node.isDirectory ? (
          <button
            className="mr-1 h-5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onChevronClick}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-4 mr-1" />
        )}

        {/* Icon */}
        <span className="mr-1 text-gray-600 dark:text-gray-300">
          {node.isDirectory ? (
            expanded ? (
              <FolderOpen size={14} />
            ) : (
              <Folder size={14} />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        {/* Name with optional highlight */}
        <span className="truncate">
          {(() => {
            const q = (highlightQuery || "").trim().toLowerCase();
            if (!q || !node.name.toLowerCase().includes(q)) return node.name;
            const idx = node.name.toLowerCase().indexOf(q);
            const before = node.name.slice(0, idx);
            const match = node.name.slice(idx, idx + q.length);
            const after = node.name.slice(idx + q.length);
            return (
              <>
                {before}
                <mark className="bg-yellow-300 text-black dark:bg-yellow-300 dark:text-black rounded px-[2px]">{match}</mark>
                {after}
              </>
            );
          })()}
        </span>

        {/* Status badges */}
        {!node.isDirectory && modifiedPaths?.has(node.path) && (
          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-yellow-500" title="Modified" />
        )}
        {!node.isDirectory && gitStatuses?.[node.path] && (
          <span className="ml-1 text-[11px] px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-white/10">
            {gitStatuses[node.path]}
          </span>
        )}
      </div>

      {node.isDirectory && expanded && node.children.length > 0 && (
        <TreeNodes
          nodes={node.children}
          level={level + 1}
          modifiedPaths={modifiedPaths}
          gitStatuses={gitStatuses}
          focusedPath={focusedPath}
          setFocusedPath={setFocusedPath}
          setContextMenu={setContextMenu}
          highlightQuery={highlightQuery}
          expandTarget={expandTarget}
        />
      )}
    </li>
  );
};
