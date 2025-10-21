import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import { RouterProvider } from "@tanstack/react-router";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { getTelemetryUserId, isTelemetryOptedIn } from "./hooks/useSettings";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { showError, showMcpConsentToast } from "./lib/toast";
import { IpcClient } from "./ipc/ipc_client";
import { toast } from "./lib/toast";
import { UpdateModal } from "./components/UpdateModal";

// @ts-ignore
console.log("Running in mode:", import.meta.env.MODE);

interface MyMeta extends Record<string, unknown> {
  showErrorToast: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: MyMeta;
    mutationMeta: MyMeta;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.showErrorToast) {
        showError(error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.showErrorToast) {
        showError(error);
      }
    },
  }),
});

const posthogClient = posthog.init(
  "phc_3Odqvfcoy4aB6B8dOGRyR3R8VlgACedsXQbPSQ5msS",
  {
    api_host: "https://eu.i.posthog.com",
    // @ts-ignore
    debug: import.meta.env.MODE === "development",
    autocapture: false,
    capture_exceptions: true,
    capture_pageview: false,
    before_send: (event) => {
      if (!isTelemetryOptedIn()) {
        console.debug("Telemetry not opted in, skipping event");
        return null;
      }
      const telemetryUserId = getTelemetryUserId();
      if (telemetryUserId) {
        posthogClient.identify(telemetryUserId);
      }

      if (event?.properties["$ip"]) {
        event.properties["$ip"] = null;
      }

      console.debug(
        "Telemetry opted in - UUID:",
        telemetryUserId,
        "sending event",
        event,
      );
      return event;
    },
    persistence: "localStorage",
  },
);

function App() {
  // Toast progress ref must be declared at component scope (not inside effects)
  const progressToastRef = useRef<string | number | null>(null);

  useEffect(() => {
    // Subscribe to navigation state changes
    const unsubscribe = router.subscribe("onResolved", (navigation) => {
      // Capture the navigation event in PostHog
      posthog.capture("navigation", {
        toPath: navigation.toLocation.pathname,
        fromPath: navigation.fromLocation?.pathname,
      });

      // Optionally capture as a standard pageview as well
      posthog.capture("$pageview", {
        path: navigation.toLocation.pathname,
      });
    });

    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  // Global toast notifications for app updates 
  useEffect(() => {
    const w = window as any;
    const handler = (_evt: any, payload: any) => {
      const type = payload?.type;
      if (type === "available") {
        const v = payload?.version ? ` v${payload.version}` : "";
        toast.info(`Nati update available${v}. Downloading…`);
      } else if (type === "download-progress") {
        const percent = Math.max(0, Math.min(100, Math.round(payload?.percent ?? 0)));
        const id = progressToastRef.current;
        const node = (
          <div className="min-w-[240px]">
            <div className="text-sm font-medium">Nati is downloading an update… {percent}%</div>
            <div className="mt-2 h-2 w-full rounded bg-white/20 overflow-hidden">
              <div className="h-2 rounded bg-blue-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
        if (id == null) {
          progressToastRef.current = toast.custom(() => node, { duration: Infinity });
        } else {
          toast.custom(() => node, { id, duration: Infinity });
        }
      } else if (type === "downloaded") {
        // Clear progress toast
        if (progressToastRef.current != null) {
          toast.dismiss(progressToastRef.current);
          progressToastRef.current = null;
        }
        const v = payload?.version ? ` v${payload.version}` : "";
        toast.custom((t) => (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-semibold">Nati update is ready{v}.</div>
              <div className="text-xs opacity-80">Restart to apply the update.</div>
            </div>
            <button
              className="ml-2 px-2 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={async () => {
                try {
                  await w?.electron?.ipcRenderer?.invoke("update:quit-and-install");
                } catch (e) {
                  showError(String(e));
                }
              }}
            >
              Restart now
            </button>
            <button
              className="px-2 py-1 text-xs rounded-md border hover:bg-white/10"
              onClick={() => toast.dismiss(t)}
            >
              Later
            </button>
          </div>
        ), { duration: Infinity });
      } else if (type === "error") {
        showError(payload?.message || "Update error");
      }
    };
    const off = w?.electron?.ipcRenderer?.on("update-status", handler);
    return () => {
      try { off?.(); } catch {}
      try { w?.electron?.ipcRenderer?.removeAllListeners?.("update-status"); } catch {}
    };
  }, []);

  // Listen for navigation requests from main process (e.g., tray menu)
  useEffect(() => {
    const handler = (payload: any) => {
      const to = payload?.to as string | undefined;
      const search = payload?.search as Record<string, any> | undefined;
      if (to) {
        router.navigate({ to, search });
      }
    };
    // @ts-ignore
    const off = (window as any).electron?.ipcRenderer?.on("navigate", handler);
    return () => {
      if (typeof off === "function") off();
      else
        // @ts-ignore - fallback
        (window as any).electron?.ipcRenderer?.removeAllListeners?.("navigate");
    };
  }, []);

  useEffect(() => {
    const ipc = IpcClient.getInstance();
    const unsubscribe = ipc.onMcpToolConsentRequest((payload) => {
      showMcpConsentToast({
        serverName: payload.serverName,
        toolName: payload.toolName,
        toolDescription: payload.toolDescription,
        inputPreview: payload.inputPreview,
        onDecision: (d) => ipc.respondToMcpConsentRequest(payload.requestId, d),
      });
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <UpdateModal />
      <RouterProvider router={router} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthogClient}>
        <App />
      </PostHogProvider>
    </QueryClientProvider>
  </StrictMode>,
);
