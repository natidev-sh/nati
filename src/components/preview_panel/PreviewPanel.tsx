import { useAtom, useAtomValue } from "jotai";
import {
  appOutputAtom,
  previewModeAtom,
  previewPanelKeyAtom,
  selectedAppIdAtom,
} from "../../atoms/appAtoms";

import { CodeView } from "./CodeView";
import { PreviewIframe } from "./PreviewIframe";
import { Problems } from "./Problems";
import { ConfigurePanel } from "./ConfigurePanel";
import { ChevronDown, ChevronUp, Logs, Plus, X, Edit3, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Console } from "./Console";
import { useRunApp } from "@/hooks/useRunApp";
import { PublishPanel } from "./PublishPanel";
import { useSettings } from "@/hooks/useSettings";

interface ConsoleHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  latestMessage?: string;
}

// Console header component
const ConsoleHeader = ({
  isOpen,
  onToggle,
  latestMessage,
}: ConsoleHeaderProps) => (
  <div
    onClick={onToggle}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    }}
    className="flex items-start gap-2 px-4 py-1.5 border-t border-border cursor-pointer glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
  >
    <Logs size={16} className="mt-0.5" />
    <div className="flex flex-col">
      <span className="text-sm font-medium">System Messages</span>
      {!isOpen && latestMessage && (
        <span className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-[400px]">
          {latestMessage}
        </span>
      )}
    </div>
    <div className="flex-1" />
    {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
  </div>
);

// Main PreviewPanel component
export function PreviewPanel() {
  const [previewMode] = useAtom(previewModeAtom);
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const { runApp, stopApp, loading, app } = useRunApp();
  const runningAppIdRef = useRef<number | null>(null);
  const key = useAtomValue(previewPanelKeyAtom);
  const appOutput = useAtomValue(appOutputAtom);
  const { settings } = useSettings();
  const tabDefault = settings?.console?.theme?.tabDefault || "#64748b";
  const tabActive = settings?.console?.theme?.tabActive || "#4f46e5";
  // Console tabs (local UI state)
  const [tabs, setTabs] = useState<{ id: string; name: string; color?: string }[]>([
    { id: "default", name: "Terminal" },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("default");
  const addTab = () => {
    const id = `term-${Date.now()}`;
    setTabs((t) => [...t, { id, name: `Terminal ${t.length + 1}` }]);
    setActiveTabId(id);
    setIsConsoleOpen(true);
  };
  const renameTab = (id: string) => {
    const current = tabs.find((t) => t.id === id);
    const next = prompt("Rename terminal", current?.name || "Terminal");
    if (next && next.trim()) setTabs((t) => t.map((x) => (x.id === id ? { ...x, name: next.trim() } : x)));
  };
  const recolorTab = (id: string) => {
    const val = prompt("Tab color (hex or css color)", tabs.find((t) => t.id === id)?.color || "#4f46e5");
    if (val) setTabs((t) => t.map((x) => (x.id === id ? { ...x, color: val } : x)));
  };
  const closeTab = (id: string) => {
    setTabs((t) => {
      const next = t.filter((x) => x.id !== id);
      if (!next.length) next.push({ id: "default", name: "Terminal" });
      if (activeTabId === id) setActiveTabId(next[0].id);
      return next;
    });
  };

  const messageCount = appOutput.length;
  const latestMessage =
    messageCount > 0 ? appOutput[messageCount - 1]?.message : undefined;

  useEffect(() => {
    const previousAppId = runningAppIdRef.current;

    // Check if the selected app ID has changed
    if (selectedAppId !== previousAppId) {
      // Stop the previously running app, if any
      if (previousAppId !== null) {
        console.debug("Stopping previous app", previousAppId);
        stopApp(previousAppId);
        // We don't necessarily nullify the ref here immediately,
        // let the start of the next app update it or unmount handle it.
      }

      // Start the new app if an ID is selected
      if (selectedAppId !== null) {
        console.debug("Starting new app", selectedAppId);
        runApp(selectedAppId); // Consider adding error handling for the promise if needed
        runningAppIdRef.current = selectedAppId; // Update ref to the new running app ID
      } else {
        // If selectedAppId is null, ensure no app is marked as running
        runningAppIdRef.current = null;
      }
    }

    // Cleanup function: This runs when the component unmounts OR before the effect runs again.
    // We only want to stop the app on actual unmount. The logic above handles stopping
    // when the appId changes. So, we capture the running appId at the time the effect renders.
    const appToStopOnUnmount = runningAppIdRef.current;
    return () => {
      if (appToStopOnUnmount !== null) {
        const currentRunningApp = runningAppIdRef.current;
        if (currentRunningApp !== null) {
          console.debug(
            "Component unmounting or selectedAppId changing, stopping app",
            currentRunningApp,
          );
          stopApp(currentRunningApp);
          runningAppIdRef.current = null; // Clear ref on stop
        }
      }
    };
    // Dependencies: run effect when selectedAppId changes.
    // runApp/stopApp are stable due to useCallback.
  }, [selectedAppId, runApp, stopApp]);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="vertical">
          <Panel id="content" minSize={30}>
            <div className="h-full overflow-y-auto glass-surface border shadow-sm rounded-2xl p-1">
              {previewMode === "preview" ? (
                <PreviewIframe key={key} loading={loading} />
              ) : previewMode === "code" ? (
                <CodeView loading={loading} app={app} />
              ) : previewMode === "configure" ? (
                <ConfigurePanel />
              ) : previewMode === "publish" ? (
                <PublishPanel />
              ) : (
                <Problems />
              )}
            </div>
          </Panel>
          {isConsoleOpen && (
            <>
              <PanelResizeHandle className="h-1 bg-white/40 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-colors cursor-row-resize rounded-full shadow-sm" />
              <Panel id="console" minSize={10} defaultSize={30}>
                <div className="flex flex-col h-full">
                  <ConsoleHeader
                    isOpen={true}
                    onToggle={() => setIsConsoleOpen(false)}
                    latestMessage={latestMessage}
                  />
                  {/* Tabs toolbar */}
                  <div className="px-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tabs.map((t) => (
                        <div key={t.id} className={`group inline-flex items-center rounded-lg px-2 py-1 text-xs cursor-pointer ${activeTabId===t.id?"bg-white/20 dark:bg-white/10":"hover:bg-white/10 dark:hover:bg-white/5"}`} style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                          <button onClick={() => setActiveTabId(t.id)} className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: t.color || (activeTabId===t.id?tabActive:tabDefault) }} />
                            <span className="font-medium">{t.name}</span>
                          </button>
                          <button className="opacity-70 hover:opacity-100 ml-1" title="Rename" onClick={() => renameTab(t.id)}>
                            <Edit3 size={12} />
                          </button>
                          <button className="opacity-70 hover:opacity-100" title="Color" onClick={() => recolorTab(t.id)}>
                            <Palette size={12} />
                          </button>
                          {t.id !== "default" && (
                            <button className="opacity-70 hover:opacity-100" title="Close" onClick={() => closeTab(t.id)}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={addTab} className="inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1 border hover:bg-white/10 dark:hover:bg-white/5">
                        <Plus size={12} /> New Terminal
                      </button>
                    </div>
                  </div>
                  <Console />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
      {!isConsoleOpen && (
        <ConsoleHeader
          isOpen={false}
          onToggle={() => setIsConsoleOpen(true)}
          latestMessage={latestMessage}
        />
      )}
    </div>
  );
}
