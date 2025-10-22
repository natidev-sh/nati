import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IpcClient } from "@/ipc/ipc_client";
import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/toast";
import { Folder, X, Loader2, Info, Github, Check, Clipboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@radix-ui/react-label";
import { useNavigate } from "@tanstack/react-router";
import { useStreamChat } from "@/hooks/useStreamChat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useSetAtom } from "jotai";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useSettings } from "@/hooks/useSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

interface ImportAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportAppDialog({ isOpen, onClose }: ImportAppDialogProps) {
  const [importMode, setImportMode] = useState<"local" | "github">("local");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [githubBranch, setGithubBranch] = useState<string>("main");
  const [githubRepos, setGithubRepos] = useState<Array<{ name: string; full_name: string; private: boolean }>>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [githubUserCode, setGithubUserCode] = useState<string | null>(null);
  const [githubVerificationUri, setGithubVerificationUri] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [isConnectingToGithub, setIsConnectingToGithub] = useState(false);
  const [githubStatusMessage, setGithubStatusMessage] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [hasAiRules, setHasAiRules] = useState<boolean | null>(null);
  const [customAppName, setCustomAppName] = useState<string>("");
  const [nameExists, setNameExists] = useState<boolean>(false);
  const [isCheckingName, setIsCheckingName] = useState<boolean>(false);
  const [installCommand, setInstallCommand] = useState("pnpm install");
  const [startCommand, setStartCommand] = useState("pnpm dev");
  const navigate = useNavigate();
  const { streamMessage } = useStreamChat({ hasChatId: false });
  const { refreshApps } = useLoadApps();
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const { settings, refreshSettings } = useSettings();
  const isGithubConnected = !!settings?.githubAccessToken?.value;

  const checkAppName = async (name: string): Promise<void> => {
    setIsCheckingName(true);
    try {
      const result = await IpcClient.getInstance().checkAppName({
        appName: name,
      });
      setNameExists(result.exists);
    } catch (error: unknown) {
      showError("Failed to check app name: " + (error as any).toString());
    } finally {
      setIsCheckingName(false);
    }
  };

  const selectFolderMutation = useMutation({
    mutationFn: async () => {
      const result = await IpcClient.getInstance().selectAppFolder();
      if (!result.path || !result.name) {
        throw new Error("No folder selected");
      }
      const aiRulesCheck = await IpcClient.getInstance().checkAiRules({
        path: result.path,
      });
      setHasAiRules(aiRulesCheck.exists);
      setSelectedPath(result.path);

      // Use the folder name from the IPC response
      setCustomAppName(result.name);

      // Check if the app name already exists
      await checkAppName(result.name);

      return result;
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });

  const importAppMutation = useMutation({
    mutationFn: async () => {
      if (importMode === "local") {
        if (!selectedPath) throw new Error("No folder selected");
        return IpcClient.getInstance().importApp({
          path: selectedPath,
          appName: customAppName,
          installCommand: installCommand || undefined,
          startCommand: startCommand || undefined,
        });
      } else {
        if (!githubUrl) throw new Error("No GitHub URL provided");
        return IpcClient.getInstance().importGithubRepo({
          githubUrl: githubUrl.trim(),
          branch: githubBranch.trim() || "main",
          appName: customAppName,
          installCommand: installCommand || undefined,
          startCommand: startCommand || undefined,
        });
      }
    },
    onSuccess: async (result) => {
      showSuccess(
        !hasAiRules
          ? "App imported successfully. Dyad will automatically generate an AI_RULES.md now."
          : "App imported successfully",
      );
      onClose();

      navigate({ to: "/chat", search: { id: result.chatId } });
      if (!hasAiRules) {
        streamMessage({
          prompt:
            "Generate an AI_RULES.md file for this app. Describe the tech stack in 5-10 bullet points and describe clear rules about what libraries to use for what.",
          chatId: result.chatId,
        });
      }
      setSelectedAppId(result.appId);
      await refreshApps();
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });

  const handleSelectFolder = () => {
    selectFolderMutation.mutate();
  };

  const handleImport = () => {
    importAppMutation.mutate();
  };

  const handleClear = () => {
    setSelectedPath(null);
    setGithubUrl("");
    setGithubBranch("main");
    setHasAiRules(null);
    setCustomAppName("");
    setNameExists(false);
    setInstallCommand("pnpm install");
    setStartCommand("pnpm dev");
  };

  // Load GitHub repos when dialog opens and user is authenticated
  useEffect(() => {
    if (isOpen && importMode === "github" && isGithubConnected) {
      loadGithubRepos();
    }
  }, [isOpen, importMode, isGithubConnected]);

  const loadGithubRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await IpcClient.getInstance().listGithubRepos();
      setGithubRepos(repos);
    } catch (error) {
      showError("Failed to load GitHub repositories");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleRepoSelect = (fullName: string) => {
    setSelectedRepo(fullName);
    const [owner, repo] = fullName.split("/");
    setGithubUrl(`https://github.com/${fullName}`);
    setCustomAppName(repo);
    checkAppName(repo);
  };

  const handleGithubUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setGithubUrl(url);
    setSelectedRepo(""); // Clear selected repo when manually typing URL
    
    // Extract repo name from URL for default app name
    if (url.trim()) {
      const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(\.git)?$/);
      if (match) {
        const repoName = match[2].replace(/\.git$/, "");
        setCustomAppName(repoName);
        await checkAppName(repoName);
      }
    }
  };

  const startGithubOAuth = () => {
    setIsConnectingToGithub(true);
    setGithubError(null);
    setGithubUserCode(null);
    setGithubVerificationUri(null);
    setGithubStatusMessage("Requesting device code from GitHub...");
    IpcClient.getInstance().startGithubDeviceFlow(null);
  };

  // Set up GitHub Device Flow event listeners
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Listener for updates (user code, verification uri, status messages)
    const removeUpdateListener = IpcClient.getInstance().onGithubDeviceFlowUpdate((data) => {
      if (data.userCode) {
        setGithubUserCode(data.userCode);
      }
      if (data.verificationUri) {
        setGithubVerificationUri(data.verificationUri);
      }
      if (data.message) {
        setGithubStatusMessage(data.message);
      }
      setGithubError(null);
    });
    cleanupFunctions.push(removeUpdateListener);

    // Listener for success
    const removeSuccessListener = IpcClient.getInstance().onGithubDeviceFlowSuccess(async () => {
      setGithubStatusMessage("Successfully connected to GitHub!");
      setGithubUserCode(null);
      setGithubVerificationUri(null);
      setGithubError(null);
      setIsConnectingToGithub(false);
      
      // Refresh settings to get the updated GitHub token
      await refreshSettings();
      
      // Load repos now that we have the token
      await loadGithubRepos();
    });
    cleanupFunctions.push(removeSuccessListener);

    // Listener for errors
    const removeErrorListener = IpcClient.getInstance().onGithubDeviceFlowError((data) => {
      setGithubError(data.error || "An unknown error occurred.");
      setGithubStatusMessage(null);
      setGithubUserCode(null);
      setGithubVerificationUri(null);
      setIsConnectingToGithub(false);
    });
    cleanupFunctions.push(removeErrorListener);

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, []);


  const handleAppNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newName = e.target.value;
    setCustomAppName(newName);
    if (newName.trim()) {
      await checkAppName(newName);
    }
  };

  const hasInstallCommand = installCommand.trim().length > 0;
  const hasStartCommand = startCommand.trim().length > 0;
  const commandsValid = hasInstallCommand === hasStartCommand;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 rounded-2xl glass-surface border shadow-sm overflow-hidden select-none">
        <div className="px-4 pt-4 pb-2">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg">Import App</DialogTitle>
            <DialogDescription className="text-sm">
              Import from a local folder or clone from GitHub.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4">
          <Alert className="glass-surface border-blue-500/20 text-blue-500">
            <Info className="h-4 w-4" />
            <AlertDescription>
              App import is still experimental — if something doesn’t work, let us know through the Help button.
            </AlertDescription>
          </Alert>
        </div>

        <div className="px-4 py-4">
          <Tabs value={importMode} onValueChange={(v: string) => setImportMode(v as "local" | "github")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Local Folder
              </TabsTrigger>
              <TabsTrigger value="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="mt-0">
              {!selectedPath ? (
            <Button
              onClick={handleSelectFolder}
              disabled={selectFolderMutation.isPending}
              className="w-full glass-button glass-hover glass-active hover:text-white active:text-white cursor-pointer"
            >
              {selectFolderMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Folder className="mr-2 h-4 w-4" />
              )}
              {selectFolderMutation.isPending
                ? "Selecting folder..."
                : "Select Folder"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl glass-surface border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium glass-contrast-text">Selected folder</p>
                    <p className="text-xs opacity-80 break-all font-mono mt-0.5">
                      {selectedPath}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 w-8 p-0 flex-shrink-0"
                    disabled={importAppMutation.isPending}
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear selection</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {nameExists && (
                  <p className="text-sm text-yellow-500">
                    An app with this name already exists. Please choose a
                    different name:
                  </p>
                )}
                <div className="relative">
                  <Label className="text-sm ml-2 mb-2">App name</Label>
                  <Input
                    value={customAppName}
                    onChange={handleAppNameChange}
                    placeholder="Enter new app name"
                    className="w-full pr-8 select-text"
                    disabled={importAppMutation.isPending}
                  />
                  {isCheckingName && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="advanced-options">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    Advanced options
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-sm ml-2 mb-2">
                        Install command
                      </Label>
                      <Input
                        value={installCommand}
                        onChange={(e) => setInstallCommand(e.target.value)}
                        placeholder="pnpm install"
                        disabled={importAppMutation.isPending}
                        className="select-text"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-sm ml-2 mb-2">Start command</Label>
                      <Input
                        value={startCommand}
                        onChange={(e) => setStartCommand(e.target.value)}
                        placeholder="pnpm dev"
                        disabled={importAppMutation.isPending}
                        className="select-text"
                      />
                    </div>
                    {!commandsValid && (
                      <p className="text-sm text-red-500">
                        Both commands are required when customizing.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {hasAiRules === false && (
                <Alert className="glass-surface border-yellow-500/20 text-yellow-500 flex items-start gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 flex-shrink-0 mt-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          AI_RULES.md lets Nati know which tech stack to use for
                          editing the app
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDescription>
                    No AI_RULES.md found. Nati will automatically generate one
                    after importing.
                  </AlertDescription>
                </Alert>
              )}

              {importAppMutation.isPending && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing app...</span>
                </div>
              )}
            </div>
          )}
            </TabsContent>

            <TabsContent value="github" className="mt-0 space-y-4">
              {!isGithubConnected ? (
                <>
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Github className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">Connect your GitHub account</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Connect to GitHub to browse and import your repositories directly
                      </p>
                    </div>
                    <Button
                      onClick={startGithubOAuth}
                      className="glass-button glass-hover"
                      disabled={isConnectingToGithub}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      {isConnectingToGithub ? "Connecting..." : "Connect to GitHub"}
                    </Button>
                  </div>

                  {/* GitHub Device Flow UI */}
                  {(githubUserCode || githubStatusMessage || githubError) && (
                    <div className="p-4 rounded-xl glass-surface border">
                      <div className="flex items-center gap-2 mb-3">
                        <Github className="h-4 w-4" />
                        <h4 className="text-sm font-semibold">GitHub Connection</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Device flow</span>
                      </div>

                      {githubError && (
                        <div className="mb-3 text-sm text-red-600 dark:text-red-400">
                          Error: {githubError}
                        </div>
                      )}

                      {githubUserCode && githubVerificationUri && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium">Open GitHub device page</div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-1"
                                onClick={() => IpcClient.getInstance().openExternalUrl(githubVerificationUri)}
                              >
                                https://github.com/login/device
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium">Enter this code</div>
                              <div className="mt-1 flex items-center gap-2">
                                <code className="px-3 py-1.5 rounded bg-muted font-mono text-base">
                                  {githubUserCode}
                                </code>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (githubUserCode) {
                                      navigator.clipboard.writeText(githubUserCode).then(() => {
                                        setCodeCopied(true);
                                        setTimeout(() => setCodeCopied(false), 2000);
                                      });
                                    }
                                  }}
                                >
                                  {codeCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {githubStatusMessage && (
                        <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>{githubStatusMessage}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {githubRepos.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm ml-2">Your Repositories</Label>
                      <Select value={selectedRepo} onValueChange={handleRepoSelect}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {githubRepos.map((repo) => (
                            <SelectItem key={repo.full_name} value={repo.full_name}>
                              <div className="flex items-center gap-2">
                                <span>{repo.full_name}</span>
                                {repo.private && (
                                  <span className="text-xs text-muted-foreground">(private)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground ml-2">
                        {isLoadingRepos ? "Loading repositories..." : `${githubRepos.length} repositories found`}
                      </p>
                    </div>
                  )}

                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm ml-2">GitHub Repository URL</Label>
                    <Input
                      value={githubUrl}
                      onChange={handleGithubUrlChange}
                      placeholder="https://github.com/username/repo"
                      className="w-full select-text font-mono text-sm"
                      disabled={importAppMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground ml-2">
                      Or paste any GitHub repository URL
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-sm ml-2">Branch (optional)</Label>
                <Input
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main"
                  className="w-full select-text"
                  disabled={importAppMutation.isPending}
                />
              </div>

              {githubUrl && (
                <>
                  <div className="space-y-2">
                    {nameExists && (
                      <p className="text-sm text-yellow-500">
                        An app with this name already exists. Please choose a
                        different name:
                      </p>
                    )}
                    <div className="relative">
                      <Label className="text-sm ml-2 mb-2">App name</Label>
                      <Input
                        value={customAppName}
                        onChange={handleAppNameChange}
                        placeholder="Enter app name"
                        className="w-full pr-8 select-text"
                        disabled={importAppMutation.isPending}
                      />
                      {isCheckingName && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="advanced-options">
                      <AccordionTrigger className="text-sm hover:no-underline">
                        Advanced options
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-sm ml-2 mb-2">
                            Install command
                          </Label>
                          <Input
                            value={installCommand}
                            onChange={(e) => setInstallCommand(e.target.value)}
                            placeholder="pnpm install"
                            disabled={importAppMutation.isPending}
                            className="select-text"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-sm ml-2 mb-2">Start command</Label>
                          <Input
                            value={startCommand}
                            onChange={(e) => setStartCommand(e.target.value)}
                            placeholder="pnpm dev"
                            disabled={importAppMutation.isPending}
                            className="select-text"
                          />
                        </div>
                        {!commandsValid && (
                          <p className="text-sm text-red-500">
                            Both commands are required when customizing.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {importAppMutation.isPending && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cloning repository...</span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-4 pb-4 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importAppMutation.isPending}
            className="glass-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              importMode === "local"
                ? !selectedPath ||
                  importAppMutation.isPending ||
                  nameExists ||
                  !commandsValid
                : !githubUrl.trim() ||
                  !customAppName.trim() ||
                  importAppMutation.isPending ||
                  nameExists ||
                  !commandsValid
            }
            className="min-w-[90px] glass-button glass-hover glass-active"
          >
            {importAppMutation.isPending ? <>Importing...</> : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
