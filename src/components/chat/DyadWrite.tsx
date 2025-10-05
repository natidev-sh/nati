import type React from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
  Loader,
  CircleX,
  Edit,
  X,
} from "lucide-react";
import { CodeHighlight } from "./CodeHighlight";
import { CustomTagState } from "./stateTypes";
import { FileEditor } from "../preview_panel/FileEditor";
import { useAtomValue } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";

interface DyadWriteProps {
  children?: ReactNode;
  node?: any;
  path?: string;
  description?: string;
}

export const DyadWrite: React.FC<DyadWriteProps> = ({
  children,
  node,
  path: pathProp,
  description: descriptionProp,
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Use props directly if provided, otherwise extract from node
  const path = pathProp || node?.properties?.path || "";
  const description = descriptionProp || node?.properties?.description || "";
  const state = node?.properties?.state as CustomTagState;

  const aborted = state === "aborted";
  const appId = useAtomValue(selectedAppIdAtom);
  const [isEditing, setIsEditing] = useState(false);
  const inProgress = state === "pending";

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsContentVisible(true);
  };
  // Extract filename from path
  const fileName = path ? path.split("/").pop() : "";

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
        <div className="flex items-center gap-2">
          <Pencil size={16} className="glass-contrast-text" />
          {fileName && (
            <span className="glass-contrast-text font-medium text-sm">{fileName}</span>
          )}
          {inProgress && (
            <div className="flex items-center text-amber-600 text-xs">
              <Loader size={14} className="mr-1 animate-spin" />
              <span>Writing...</span>
            </div>
          )}
          {aborted && (
            <div className="flex items-center text-red-600 text-xs">
              <CircleX size={14} className="mr-1" />
              <span>Did not finish</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {!inProgress && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    className="flex items-center gap-1 text-xs glass-contrast-text/70 hover:opacity-100 px-2 py-1 rounded cursor-pointer"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  className="flex items-center gap-1 text-xs glass-contrast-text/70 hover:opacity-100 px-2 py-1 rounded cursor-pointer"
                >
                  <Edit size={14} />
                  Edit
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsContentVisible(!isContentVisible);
            }}
            className="ml-2 h-8 w-8 flex items-center justify-center rounded-lg glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
          >
            {isContentVisible ? (
              <ChevronsDownUp size={20} className="glass-contrast-text" />
            ) : (
              <ChevronsUpDown size={20} className="glass-contrast-text" />
            )}
          </button>
        </div>
      </div>
      {path && (
        <div className="text-xs glass-contrast-text/70 font-medium mb-1 font-mono break-all whitespace-pre-wrap">
          {path}
        </div>
      )}
      {description && (
        <div className="text-sm glass-contrast-text">
          <span className="font-medium">Summary: </span>
          {description}
        </div>
      )}
      {isContentVisible && (
        <div className="text-xs cursor-text" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <div className="h-96 min-h-96 rounded-xl overflow-hidden glass-surface border">
              <FileEditor appId={appId ?? null} filePath={path} />
            </div>
          ) : (
            <CodeHighlight className="language-typescript">{children}</CodeHighlight>
          )}
        </div>
      )}
    </div>
  );
};
