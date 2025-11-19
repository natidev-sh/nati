import { useAtom, useAtomValue } from "jotai";
import {
  appOutputAtom,
  previewModeAtom,
  previewDeviceAtom,
  previewPanelKeyAtom,
  selectedAppIdAtom,
} from "../../atoms/appAtoms";

import { CodeView } from "./CodeView";
import { PreviewIframe } from "./PreviewIframe";
import { Problems } from "./Problems";
import { ConfigurePanel } from "./ConfigurePanel";
import { ChevronDown, ChevronUp, Logs, Plus, X, Edit3, Palette, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Console } from "./Console";
import { useRunApp } from "@/hooks/useRunApp";
import { PublishPanel } from "./PublishPanel";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

interface ConsoleHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  latestMessage?: string;
  messageCount: number;
}

// Console header component
const ConsoleHeader = ({
  isOpen,
  onToggle,
  latestMessage,
  messageCount,
}: ConsoleHeaderProps) => {
  const [justUpdated, setJustUpdated] = useState(false);
  useEffect(() => {
    if (!latestMessage) return;
    setJustUpdated(true);
    const t = setTimeout(() => setJustUpdated(false), 1200);
    return () => clearTimeout(t);
  }, [latestMessage]);

  const badgeLive = messageCount > 0;

  return (
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
      className="group relative flex items-center gap-3 px-3 py-1.5 cursor-pointer glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
    >
      {/* Icon */}
      <div className="h-6 w-6 rounded-md border flex items-center justify-center bg-gradient-to-br from-white/70 to-white/40 dark:from-white/15 dark:to-white/5">
        <Logs size={14} />
      </div>

      {/* Titles */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">System Messages</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              badgeLive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-white/50 dark:bg-white/10"
            }`}
            title={badgeLive ? "Streaming logs" : "No logs yet"}
          >
            {badgeLive ? "Live" : "Idle"}
          </span>
        </div>
        {!isOpen && latestMessage && (
          <div className="flex items-center gap-2 min-w-0">
            <div className={`text-xs text-muted-foreground truncate max-w-[220px] md:max-w-[460px] ${justUpdated ? "animate-pulse" : ""}`}>{latestMessage}</div>
            <button
              className="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded glass-button glass-hover"
              title="Copy latest log"
              onClick={(e) => {
                e.stopPropagation();
                if (latestMessage) navigator.clipboard.writeText(latestMessage);
              }}
            >
              <Copy size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
        <ChevronDown size={16} />
      </div>
    </div>
  );
};

// Main PreviewPanel component
export function PreviewPanel() {
  const [previewMode] = useAtom(previewModeAtom);
  const [previewDevice, setPreviewDevice] = useAtom(previewDeviceAtom);
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

  const deviceWidthClasses: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "w-full",
    tablet: "w-[834px] max-w-full",
    mobile: "w-[414px] max-w-full",
  };

  const deviceHeightClasses: Record<"desktop" | "tablet" | "mobile", string> = {
    desktop: "min-h-[640px]",
    tablet: "min-h-[640px]",
    mobile: "min-h-[720px]",
  };

  const deviceCycle: Array<"desktop" | "tablet" | "mobile"> = [
    "desktop",
    "tablet",
    "mobile",
  ];

  const cycleDevice = () => {
    const index = deviceCycle.indexOf(previewDevice);
    const nextDevice = deviceCycle[(index + 1) % deviceCycle.length];
    setPreviewDevice(nextDevice);
  };

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
            <div className="h-full overflow-hidden">
              <div className="flex h-full justify-center">
                <div
                  className={cn(
                    "relative flex h-full w-full flex-col overflow-hidden transition-all duration-300",
                    previewMode === "preview"
                      ? cn(
                          "mx-auto",
                          deviceWidthClasses[previewDevice],
                          deviceHeightClasses[previewDevice],
                        )
                      : "",
                  )}
                >
                  {previewMode === "preview" ? (
                    <PreviewIframe
                      key={key}
                      loading={loading}
                      previewDevice={previewDevice}
                      onCycleDevice={cycleDevice}
                    />
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
              </div>
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
                    messageCount={messageCount}
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
          messageCount={messageCount}
        />
      )}
    </div>
  );
}
