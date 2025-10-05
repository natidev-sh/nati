import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Download, CheckCircle2, XCircle } from "lucide-react";

type UpdateStatusEvent =
  | { type: "available"; version?: string }
  | { type: "download-progress"; percent: number; bytesPerSecond: number }
  | { type: "downloaded"; version?: string }
  | { type: "error"; message: string };

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke: (channel: any, ...args: unknown[]) => Promise<any>;
        on: (
          channel: any,
          listener: (...args: unknown[]) => void,
        ) => () => void;
        removeAllListeners: (channel: any) => void;
      };
    };
  }
}

export function UpdateBanner() {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [downloadedVersion, setDownloadedVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electron) return;
    const off = window.electron.ipcRenderer.on("update-status", (...args: unknown[]) => {
      const evt = (args?.[0] || {}) as UpdateStatusEvent;
      switch (evt.type) {
        case "available":
          setAvailableVersion(evt.version ?? "");
          setDownloadedVersion(null);
          setProgress(0);
          setError(null);
          break;
        case "download-progress":
          setProgress(Math.max(0, Math.min(100, evt.percent)));
          break;
        case "downloaded":
          setDownloadedVersion(evt.version ?? "");
          setProgress(100);
          setError(null);
          break;
        case "error":
          setError(evt.message);
          setBusy(false);
          break;
      }
    });
    return () => {
      try { off?.(); } catch {}
      try { window.electron?.ipcRenderer.removeAllListeners("update-status"); } catch {}
    };
  }, []);

  const show = useMemo(() => {
    return !!availableVersion || !!downloadedVersion || progress !== null || !!error;
  }, [availableVersion, downloadedVersion, progress, error]);

  if (!show) return null;

  return (
    <div className="mt-3 p-3 rounded-xl border glass-surface">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {downloadedVersion ? (
            <div className="text-sm font-medium glass-contrast-text flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Update ready to install {downloadedVersion ? `(${downloadedVersion})` : ""}
            </div>
          ) : availableVersion ? (
            <div className="text-sm font-medium glass-contrast-text flex items-center gap-2">
              <Download className="h-4 w-4" /> Downloading update {availableVersion ? `(${availableVersion})` : ""}
            </div>
          ) : error ? (
            <div className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Update error: {error}
            </div>
          ) : (
            <div className="text-sm font-medium glass-contrast-text flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" /> Checking for updates...
            </div>
          )}

          {progress !== null && !downloadedVersion && (
            <div className="mt-2 h-1 w-full rounded bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!downloadedVersion && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                if (!window.electron) return;
                setBusy(true);
                await window.electron.ipcRenderer.invoke("update:check-now");
                setBusy(false);
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCcw className="h-4 w-4 mr-1" />} Check for updates
            </Button>
          )}
          {downloadedVersion && (
            <Button
              size="sm"
              onClick={async () => {
                if (!window.electron) return;
                await window.electron.ipcRenderer.invoke("update:quit-and-install");
              }}
            >
              Restart to update
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateBanner;
