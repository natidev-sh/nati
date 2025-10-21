import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Rocket, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";

type UpdateStatusEvent =
  | { type: "available"; version?: string }
  | { type: "download-progress"; percent: number; bytesPerSecond: number }
  | { type: "downloaded"; version?: string }
  | { type: "error"; message: string };

export function UpdateModal() {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [downloadedVersion, setDownloadedVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [bytesPerSecond, setBytesPerSecond] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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
          setIsVisible(true);
          setIsDismissed(false);
          break;
        case "download-progress":
          setProgress(Math.max(0, Math.min(100, evt.percent)));
          setBytesPerSecond(evt.bytesPerSecond || 0);
          break;
        case "downloaded":
          setDownloadedVersion(evt.version ?? "");
          setProgress(100);
          setError(null);
          setIsVisible(true);
          break;
        case "error":
          setError(evt.message);
          setIsVisible(true);
          break;
      }
    });
    return () => {
      try { off?.(); } catch {}
      try { window.electron?.ipcRenderer.removeAllListeners("update-status"); } catch {}
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    if (!window.electron) return;
    await window.electron.ipcRenderer.invoke("update:quit-and-install");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const show = isVisible && !isDismissed;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-lg mx-4"
          >
            <div className="relative rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
              {/* Close Button */}
              {!downloadedVersion && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Header with Gradient */}
              <div className="relative bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 p-6 pb-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative flex items-center gap-3">
                  {downloadedVersion ? (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                  ) : error ? (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {downloadedVersion
                        ? "Update Ready!"
                        : error
                        ? "Update Error"
                        : "Update Available"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {downloadedVersion
                        ? `Version ${downloadedVersion}`
                        : availableVersion
                        ? `Version ${availableVersion}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Downloaded State */}
                {downloadedVersion && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Sparkles className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          New features and improvements are ready!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Restart Nati to complete the installation.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleInstall}
                        className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
                        size="lg"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Restart Now
                      </Button>
                      <Button
                        onClick={handleDismiss}
                        variant="outline"
                        size="lg"
                      >
                        Later
                      </Button>
                    </div>
                  </div>
                )}

                {/* Downloading State */}
                {availableVersion && !downloadedVersion && !error && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Download className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Downloading update in background...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBytes(bytesPerSecond)} • {progress?.toFixed(1)}% complete
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {progress !== null && (
                      <div className="space-y-2">
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="h-full bg-gradient-to-r from-primary to-purple-600 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          </motion.div>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          You'll be notified when it's ready to install
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Failed to download update
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      className="w-full"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* What's New Link */}
                {availableVersion && (
                  <button
                    onClick={() => {
                      window.electron?.ipcRenderer.invoke(
                        "open-external-url",
                        `https://github.com/natidev-sh/nati/releases/tag/v${availableVersion}`
                      );
                    }}
                    className="w-full text-sm text-center text-primary hover:underline"
                  >
                    View changelog →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpdateModal;
