import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Database, GitBranch } from "lucide-react";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useLoadApp } from "@/hooks/useLoadApp";
import { IpcClient } from "@/ipc/ipc_client";
import type { GetSupabaseBranchesResponse, SupabaseBranch } from "@/ipc/ipc_types";
import { toast } from "sonner";

const getBranchTypeColor = (branch: SupabaseBranch) => {
  if (branch.is_default) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  }
  if (branch.persistent) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
};

const getBranchLabel = (branch: SupabaseBranch) => {
  if (branch.is_default) return "main";
  if (branch.persistent) return "persistent";
  return "preview";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const SupabaseConfigure = () => {
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const { app, refreshApp } = useLoadApp(selectedAppId);
  const queryClient = useQueryClient();

  // Query to get Supabase branches
  const {
    data: supabaseProject,
    isLoading,
    error,
  } = useQuery<GetSupabaseBranchesResponse, Error>({
    queryKey: ["supabase-branches", selectedAppId],
    queryFn: async () => {
      if (!selectedAppId) throw new Error("No app selected");
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getSupabaseBranches({ appId: selectedAppId });
    },
    enabled: !!selectedAppId && !!app?.supabaseProjectId,
    meta: { showErrorToast: true },
  });

  // Mutation to set branch
  const setBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      if (!selectedAppId) throw new Error("No app selected");
      await IpcClient.getInstance().setSupabaseBranch({
        appId: selectedAppId,
        branchId,
      });
    },
    onSuccess: async () => {
      toast.success("Branch updated successfully");
      await refreshApp();
      queryClient.invalidateQueries({ queryKey: ["supabase-branches", selectedAppId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update branch: ${error.message}`);
    },
  });

  // Don't show component if app doesn't have Supabase project
  if (!app?.supabaseProjectId) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Supabase Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading Supabase project information...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Supabase Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-red-500">
              Error loading Supabase project: {error.message}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!supabaseProject) {
    return null;
  }

  // No branches available (branching might not be enabled)
  if (supabaseProject.branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Supabase Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm font-medium">Project Information</div>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project Name:</span>
                <span className="font-medium">{supabaseProject.projectName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project ID:</span>
                <span className="font-mono text-xs">{supabaseProject.projectId}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Branching is not enabled for this project. Enable it in your Supabase dashboard.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBranch = supabaseProject.branches.find(
    (b) => b.id === app.supabaseBranchId
  ) || supabaseProject.branches.find((b) => b.is_default);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database size={20} />
          Supabase Database
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Information */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Project Information</div>
          <div className="bg-muted/50 p-3 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Project Name:</span>
              <span className="font-medium">{supabaseProject.projectName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Project ID:</span>
              <span className="font-mono text-xs">{supabaseProject.projectId}</span>
            </div>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <GitBranch size={16} />
            Active Branch
          </div>
          <Select
            value={currentBranch?.id || ""}
            onValueChange={(branchId) => setBranchMutation.mutate(branchId)}
            disabled={setBranchMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {supabaseProject.branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
                    <span>{branch.name}</span>
                    <Badge
                      variant="secondary"
                      className={getBranchTypeColor(branch)}
                    >
                      {getBranchLabel(branch)}
                    </Badge>
                    {branch.git_branch && (
                      <span className="text-xs text-muted-foreground">
                        ({branch.git_branch})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Branch Details */}
        {currentBranch && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Branch Details</div>
            <div className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{currentBranch.name}</span>
                <Badge
                  variant="secondary"
                  className={getBranchTypeColor(currentBranch)}
                >
                  {getBranchLabel(currentBranch)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>ID: {currentBranch.id}</div>
                {currentBranch.git_branch && (
                  <div>Git Branch: {currentBranch.git_branch}</div>
                )}
                {currentBranch.parent_branch_id && (
                  <div>Parent Branch: {currentBranch.parent_branch_id}</div>
                )}
                <div>Created: {formatDate(currentBranch.created_at)}</div>
                <div>Updated: {formatDate(currentBranch.updated_at)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Branch List */}
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <GitBranch size={16} />
            All Branches ({supabaseProject.branches.length})
          </div>
          <div className="text-xs text-muted-foreground">
            Switch between main and preview branches to test changes.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
