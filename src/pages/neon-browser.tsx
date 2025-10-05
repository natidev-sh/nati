import { Button } from "@/components/ui/button";
import { IpcClient } from "@/ipc/ipc_client";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function NeonBrowserPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/neon-browser" as const });
  const appId = (search as any)?.appId ? Number((search as any).appId) : null;

  if (!appId) {
    return <div className="p-6" />;
  }

  return (
    <div className="h-[100dvh] flex flex-col w-screen max-w-none">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur w-screen max-w-none">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v2H3V5Zm0 4h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm5 3v2h8v-2H8Z"/></svg>
            <div className="text-base font-semibold">Neon Database</div>
            <div className="text-xs opacity-70">App ID: {appId}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/app-details", search: { appId } as any })}
            >
              Back to App
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-screen max-w-none">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="rounded-lg border border-white/10 p-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Neon in-app SQL editing is not yet wired. Use the Neon Console for full Database Studio and SQL Editor features. This will open in your browser.
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => IpcClient.getInstance().openExternalUrl("https://console.neon.tech/")}>Open Neon Console</Button>
              <Button variant="outline" onClick={() => IpcClient.getInstance().openExternalUrl("https://console.neon.tech/sql")}>Open SQL Editor</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
