import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Github,
  Clipboard,
  Check,
  AlertTriangle,
  ChevronRight,
  Plus,
  Link2,
} from "lucide-react";
import { IpcClient } from "@/ipc/ipc_client";
import { useSettings } from "@/hooks/useSettings";
import { useLoadApp } from "@/hooks/useLoadApp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GitHubConnectorProps {
  appId: number | null;
  folderName: string;
  expanded?: boolean;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
}

interface GitHubBranch {
  name: string;
  commit: { sha: string };
}

interface ConnectedGitHubConnectorProps {
  appId: number;
  app: any;
  refreshApp: () => void;
  triggerAutoSync?: boolean;
  onAutoSyncComplete?: () => void;
}

interface UnconnectedGitHubConnectorProps {
  appId: number | null;
  folderName: string;
  settings: any;
  refreshSettings: () => void;
  handleRepoSetupComplete: () => void;
  expanded?: boolean;
}

function ConnectedGitHubConnector({
  appId,
  app,
  refreshApp,
  triggerAutoSync,
  onAutoSyncComplete,
}: ConnectedGitHubConnectorProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [showForceDialog, setShowForceDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const autoSyncTriggeredRef = useRef(false);

  const handleDisconnectRepo = async () => {
    setIsDisconnecting(true);
    setDisconnectError(null);
    try {
      await IpcClient.getInstance().disconnectGithubRepo(appId);
      refreshApp();
    } catch (err: any) {
      setDisconnectError(err.message || "Failed to disconnect repository.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncToGithub = useCallback(
    async (force: boolean = false) => {
      setIsSyncing(true);
      setSyncError(null);
      setSyncSuccess(false);
      setShowForceDialog(false);

      try {
        const result = await IpcClient.getInstance().syncGithubRepo(
          appId,
          force,
        );
        if (result.success) {
          setSyncSuccess(true);
        } else {
          setSyncError(result.error || "Failed to sync to GitHub.");
          // If it's a push rejection error, show the force dialog
          if (
            result.error?.includes("rejected") ||
            result.error?.includes("non-fast-forward")
          ) {
            // Don't show force dialog immediately, let user see the error first
          }
        }
      } catch (err: any) {
        setSyncError(err.message || "Failed to sync to GitHub.");
      } finally {
        setIsSyncing(false);
      }
    },
    [appId],
  );

  // Auto-sync when triggerAutoSync prop is true
  useEffect(() => {
    if (triggerAutoSync && !autoSyncTriggeredRef.current) {
      autoSyncTriggeredRef.current = true;
      handleSyncToGithub(false).finally(() => {
        onAutoSyncComplete?.();
      });
    } else if (!triggerAutoSync) {
      // Reset the ref when triggerAutoSync becomes false
      autoSyncTriggeredRef.current = false;
    }
  }, [triggerAutoSync]); // Only depend on triggerAutoSync to avoid unnecessary re-runs

  return (
    <div className="w-full" data-testid="github-connected-repo">
      <div className="flex items-center gap-2 mb-2">
        <Github className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
        <p className="text-sm text-zinc-700 dark:text-zinc-300 m-0">
          Connected to GitHub Repo
        </p>
      </div>
      <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass-surface/80 ring-1 ring-white/10 dark:ring-white/10 text-blue-700 dark:text-blue-300">
        <a
        onClick={(e) => {
          e.preventDefault();
          IpcClient.getInstance().openExternalUrl(
            `https://github.com/${app.githubOrg}/${app.githubRepo}`,
          );
        }}
        className="inline-block cursor-pointer hover:underline font-medium"
        target="_blank"
        rel="noopener noreferrer"
      >
        {app.githubOrg}/{app.githubRepo}
        </a>
        {app.githubBranch && (
          <span className="text-[11px] opacity-70">• {app.githubBranch}</span>
        )}
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <Button onClick={() => handleSyncToGithub(false)} disabled={isSyncing} className="sm:min-w-[150px]">
          {isSyncing ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                style={{ display: "inline" }}
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
              Syncing...
            </>
          ) : (
            "Sync to GitHub"
          )}
        </Button>
        <Button
          onClick={handleDisconnectRepo}
          disabled={isDisconnecting}
          variant="outline"
          className="sm:min-w-[180px]"
        >
          {isDisconnecting ? "Disconnecting..." : "Disconnect from repo"}
        </Button>
      </div>
      {syncError && (
        <div className="mt-3">
          <p className="text-sm text-red-700 dark:text-red-400">
            {syncError}{" "}
            <a
              onClick={(e) => {
                e.preventDefault();
                IpcClient.getInstance().openExternalUrl(
                  "https://www.natidev.com/docs/integrations/github#troubleshooting",
                );
              }}
              className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              See troubleshooting guide
            </a>
          </p>
          {(syncError.includes("rejected") ||
            syncError.includes("non-fast-forward")) && (
            <Button
              onClick={() => setShowForceDialog(true)}
              variant="outline"
              size="sm"
              className="mt-2 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Force Push (Dangerous)
            </Button>
          )}
        </div>
      )}
      {syncSuccess && (
        <p className="text-sm text-green-700 dark:text-green-400 mt-2">Successfully pushed to GitHub!</p>
      )}
      {disconnectError && (
        <p className="text-sm text-red-700 dark:text-red-400 mt-2">{disconnectError}</p>
      )}

      {/* Force Push Warning Dialog */}
      <Dialog open={showForceDialog} onOpenChange={setShowForceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Force Push Warning
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>
                  You are about to perform a <strong>force push</strong> to your
                  GitHub repository.
                </p>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>
                      This is dangerous and non-reversible and will:
                    </strong>
                  </p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 list-disc list-inside mt-2 space-y-1">
                    <li>Overwrite the remote repository history</li>
                    <li>
                      Permanently delete commits that exist on the remote but
                      not locally
                    </li>
                  </ul>
                </div>
                <p className="text-sm">
                  Only proceed if you're certain this is what you want to do.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForceDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleSyncToGithub(true)}
              disabled={isSyncing}
            >
              {isSyncing ? "Force Pushing..." : "Force Push"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UnconnectedGitHubConnector({
  appId,
  folderName,
  settings,
  refreshSettings,
  handleRepoSetupComplete,
  expanded,
}: UnconnectedGitHubConnectorProps) {
  // --- Collapsible State ---
  const [isExpanded, setIsExpanded] = useState(expanded || false);

  // --- GitHub Device Flow State ---
  const [githubUserCode, setGithubUserCode] = useState<string | null>(null);
  const [githubVerificationUri, setGithubVerificationUri] = useState<
    string | null
  >(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [isConnectingToGithub, setIsConnectingToGithub] = useState(false);
  const [githubStatusMessage, setGithubStatusMessage] = useState<string | null>(
    null,
  );
  const [codeCopied, setCodeCopied] = useState(false);

  // --- Repo Setup State ---
  const [repoSetupMode, setRepoSetupMode] = useState<"create" | "existing">(
    "create",
  );
  const [availableRepos, setAvailableRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [availableBranches, setAvailableBranches] = useState<GitHubBranch[]>(
    [],
  );
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [branchInputMode, setBranchInputMode] = useState<"select" | "custom">(
    "select",
  );
  const [customBranchName, setCustomBranchName] = useState<string>("");

  // Create new repo state
  const [repoName, setRepoName] = useState(folderName);
  const [repoAvailable, setRepoAvailable] = useState<boolean | null>(null);
  const [repoCheckError, setRepoCheckError] = useState<string | null>(null);
  const [isCheckingRepo, setIsCheckingRepo] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [createRepoError, setCreateRepoError] = useState<string | null>(null);
  const [createRepoSuccess, setCreateRepoSuccess] = useState<boolean>(false);

  // Assume org is the authenticated user for now (could add org input later)
  const githubOrg = ""; // Use empty string for now (GitHub API will default to the authenticated user)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleConnectToGithub = async () => {
    if (!appId) return;
    setIsConnectingToGithub(true);
    setGithubError(null);
    setGithubUserCode(null);
    setGithubVerificationUri(null);
    setGithubStatusMessage("Requesting device code from GitHub...");

    // Send IPC message to main process to start the flow
    IpcClient.getInstance().startGithubDeviceFlow(appId);
  };

  useEffect(() => {
    if (!appId) return; // Don't set up listeners if appId is null initially

    const cleanupFunctions: (() => void)[] = [];

    // Listener for updates (user code, verification uri, status messages)
    const removeUpdateListener =
      IpcClient.getInstance().onGithubDeviceFlowUpdate((data) => {
        console.log("Received github:flow-update", data);
        if (data.userCode) {
          setGithubUserCode(data.userCode);
        }
        if (data.verificationUri) {
          setGithubVerificationUri(data.verificationUri);
        }
        if (data.message) {
          setGithubStatusMessage(data.message);
        }

        setGithubError(null); // Clear previous errors on new update
        if (!data.userCode && !data.verificationUri && data.message) {
          // Likely just a status message, keep connecting state
          setIsConnectingToGithub(true);
        }
        if (data.userCode && data.verificationUri) {
          setIsConnectingToGithub(true); // Still connecting until success/error
        }
      });
    cleanupFunctions.push(removeUpdateListener);

    // Listener for success
    const removeSuccessListener =
      IpcClient.getInstance().onGithubDeviceFlowSuccess((data) => {
        console.log("Received github:flow-success", data);
        setGithubStatusMessage("Successfully connected to GitHub!");
        setGithubUserCode(null); // Clear user-facing info
        setGithubVerificationUri(null);
        setGithubError(null);
        setIsConnectingToGithub(false);
        refreshSettings();
        setIsExpanded(true);
      });
    cleanupFunctions.push(removeSuccessListener);

    // Listener for errors
    const removeErrorListener = IpcClient.getInstance().onGithubDeviceFlowError(
      (data) => {
        console.log("Received github:flow-error", data);
        setGithubError(data.error || "An unknown error occurred.");
        setGithubStatusMessage(null);
        setGithubUserCode(null);
        setGithubVerificationUri(null);
        setIsConnectingToGithub(false);
      },
    );
    cleanupFunctions.push(removeErrorListener);

    // Cleanup function to remove all listeners when component unmounts or appId changes
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
      // Reset state when appId changes or component unmounts
      setGithubUserCode(null);
      setGithubVerificationUri(null);
      setGithubError(null);
      setIsConnectingToGithub(false);
      setGithubStatusMessage(null);
    };
  }, [appId]); // Re-run effect if appId changes

  // Load available repos when GitHub is connected
  useEffect(() => {
    if (settings?.githubAccessToken && repoSetupMode === "existing") {
      loadAvailableRepos();
    }
  }, [settings?.githubAccessToken, repoSetupMode]);

  const loadAvailableRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await IpcClient.getInstance().listGithubRepos();
      setAvailableRepos(repos);
    } catch (error) {
      console.error("Failed to load GitHub repos:", error);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Load branches when a repo is selected
  useEffect(() => {
    if (selectedRepo && repoSetupMode === "existing") {
      loadRepoBranches();
    }
  }, [selectedRepo, repoSetupMode]);

  const loadRepoBranches = async () => {
    if (!selectedRepo) return;

    setIsLoadingBranches(true);
    setBranchInputMode("select"); // Reset to select mode when loading new repo
    setCustomBranchName(""); // Clear custom branch name
    try {
      const [owner, repo] = selectedRepo.split("/");
      const branches = await IpcClient.getInstance().getGithubRepoBranches(
        owner,
        repo,
      );
      setAvailableBranches(branches);
      // Default to main if available, otherwise first branch
      const defaultBranch =
        branches.find((b) => b.name === "main" || b.name === "master") ||
        branches[0];
      if (defaultBranch) {
        setSelectedBranch(defaultBranch.name);
      }
    } catch (error) {
      console.error("Failed to load repo branches:", error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const checkRepoAvailability = useCallback(
    async (name: string) => {
      setRepoCheckError(null);
      setRepoAvailable(null);
      if (!name) return;
      setIsCheckingRepo(true);
      try {
        const result = await IpcClient.getInstance().checkGithubRepoAvailable(
          githubOrg,
          name,
        );
        setRepoAvailable(result.available);
        if (!result.available) {
          setRepoCheckError(
            result.error || "Repository name is not available.",
          );
        }
      } catch (err: any) {
        setRepoCheckError(err.message || "Failed to check repo availability.");
      } finally {
        setIsCheckingRepo(false);
      }
    },
    [githubOrg],
  );

  const debouncedCheckRepoAvailability = useCallback(
    (name: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        checkRepoAvailability(name);
      }, 500);
    },
    [checkRepoAvailability],
  );

  const handleSetupRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    setCreateRepoError(null);
    setIsCreatingRepo(true);
    setCreateRepoSuccess(false);

    try {
      if (repoSetupMode === "create") {
        await IpcClient.getInstance().createGithubRepo(
          githubOrg,
          repoName,
          appId,
          selectedBranch,
        );
      } else {
        const [owner, repo] = selectedRepo.split("/");
        const branchToUse =
          branchInputMode === "custom" ? customBranchName : selectedBranch;
        await IpcClient.getInstance().connectToExistingGithubRepo(
          owner,
          repo,
          branchToUse,
          appId,
        );
      }

      setCreateRepoSuccess(true);
      setRepoCheckError(null);
      handleRepoSetupComplete();
    } catch (err: any) {
      setCreateRepoError(
        err.message ||
          `Failed to ${repoSetupMode === "create" ? "create" : "connect to"} repository.`,
      );
    } finally {
      setIsCreatingRepo(false);
    }
  };

  if (!settings?.githubAccessToken) {
    return (
      <div className="mt-1 w-full" data-testid="github-unconnected-repo">
        <Button
          onClick={handleConnectToGithub}
          className="cursor-pointer w-full py-5 flex justify-center items-center gap-2 rounded-xl shadow-sm glass-surface glass-hover ring-1 ring-white/10 dark:ring-white/10"
          size="lg"
          variant="outline"
          disabled={isConnectingToGithub || !appId} // Also disable if appId is null
        >
          <Github className="h-5 w-5" />
          Connect to GitHub
          {isConnectingToGithub && (
            <svg
              className="animate-spin h-5 w-5 ml-2"
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
          )}
        </Button>
        {/* GitHub Connection Status/Instructions */}
        {(githubUserCode || githubStatusMessage || githubError) && (
          <div className="mt-6 p-4 rounded-2xl glass-surface/80 ring-1 ring-white/10 dark:ring-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                <h4 className="m-0 text-sm font-semibold glass-contrast-text">GitHub Connection</h4>
              </div>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">Device flow</span>
            </div>

            {githubError && (
              <div className="mb-3 text-sm text-red-700 dark:text-red-400">
                Error: {githubError}
              </div>
            )}

            {githubUserCode && githubVerificationUri && (
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ed3279] to-[#6a4cff] text-white text-[11px] shadow-sm">1</span>
                  <div className="flex-1">
                    <div className="text-sm glass-contrast-text">Open the GitHub device page</div>
                    <div className="mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 rounded-lg cursor-pointer ring-1 ring-white/10 dark:ring-white/10"
                        onClick={() => IpcClient.getInstance().openExternalUrl(githubVerificationUri)}
                      >
                        https://github.com/login/device
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ed3279] to-[#6a4cff] text-white text-[11px] shadow-sm">2</span>
                  <div className="flex-1">
                    <div className="text-sm glass-contrast-text">Enter this code</div>
                    <div className="mt-1 inline-flex items-center gap-2">
                      <span className="font-mono tracking-wider text-base px-2.5 py-1 rounded-md bg-white/80 text-gray-900 border border-black/10 dark:bg-white/10 dark:text-white dark:border-white/15 select-none">
                        {githubUserCode}
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center p-1.5 rounded-md hover:bg-white/70 dark:hover:bg-white/10 border border-transparent"
                        onClick={() => {
                          if (githubUserCode) {
                            navigator.clipboard
                              .writeText(githubUserCode)
                              .then(() => {
                                setCodeCopied(true);
                                setTimeout(() => setCodeCopied(false), 1800);
                              })
                              .catch(() => {});
                          }
                        }}
                        title="Copy code"
                      >
                        {codeCopied ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="ml-1 text-[11px] text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <Clipboard className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {githubStatusMessage && (
              <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 rounded-full bg-zinc-500 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                </span>
                <span>{githubStatusMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="github-setup-repo">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
        aria-expanded={isExpanded}
        className={`w-full p-4 text-left rounded-xl flex items-center justify-between transition-colors outline-none ${
          !isExpanded
            ? "glass-surface glass-hover ring-1 ring-white/10 dark:ring-white/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40 dark:focus-visible:ring-white/20"
            : "glass-surface/80 ring-1 ring-white/10 dark:ring-white/10"
        }`}
      >
        <span className="font-medium glass-contrast-text">Set up your GitHub repo</span>
        {isExpanded ? undefined : (
          <ChevronRight className="h-4 w-4 opacity-60" />
        )}
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 pt-0 space-y-4">
          {/* Mode Selection - Segmented Control */}
          <div>
            <div className="inline-flex w-full rounded-xl glass-surface/80 ring-1 ring-white/10 dark:ring-white/10 p-1">
              <button
                type="button"
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors outline-none ${
                  repoSetupMode === "create"
                    ? "bg-white/70 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/5"
                }`}
                onClick={() => {
                  setRepoSetupMode("create");
                  setCreateRepoError(null);
                  setCreateRepoSuccess(false);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Create new repo</span>
              </button>
              <button
                type="button"
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors outline-none ${
                  repoSetupMode === "existing"
                    ? "bg-white/70 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/5"
                }`}
                onClick={() => {
                  setRepoSetupMode("existing");
                  setCreateRepoError(null);
                  setCreateRepoSuccess(false);
                }}
              >
                <Link2 className="h-4 w-4" />
                <span className="text-sm">Connect existing repo</span>
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSetupRepo}>
            {repoSetupMode === "create" ? (
              <>
                <div>
                  <Label className="block text-sm font-medium">
                    Repository Name
                  </Label>
                  <Input
                    data-testid="github-create-repo-name-input"
                    className="w-full mt-1"
                    value={repoName}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setRepoName(newValue);
                      setRepoAvailable(null);
                      setRepoCheckError(null);
                      debouncedCheckRepoAvailability(newValue);
                    }}
                    disabled={isCreatingRepo}
                  />
                  {isCheckingRepo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Checking availability...
                    </p>
                  )}
                  {repoAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">
                      Repository name is available!
                    </p>
                  )}
                  {repoAvailable === false && (
                    <p className="text-xs text-red-600 mt-1">
                      {repoCheckError}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="block text-sm font-medium">
                    Select Repository
                  </Label>
                  <Select
                    value={selectedRepo}
                    onValueChange={setSelectedRepo}
                    disabled={isLoadingRepos}
                  >
                    <SelectTrigger
                      className="w-full mt-1"
                      data-testid="github-repo-select"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingRepos
                            ? "Loading repositories..."
                            : "Select a repository"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRepos.map((repo) => (
                        <SelectItem key={repo.full_name} value={repo.full_name}>
                          {repo.full_name} {repo.private && "(private)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Branch Selection */}
            <div>
              <Label className="block text-sm font-medium">Branch</Label>
              {repoSetupMode === "existing" && selectedRepo ? (
                <div className="space-y-2">
                  <Select
                    value={
                      branchInputMode === "select" ? selectedBranch : "custom"
                    }
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setBranchInputMode("custom");
                        setCustomBranchName("");
                      } else {
                        setBranchInputMode("select");
                        setSelectedBranch(value);
                      }
                    }}
                    disabled={isLoadingBranches}
                  >
                    <SelectTrigger
                      className="w-full mt-1"
                      data-testid="github-branch-select"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingBranches
                            ? "Loading branches..."
                            : "Select a branch"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <span className="font-medium">
                          ✏️ Type custom branch name
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {branchInputMode === "custom" && (
                    <Input
                      data-testid="github-custom-branch-input"
                      className="w-full"
                      value={customBranchName}
                      onChange={(e) => setCustomBranchName(e.target.value)}
                      placeholder="Enter branch name (e.g., feature/new-feature)"
                      disabled={isCreatingRepo}
                    />
                  )}
                </div>
              ) : (
                <Input
                  className="w-full mt-1"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  placeholder="main"
                  disabled={isCreatingRepo}
                  data-testid="github-new-repo-branch-input"
                />
              )}
            </div>

            <Button
              type="submit"
              disabled={
                isCreatingRepo ||
                (repoSetupMode === "create" &&
                  (repoAvailable === false || !repoName)) ||
                (repoSetupMode === "existing" &&
                  (!selectedRepo ||
                    !selectedBranch ||
                    (branchInputMode === "custom" && !customBranchName.trim())))
              }
            >
              {isCreatingRepo
                ? repoSetupMode === "create"
                  ? "Creating..."
                  : "Connecting..."
                : repoSetupMode === "create"
                  ? "Create Repo"
                  : "Connect to Repo"}
            </Button>
          </form>

          {createRepoError && (
            <p className="text-red-600 mt-2">{createRepoError}</p>
          )}
          {createRepoSuccess && (
            <p className="text-green-600 mt-2">
              {repoSetupMode === "create"
                ? "Repository created and linked!"
                : "Connected to repository!"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function GitHubConnector({
  appId,
  folderName,
  expanded,
}: GitHubConnectorProps) {
  const { app, refreshApp } = useLoadApp(appId);
  const { settings, refreshSettings } = useSettings();
  const [pendingAutoSync, setPendingAutoSync] = useState(false);

  const handleRepoSetupComplete = useCallback(() => {
    setPendingAutoSync(true);
    refreshApp();
  }, [refreshApp]);

  const handleAutoSyncComplete = useCallback(() => {
    setPendingAutoSync(false);
  }, []);

  if (app?.githubOrg && app?.githubRepo && appId) {
    return (
      <ConnectedGitHubConnector
        appId={appId}
        app={app}
        refreshApp={refreshApp}
        triggerAutoSync={pendingAutoSync}
        onAutoSyncComplete={handleAutoSyncComplete}
      />
    );
  } else {
    return (
      <UnconnectedGitHubConnector
        appId={appId}
        folderName={folderName}
        settings={settings}
        refreshSettings={refreshSettings}
        handleRepoSetupComplete={handleRepoSetupComplete}
        expanded={expanded}
      />
    );
  }
}
