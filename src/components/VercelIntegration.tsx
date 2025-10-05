import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { showSuccess, showError } from "@/lib/toast";

export function VercelIntegration() {
  const { settings, updateSettings } = useSettings();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnectFromVercel = async () => {
    setIsDisconnecting(true);
    try {
      const result = await updateSettings({
        vercelAccessToken: undefined,
      });
      if (result) {
        showSuccess("Successfully disconnected from Vercel");
      } else {
        showError("Failed to disconnect from Vercel");
      }
    } catch (err: any) {
      showError(
        err.message || "An error occurred while disconnecting from Vercel",
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!settings?.vercelAccessToken;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium glass-contrast-text">Vercel Integration</h3>
        {isConnected ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your account is connected to Vercel.
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Not connected. Connect via your provider or environment settings.
          </p>
        )}
      </div>

      {isConnected ? (
        <Button
          onClick={handleDisconnectFromVercel}
          variant="destructive"
          size="sm"
          disabled={isDisconnecting}
          className="flex items-center gap-2"
        >
          {isDisconnecting ? "Disconnecting..." : "Disconnect from Vercel"}
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 22.525H0l12-21.05 12 21.05z" />
          </svg>
        </Button>
      ) : (
        <span className="px-2 py-1 text-xs rounded-md glass-surface glass-contrast-text">Not connected</span>
      )}
    </div>
  );
}
