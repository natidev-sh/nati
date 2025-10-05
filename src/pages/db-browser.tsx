import { Button } from "@/components/ui/button";
import { SupabaseDbBrowser } from "@/components/SupabaseDbBrowser";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IpcClient } from "@/ipc/ipc_client";

export default function DbBrowserPage() {
  const natiDbLogo = new URL('../../assets/icon/NATIDB.png', import.meta.url).href;
  const navigate = useNavigate();
  const search = useSearch({ from: "/db-browser" as const });
  const appId = search.appId ? Number(search.appId) : null;
  const [appName, setAppName] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ tables: number; functions: number; policies: number }>({ tables: 0, functions: 0, policies: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appId) return;
      try {
        const app = await IpcClient.getInstance().getApp(appId);
        if (mounted) setAppName(app?.name ?? null);
      } catch {
        if (mounted) setAppName(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [appId]);

  // Fetch schema just to compute top-level counts (tables/functions/policies)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!appId) return;
      try {
        const res = await IpcClient.getInstance().getSupabaseSchema(appId);
        const data = res?.schema ?? res;
        const rows: any[] = Array.isArray(data) ? data : (data?.rows || data?.data || []);
        let tables = 0, functions = 0, policies = 0;
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const t = String(row.result_type || row.resultType || row.type || "").toLowerCase();
            if (t.includes("table")) tables += 1;
            else if (t.includes("function")) functions += 1;
            else if (t.includes("policy")) policies += 1;
          }
        }
        if (mounted) setCounts({ tables, functions, policies });
      } catch {
        if (mounted) setCounts({ tables: 0, functions: 0, policies: 0 });
      }
    })();
    return () => { mounted = false; };
  }, [appId]);

  if (!appId) {
    return (
      <div className="p-6">
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col w-full">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <img src={natiDbLogo} alt="DB" className="h-4 w-auto object-contain" />
            <div className="text-base font-semibold">Database Browser</div>
            <div className="text-xs opacity-70">App: {appName ?? `App ${appId}`}</div>
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <span className="text-[11px] opacity-70 border rounded px-1 py-0.5">Tables: {counts.tables}</span>
              <span className="text-[11px] opacity-70 border rounded px-1 py-0.5">Functions: {counts.functions}</span>
              <span className="text-[11px] opacity-70 border rounded px-1 py-0.5">Policies: {counts.policies}</span>
            </div>
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4">
          <SupabaseDbBrowser appId={appId} />
        </div>
      </div>
    </div>
  );
}
