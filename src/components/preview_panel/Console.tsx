import { appOutputAtom, selectedAppIdAtom } from "@/atoms/appAtoms";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useRunApp } from "@/hooks/useRunApp";

// Console component
export const Console = () => {
  const appOutput = useAtomValue(appOutputAtom);
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useSettings();
  const { restartApp } = useRunApp();
  const lastErrorCheckRef = useRef<number>(0);

  const styleVars = useMemo(() => {
    const theme = settings?.console?.theme || {};
    const fontSize = settings?.console?.fontSize ?? 12;
    return {
      background: theme.background ?? "#0b0b0c",
      foreground: theme.foreground ?? "#e6e7e8",
      fontSize: `${fontSize}px`,
    } as const;
  }, [settings]);

  useEffect(() => {
    if (!containerRef.current) return;
    const auto = settings?.console?.autoScroll ?? true;
    if (!auto) return;
    // Scroll smoothly to bottom when new output arrives
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [appOutput.length, settings?.console?.autoScroll]);

  // Auto-restart on error
  useEffect(() => {
    if (!selectedAppId || appOutput.length === 0) return;

    // Check if auto-restart is enabled
    const autoRestart = settings?.console?.autoRestart ?? true;
    if (!autoRestart) return;

    // Get the last error output (check last 5 outputs for errors)
    const recentOutputs = appOutput.slice(-5);
    const hasRecentError = recentOutputs.some(
      (output) => output.type === "stderr" || output.type === "client-error"
    );

    // Check for specific error patterns that indicate server issues
    const hasServerError = recentOutputs.some((output) => {
      const msg = output.message.toLowerCase();
      return (
        msg.includes("eaddrinuse") ||
        msg.includes("error listen") ||
        msg.includes("cannot connect") ||
        msg.includes("docker") ||
        msg.includes("port already in use") ||
        msg.includes("ecrash") ||
        msg.includes("killed")
      );
    });

    const shouldRestart = hasRecentError || hasServerError;

    if (shouldRestart && lastErrorCheckRef.current < Date.now() - 5000) {
      // Debounce: don't restart more than once every 5 seconds
      lastErrorCheckRef.current = Date.now();
      console.warn("Auto-restarting app due to console errors");
      setTimeout(() => {
        restartApp();
      }, 2000); // Wait 2 seconds before restarting
    }
  }, [appOutput, selectedAppId, settings?.console?.autoRestart, restartApp]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto px-4 py-2 rounded-b-2xl border-t font-mono"
      style={{ background: styleVars.background, color: styleVars.foreground, fontSize: styleVars.fontSize }}
    >
      {appOutput.map((output, index) => (
        <div key={index} className="whitespace-pre leading-snug">
          {output.message}
        </div>
      ))}
    </div>
  );
};
