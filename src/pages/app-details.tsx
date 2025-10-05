import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  appBasePathAtom,
  appsListAtom,
  selectedAppIdAtom,
} from "@/atoms/appAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, MessageCircle, Pencil, Folder, Trash2, Copy } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitHubConnector } from "@/components/GitHubConnector";
import { SupabaseConnector } from "@/components/SupabaseConnector";
import { SupabaseDbBrowser } from "@/components/SupabaseDbBrowser";
import { showError } from "@/lib/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { invalidateAppQuery } from "@/hooks/useLoadApp";
import { useDebounce } from "@/hooks/useDebounce";
import { useCheckName } from "@/hooks/useCheckName";
import { AppUpgrades } from "@/components/AppUpgrades";
import { CapacitorControls } from "@/components/CapacitorControls";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function AppDetailsPage() {
  // Asset: NATIDB logo for DB Browser button
  const natiDbLogo = new URL('../../assets/icon/NATIDB.png', import.meta.url).href;
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ from: "/app-details" as const });
  const [appsList] = useAtom(appsListAtom);
  const { refreshApps } = useLoadApps();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isRenameConfirmDialogOpen, setIsRenameConfirmDialogOpen] =
    useState(false);
  const [renameFolderAlso, setRenameFolderAlso] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRenameFolderDialogOpen, setIsRenameFolderDialogOpen] =
    useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const appBasePath = useAtomValue(appBasePathAtom);

  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [newCopyAppName, setNewCopyAppName] = useState("");
  const [isDbBrowserOpen, setIsDbBrowserOpen] = useState(false);

  // When navigated from AppList with a contextual action, open the dialog
  useEffect(() => {
    if (!search) return;
    const action = (search as any).action as string | undefined;
    if (!action) return;
    if (action === "rename") {
      setIsRenameDialogOpen(true);
    } else if (action === "delete") {
      setIsDeleteDialogOpen(true);
    } else if (action === "db-browser") {
      setIsDbBrowserOpen(true);
    }
    // Clean the URL (remove action) without navigation flicker
    navigate({ to: "/app-details", search: { appId: (search as any).appId }, replace: true });
  }, [search]);

  

  const queryClient = useQueryClient();
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);

  const debouncedNewCopyAppName = useDebounce(newCopyAppName, 150);
  const { data: checkNameResult, isLoading: isCheckingName } = useCheckName(
    debouncedNewCopyAppName,
  );
  const nameExists = checkNameResult?.exists ?? false;

  // Get the appId from search params and find the corresponding app
  const appId = search.appId ? Number(search.appId) : null;
  const selectedApp = appId ? appsList.find((app) => app.id === appId) : null;

  // Keyboard shortcut: Ctrl/Cmd+Shift+D opens DB Browser
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (ctrlOrCmd && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        if (selectedApp?.supabaseProjectId) setIsDbBrowserOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedApp]);

  const handleDeleteApp = async () => {
    if (!appId) return;

    try {
      setIsDeleting(true);
      await IpcClient.getInstance().deleteApp(appId);
      setIsDeleteDialogOpen(false);
      await refreshApps();
      navigate({ to: "/", search: {} });
    } catch (error) {
      setIsDeleteDialogOpen(false);
      showError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenRenameDialog = () => {
    if (selectedApp) {
      setNewAppName(selectedApp.name);
      setIsRenameDialogOpen(true);
    }
  };

  const handleOpenRenameFolderDialog = () => {
    if (selectedApp) {
      setNewFolderName(selectedApp.path.split("/").pop() || selectedApp.path);
      setIsRenameFolderDialogOpen(true);
    }
  };

  const handleRenameApp = async (renameFolder: boolean) => {
    if (!appId || !selectedApp || !newAppName.trim()) return;

    try {
      setIsRenaming(true);

      // Determine the new path based on user's choice
      const appPath = renameFolder ? newAppName : selectedApp.path;

      await IpcClient.getInstance().renameApp({
        appId,
        appName: newAppName,
        appPath,
      });

      setIsRenameDialogOpen(false);
      setIsRenameConfirmDialogOpen(false);
      setRenameFolderAlso(false);
      await refreshApps();
    } catch (error) {
      console.error("Failed to rename app:", error);
      alert(
        `Error renaming app: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameFolderOnly = async () => {
    if (!appId || !selectedApp || !newFolderName.trim()) return;

    try {
      setIsRenamingFolder(true);

      await IpcClient.getInstance().renameApp({
        appId,
        appName: selectedApp.name, // Keep the app name the same
        appPath: newFolderName, // Change only the folder path
      });

      setIsRenameFolderDialogOpen(false);
      await refreshApps();
    } catch (error) {
      console.error("Failed to rename folder:", error);
      alert(
        `Error renaming folder: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCopyAppName(e.target.value);
  };

  const handleOpenCopyDialog = () => {
    if (selectedApp) {
      setNewCopyAppName(`${selectedApp.name}-copy`);
      setIsCopyDialogOpen(true);
    }
  };

  const copyAppMutation = useMutation({
    mutationFn: async ({ withHistory }: { withHistory: boolean }) => {
      if (!appId || !newCopyAppName.trim()) {
        throw new Error("Invalid app ID or name for copying.");
      }
      return IpcClient.getInstance().copyApp({
        appId,
        newAppName: newCopyAppName,
        withHistory,
      });
    },
    onSuccess: async (data) => {
      const appId = data.app.id;
      setSelectedAppId(appId);
      await invalidateAppQuery(queryClient, { appId });
      await refreshApps();
      await IpcClient.getInstance().createChat(appId);
      setIsCopyDialogOpen(false);
      navigate({ to: "/app-details", search: { appId } });
    },
    onError: (error) => {
      showError(error);
    },
  });

  if (!selectedApp) {
    return (
      <div className="relative min-h-screen p-8">
        <Button
          onClick={() => router.history.back()}
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 flex items-center gap-1 bg-(--background-lightest) py-5"
        >
          <ArrowLeft className="h-3 w-4" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold">App not found</h2>
        </div>
      </div>
    );
  }

  const fullAppPath = appBasePath.replace("$APP_BASE_PATH", selectedApp.path);

  return (
    <div
      className="relative min-h-screen p-3 sm:p-4 w-full bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black"
      data-testid="app-details-page"
    >
      <Button
        onClick={() => router.history.back()}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 flex items-center gap-1 bg-(--background-lightest) py-2"
      >
        <ArrowLeft className="h-3 w-4" />
        Back
      </Button>

      <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Left column: title/menu, metadata chips, sticky CTA */}
          <div className="lg:col-span-5">
            <div className="relative p-4 sm:p-5 rounded-2xl glass-surface border shadow-sm">
              <div className="flex items-start gap-2">
                <h2 className="text-xl sm:text-2xl font-bold glass-contrast-text flex-1 truncate">{selectedApp.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-7 w-7 hover:bg-white/70 dark:hover:bg-white/10"
                  onClick={handleOpenRenameDialog}
                  data-testid="app-details-rename-app-button"
                  title="Rename app"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-white/70 dark:hover:bg-white/10"
                      data-testid="app-details-more-options-button"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-2 glass-surface" align="end">
                    <div className="flex flex-col space-y-0.5">
                      <Button onClick={handleOpenRenameFolderDialog} variant="ghost" size="sm" className="h-8 justify-start text-xs hover:bg-white/70 dark:hover:bg-white/10">Rename folder</Button>
                      <Button onClick={handleOpenCopyDialog} variant="ghost" size="sm" className="h-8 justify-start text-xs hover:bg-white/70 dark:hover:bg-white/10">Copy app</Button>
                      <Button onClick={() => setIsDeleteDialogOpen(true)} variant="ghost" size="sm" className="h-8 justify-start text-xs hover:bg-white/70 dark:hover:bg-white/10">Delete</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Action bar */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    if (!appId) return;
                    navigate({ to: "/chat" });
                  }}
                  className="cursor-pointer w-full py-3 sm:py-4 flex justify-center items-center gap-2 glass-surface glass-hover border text-zinc-900 dark:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open in Chat
                </Button>
                <div className="flex gap-2 flex-col xs:flex-row sm:flex-row">
                  <Button onClick={handleOpenCopyDialog} variant="outline" className="flex-1 glass-button glass-hover"><Copy className="h-4 w-4 mr-1" />Copy</Button>
                  <Button onClick={() => setIsDeleteDialogOpen(true)} variant="destructive" className="flex-1 cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-1" />Delete
                  </Button>
                </div>
              </div>

              {/* Metadata section: stacked and readable on small screens */}
              <div className="mt-4 mb-1 space-y-2 text-[12px]">
                <div className="px-2 py-1 rounded-full bg-white/70 text-zinc-700 shadow-sm dark:bg-white/10 dark:text-zinc-200 border border-white/60 dark:border-white/5">
                  Created: {new Date().toLocaleString()}
                </div>
                <div className="px-2 py-1 rounded-full bg-white/70 text-zinc-700 shadow-sm dark:bg-white/10 dark:text-zinc-200 border border-white/60 dark:border-white/5">
                  Updated: {new Date().toLocaleString()}
                </div>
                <div className="px-2 py-2 rounded-xl bg-white/70 text-zinc-700 shadow-sm dark:bg-white/10 dark:text-zinc-200 border border-white/60 dark:border-white/5">
                  <div className="text-[11px] uppercase tracking-wide opacity-80">Path</div>
                  <div className="mt-0.5 font-mono break-all whitespace-pre-wrap">
                    {fullAppPath}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 py-0.5 hover:bg-white/70 dark:hover:bg-white/10 justify-start w-fit"
                  onClick={() => IpcClient.getInstance().showItemInFolder(fullAppPath)}
                  title="Show in File Explorer"
                >
                  <Folder className="h-3.5 w-3.5" />
                  <span className="ml-1">Show in File Explorer</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right column: Collapsible sections */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="p-3 sm:p-4 rounded-2xl glass-surface border shadow-sm">
              <Accordion type="single" collapsible defaultValue="integrations">
                <AccordionItem value="integrations">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Integrations</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="border rounded-md p-3 sm:p-4 glass-surface">
                        <GitHubConnector appId={appId} folderName={selectedApp.path} />
                      </div>
                      {appId && <SupabaseConnector appId={appId} />}
                      {(appId && (selectedApp as any).supabaseProjectId) && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!appId) return;
                              navigate({ to: "/db-browser", search: { appId: Number(appId) } });
                            }}
                            className="cursor-pointer"
                          >
                            <img src={natiDbLogo} alt="DB" className="h-4 w-auto mr-1 object-contain" />
                            Open DB Browser
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="mobile">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Mobile Development</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2">
                      {appId && <CapacitorControls appId={appId} />}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="upgrades">
                  <AccordionTrigger className="cursor-pointer">
                    <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Upgrades</div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-2">
                      <AppUpgrades appId={appId} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="max-w-sm p-4">
            <DialogHeader className="pb-2">
              <DialogTitle>Rename App</DialogTitle>
            </DialogHeader>
            <div className="relative my-2">
              <Input
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newAppName.trim() && !isRenaming) {
                    setIsRenameDialogOpen(false);
                    setIsRenameConfirmDialogOpen(true);
                  }
                }}
                placeholder="Enter new app name"
                className="pr-14"
                autoFocus
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] opacity-70">Enter</span>
            </div>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRenameDialogOpen(false)}
                disabled={isRenaming}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsRenameDialogOpen(false);
                  setIsRenameConfirmDialogOpen(true);
                }}
                disabled={isRenaming || !newAppName.trim()}
                size="sm"
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Confirm Dialog */}
        <Dialog open={isRenameConfirmDialogOpen} onOpenChange={setIsRenameConfirmDialogOpen}>
          <DialogContent
            className="max-w-sm p-4"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newAppName.trim() && !isRenaming) {
                handleRenameApp(renameFolderAlso);
              }
            }}
          >
            <DialogHeader className="pb-2">
              <DialogTitle>Confirm rename</DialogTitle>
              <DialogDescription className="text-xs">
                You are about to rename the app to <span className="font-medium">{newAppName || "(empty)"}</span>.
              </DialogDescription>
            </DialogHeader>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renameFolderAlso}
                onChange={(e) => setRenameFolderAlso(e.target.checked)}
              />
              Also rename the folder on disk
            </label>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"></div>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRenameConfirmDialogOpen(false)}
                disabled={isRenaming}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRenameApp(renameFolderAlso)}
                disabled={isRenaming || !newAppName.trim()}
                size="sm"
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Folder Dialog */}
        <Dialog
          open={isRenameFolderDialogOpen}
          onOpenChange={setIsRenameFolderDialogOpen}
        >
          <DialogContent className="max-w-sm p-4">
            <DialogHeader className="pb-2">
              <DialogTitle>Rename app folder</DialogTitle>
              <DialogDescription className="text-xs">
                This will change only the folder name, not the app name.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter new folder name"
              className="my-2"
              autoFocus
            />
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRenameFolderDialogOpen(false)}
                disabled={isRenamingFolder}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameFolderOnly}
                disabled={isRenamingFolder || !newFolderName.trim()}
                size="sm"
              >
                {isRenamingFolder ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Renaming...
                  </>
                ) : (
                  "Rename Folder"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Copy App Dialog */}
        {selectedApp && (
          <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
            <DialogContent className="max-w-md p-4">
              <DialogHeader className="pb-2">
                <DialogTitle>Copy "{selectedApp.name}"</DialogTitle>
                <DialogDescription className="text-sm">
                  <p>Create a copy of this app.</p>
                  <p>
                    Note: this does not copy over the Supabase project or GitHub
                    project.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 my-2">
                <div>
                  <Label htmlFor="newAppName">New app name</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newAppName"
                      value={newCopyAppName}
                      onChange={handleAppNameChange}
                      placeholder="Enter new app name"
                      className="pr-8"
                      disabled={copyAppMutation.isPending}
                    />
                    {isCheckingName && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {nameExists && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      An app with this name already exists. Please choose
                      another name.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start p-2 h-auto relative text-sm"
                    onClick={() =>
                      copyAppMutation.mutate({ withHistory: true })
                    }
                    disabled={
                      copyAppMutation.isPending ||
                      nameExists ||
                      !newCopyAppName.trim() ||
                      isCheckingName
                    }
                  >
                    {copyAppMutation.isPending &&
                      copyAppMutation.variables?.withHistory === true && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    <div className="absolute top-1 right-1">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 text-[10px]">
                        Recommended
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-xs">
                        Copy app with history
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Copies the entire app, including the Git version
                        history.
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start p-2 h-auto text-sm"
                    onClick={() =>
                      copyAppMutation.mutate({ withHistory: false })
                    }
                    disabled={
                      copyAppMutation.isPending ||
                      nameExists ||
                      !newCopyAppName.trim() ||
                      isCheckingName
                    }
                  >
                    {copyAppMutation.isPending &&
                      copyAppMutation.variables?.withHistory === false && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    <div className="text-left">
                      <p className="font-medium text-xs">
                        Copy app without history
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Useful if the current app has a Git-related issue.
                      </p>
                    </div>
                  </Button>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                  disabled={copyAppMutation.isPending}
                  size="sm"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DB Browser Modal */}
        {appId && (
          <Dialog open={isDbBrowserOpen} onOpenChange={setIsDbBrowserOpen}>
            <DialogContent className="max-w-7xl w-[96vw] h-[90vh] p-0 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background/80 backdrop-blur">
                  <DialogTitle>Supabase DB Browser</DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsDbBrowserOpen(false)}>
                    Close
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
                  <SupabaseDbBrowser appId={appId} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-sm p-4 rounded-2xl glass-surface border shadow-sm backdrop-blur-md select-none">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Trash2 className="h-4 w-4" /> Delete "{selectedApp.name}"?
              </DialogTitle>
              <DialogDescription className="text-xs glass-contrast-text">
                This action is irreversible. All app files and chat history will
                be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                size="sm"
                className="rounded-xl glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteApp}
                disabled={isDeleting}
                className="rounded-xl shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 flex items-center gap-1"
                size="sm"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete App"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
