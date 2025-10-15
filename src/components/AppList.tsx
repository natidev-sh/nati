import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow, isToday, isYesterday, differenceInCalendarDays } from "date-fns";
import { PlusCircle, Search, ChevronRight, Users } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useSharedApps } from "@/hooks/useSharedApps";
import { useMemo, useState, useEffect } from "react";
import { AppSearchDialog } from "./AppSearchDialog";

export function AppList({ show }: { show?: boolean }) {
  const navigate = useNavigate();
  const [selectedAppId, setSelectedAppId] = useAtom(selectedAppIdAtom);
  const setSelectedChatId = useSetAtom(selectedChatIdAtom);
  const { apps, loading, error } = useLoadApps();
  const { sharedApps, loading: sharedLoading } = useSharedApps();
  // search dialog state
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const allApps = useMemo(
    () =>
      apps.map((a) => ({
        id: a.id,
        name: a.name,
        createdAt: a.createdAt,
        matchedChatTitle: null,
        matchedChatMessage: null,
      })),
    [apps],
  );

  type Group = { label: string; items: Array<(typeof allApps)[number]> };
  const grouped = useMemo<Group[]>(() => {
    const sorted = [...allApps].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const today: typeof allApps = [];
    const yesterday: typeof allApps = [];
    const week: typeof allApps = [];
    const older: typeof allApps = [];
    for (const app of sorted) {
      const d = new Date(app.createdAt);
      if (isToday(d)) today.push(app);
      else if (isYesterday(d)) yesterday.push(app);
      else if (differenceInCalendarDays(new Date(), d) <= 7) week.push(app);
      else older.push(app);
    }
    const out: Group[] = [];
    if (today.length) out.push({ label: "Today", items: today });
    if (yesterday.length) out.push({ label: "Yesterday", items: yesterday });
    if (week.length) out.push({ label: "This week", items: week });
    if (older.length) out.push({ label: "Older", items: older });
    return out;
  }, [allApps]);

  // Context menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menuAppId, setMenuAppId] = useState<number | null>(null);
  useEffect(() => {
    const onDocClick = () => setMenuOpen(false);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("contextmenu", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("contextmenu", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);
  if (!show) {
    return null;
  }

  const handleAppClick = (id: number) => {
    setSelectedAppId(id);
    setSelectedChatId(null);
    setIsSearchDialogOpen(false);
    navigate({
      to: "/",
      search: { appId: id },
    });
  };

  const handleNewApp = () => {
    navigate({ to: "/" });
    // We'll eventually need a create app workflow
  };

  const openContextMenu = (e: React.MouseEvent, appId: number) => {
    e.preventDefault();
    setSelectedAppId(appId);
    setMenuAppId(appId);
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 120);
    setMenuPos({ x, y });
    setMenuOpen(true);
  };

  const onOpenInChat = () => {
    if (menuAppId == null) return;
    setSelectedAppId(menuAppId);
    navigate({ to: "/chat" });
    setMenuOpen(false);
  };

  const onRename = () => {
    if (menuAppId == null) return;
    navigate({ to: "/app-details", search: { appId: menuAppId, action: "rename" } as any });
    setMenuOpen(false);
  };

  const onDelete = () => {
    if (menuAppId == null) return;
    navigate({ to: "/app-details", search: { appId: menuAppId, action: "delete" } as any });
    setMenuOpen(false);
  };

  return (
    <>
      <SidebarGroup
        className="overflow-y-auto h-[calc(100vh-112px)] select-none"
        data-testid="app-list-container"
      >
        <SidebarGroupLabel className="px-3 py-2 glass-contrast-text text-[11px] uppercase tracking-wide opacity-70">
          Your Apps
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleNewApp}
              variant="outline"
              className="flex items-center justify-start gap-2 mx-2 py-2 rounded-xl glass-surface glass-hover ring-1 ring-white/10 dark:ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/40 dark:focus-visible:ring-white/20"
            >
              <PlusCircle size={16} />
              <span>New App</span>
            </Button>
            <Button
              onClick={() => setIsSearchDialogOpen(!isSearchDialogOpen)}
              variant="outline"
              className="flex items-center justify-start gap-2 mx-2 py-2.5 rounded-xl glass-surface glass-hover ring-1 ring-white/10 dark:ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/40 dark:focus-visible:ring-white/20"
              data-testid="search-apps-button"
            >
              <Search size={16} />
              <span>Search Apps</span>
            </Button>

            {loading ? (
              <div className="mx-2 mt-1 p-3 text-sm rounded-xl glass-surface glass-contrast-text">
                Loading apps...
              </div>
            ) : error ? (
              <div className="mx-2 mt-1 p-3 text-sm rounded-xl glass-surface glass-contrast-text">
                Error loading apps
              </div>
            ) : apps.length === 0 ? (
              <div className="mx-2 mt-1 p-3 text-sm rounded-xl glass-surface glass-contrast-text">
                No apps found
              </div>
            ) : (
              <div className="space-y-2" data-testid="app-list">
                {grouped.map((group) => (
                  <div key={group.label}>
                    <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide opacity-70 glass-contrast-text">
                      {group.label}
                    </div>
                    <SidebarMenu className="space-y-1">
                      {group.items.map((app) => (
                        <SidebarMenuItem key={app.id} className="mb-1">
                          <Button
                            variant="ghost"
                            onClick={() => handleAppClick(app.id)}
                            onContextMenu={(e) => openContextMenu(e, app.id)}
                            className={`group cursor-pointer justify-between w-full text-left py-2.5 px-3 rounded-xl transition-colors min-h-[40px] ${
                              selectedAppId === app.id
                                ? "glass-surface glass-active ring-1 ring-white/30 dark:ring-white/10 shadow-sm"
                                : "glass-surface/80 glass-hover hover:ring-1 hover:ring-white/15 dark:hover:ring-white/10"
                            }`}
                            data-testid={`app-list-item-${app.name}`}
                          >
                            <div className="flex items-center w-full gap-2.5 glass-contrast-text">
                              <div className="h-5 w-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] shrink-0">
                                {String(app.name).trim().charAt(0).toUpperCase() || "A"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate block text-[13px] font-medium" title={app.name}>
                                    {app.name}
                                  </span>
                                  <span className="shrink-0 text-[10px] opacity-70 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                                    {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={14} className="opacity-40 group-hover:opacity-70 transition-opacity" />
                          </Button>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Shared Apps Section */}
            {sharedApps.length > 0 && (
              <div className="mt-4">
                <div className="px-3 py-2 text-[11px] uppercase tracking-wide opacity-70 glass-contrast-text flex items-center gap-2">
                  <Users size={12} />
                  Team Shared Apps ({sharedApps.length})
                </div>
                <div className="space-y-1">
                  {sharedApps.map((sharedApp) => (
                    <div key={sharedApp.id} className="mx-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          // Check if this app exists locally by desktop_app_id
                          const localApp = apps.find(app => app.id.toString() === sharedApp.desktop_app_id)
                          if (localApp) {
                            // Open the local app
                            handleAppClick(localApp.id)
                          } else {
                            // Show info about the shared app
                            navigate({ to: "/teams" })
                          }
                        }}
                        className="w-full p-3 rounded-xl glass-surface/80 glass-hover hover:ring-1 hover:ring-white/15 text-left h-auto cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                            {sharedApp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-medium glass-contrast-text truncate" title={sharedApp.name}>
                                {sharedApp.name}
                              </span>
                              <Users size={10} className="text-blue-500 shrink-0" />
                            </div>
                            <div className="text-[10px] opacity-70 glass-contrast-text">
                              {sharedApp.team_name}
                            </div>
                            <div className="text-[10px] opacity-50 glass-contrast-text mt-0.5 truncate">
                              {sharedApp.path}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Context menu */}
      {menuOpen && (
        <div
          className="fixed z-50 min-w-[180px] rounded-xl glass-surface border shadow-sm backdrop-blur-md py-1 text-sm"
          style={{ left: menuPos.x, top: menuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="w-full text-left px-3 py-2 hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer" onClick={onOpenInChat}>Open in Chat</button>
          <div className="h-px bg-white/20 dark:bg-white/10 my-1" />
          <button className="w-full text-left px-3 py-2 hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer" onClick={onRename}>Rename</button>
          <button className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer" onClick={onDelete}>Delete</button>
        </div>
      )}
      <AppSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSelectApp={handleAppClick}
        allApps={allApps}
      />
    </>
  );
}
