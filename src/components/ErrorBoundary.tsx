import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, XCircle, RefreshCw, Logs, Bug } from "lucide-react";
import { ErrorComponentProps } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { IpcClient } from "@/ipc/ipc_client";

export function ErrorBoundary({ error }: ErrorComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    console.error("An error occurred in the route:", error);
    posthog.captureException(error);
  }, [error]);

  const handleReportBug = async () => {
    setIsLoading(true);
    try {
      // Get system debug info
      const debugInfo = await IpcClient.getInstance().getSystemDebugInfo();

      // Create a formatted issue body with the debug info and error information
      const issueBody = `
## Bug Description
<!-- Please describe the issue you're experiencing -->

## Steps to Reproduce
<!-- Please list the steps to reproduce the issue -->

## Expected Behavior
<!-- What did you expect to happen? -->

## Actual Behavior
<!-- What actually happened? -->

## Error Details
- Error Name: ${error?.name || "Unknown"}
- Error Message: ${error?.message || "Unknown"}
${error?.stack ? `\n\`\`\`\n${error.stack.slice(0, 1000)}\n\`\`\`` : ""}

## System Information
- Dyad Version: ${debugInfo.dyadVersion}
- Platform: ${debugInfo.platform}
- Architecture: ${debugInfo.architecture}
- Node Version: ${debugInfo.nodeVersion || "Not available"}
- PNPM Version: ${debugInfo.pnpmVersion || "Not available"}
- Node Path: ${debugInfo.nodePath || "Not available"}
- Telemetry ID: ${debugInfo.telemetryId || "Not available"}

## Logs
\`\`\`
${debugInfo.logs.slice(-3_500) || "No logs available"}
\`\`\`
`;

      // Create the GitHub issue URL with the pre-filled body
      const encodedBody = encodeURIComponent(issueBody);
      const encodedTitle = encodeURIComponent(
        "[bug] Error in Dyad application",
      );
      const githubIssueUrl = `https://github.com/natidev-sh/nati/issues/new?title=${encodedTitle}&labels=bug,filed-from-app,client-error&body=${encodedBody}`;

      // Open the pre-filled GitHub issue page
      await IpcClient.getInstance().openExternalUrl(githubIssueUrl);
    } catch (err) {
      console.error("Failed to prepare bug report:", err);
      // Fallback to opening the regular GitHub issue page
      IpcClient.getInstance().openExternalUrl(
        "https://github.com/natidev-sh/nati/issues/new",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl relative rounded-2xl glass-surface border shadow-sm ring-1 px-5 py-6">
        {/* Badge */}
        <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-md text-xs font-semibold text-red-600 dark:text-red-400 bg-white/90 dark:bg-black/50 backdrop-blur-sm border border-white/60 dark:border-white/10 flex items-center gap-1">
          <XCircle size={16} />
          <span>Application Error</span>
        </div>

        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-600/90 text-white shadow-md">
            <Bug size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold mb-1">Something went wrong</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">An unexpected error occurred while rendering this page.</p>

            {error && (
              <div className="mt-3 rounded-xl border ring-1 glass-surface px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Logs size={14} className="text-gray-500" />
                  <span>Error details</span>
                </div>
                <div className="text-sm leading-relaxed">
                  <div><span className="font-semibold">Name:</span> {error.name}</div>
                  <div className="break-words"><span className="font-semibold">Message:</span> {error.message}</div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleReportBug} disabled={isLoading} className="cursor-pointer">
                <Bug size={16} className="mr-1" />
                {isLoading ? "Preparing report..." : "Report bug"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => IpcClient.getInstance().restartDyad()}
                className="cursor-pointer"
              >
                <RefreshCw size={16} className="mr-1" />
                Restart Nati
              </Button>
            </div>

            <div className="mt-4 p-3 rounded-xl glass-surface border ring-1 flex items-center gap-2">
              <LightbulbIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Tip:</strong> If the issue persists after restart, please include steps to reproduce in the bug report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
