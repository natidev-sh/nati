import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { showSuccess, showError } from "@/lib/toast";

export function GitHubIntegration() {
  const { settings, updateSettings } = useSettings();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnectFromGithub = async () => {
    setIsDisconnecting(true);
    try {
      const result = await updateSettings({
        githubAccessToken: undefined,
      });
      if (result) {
        showSuccess("Successfully disconnected from GitHub");
      } else {
        showError("Failed to disconnect from GitHub");
      }
    } catch (err: any) {
      showError(
        err.message || "An error occurred while disconnecting from GitHub",
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!settings?.githubAccessToken;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium glass-contrast-text">GitHub Integration</h3>
        {isConnected ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your account is connected to GitHub.
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Not connected. Connect via your provider or environment settings.
          </p>
        )}
      </div>

      {isConnected ? (
        <Button
          onClick={handleDisconnectFromGithub}
          variant="destructive"
          size="sm"
          disabled={isDisconnecting}
          className="flex items-center gap-2"
        >
          {isDisconnecting ? "Disconnecting..." : "Disconnect from GitHub"}
          <Github className="h-4 w-4" />
        </Button>
      ) : (
        <span className="px-2 py-1 text-xs rounded-md glass-surface glass-contrast-text">Not connected</span>
      )}
    </div>
  );
}
