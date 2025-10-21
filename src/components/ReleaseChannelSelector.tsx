import { useSettings } from "@/hooks/useSettings";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { IpcClient } from "@/ipc/ipc_client";
import type { ReleaseChannel } from "@/lib/schemas";

export function ReleaseChannelSelector() {
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return null;
  }

  const handleReleaseChannelChange = (value: ReleaseChannel) => {
    updateSettings({ releaseChannel: value });
    if (value === "stable") {
      toast("Switched to Stable Channel", {
        description:
          "You'll receive production-ready updates. Restart to check for stable releases.",
        action: {
          label: "Download Stable",
          onClick: () => {
            IpcClient.getInstance().openExternalUrl("https://natidev.com/download");
          },
        },
      });
    } else {
      toast("Switched to Beta Channel", {
        description:
          "You'll receive experimental updates with latest features. Restart to check for beta releases.",
        action: {
          label: "Restart Now",
          onClick: () => {
            IpcClient.getInstance().restartDyad();
          },
        },
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="release-channel"
          className="text-sm font-medium glass-contrast-text"
        >
          Release Channel
        </label>
        <Select
          value={settings.releaseChannel}
          onValueChange={handleReleaseChannelChange}
        >
          <SelectTrigger className="w-36 glass-button glass-hover" id="release-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-surface">
            <SelectItem value="stable" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Stable</span>
              </div>
            </SelectItem>
            <SelectItem value="beta" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Beta</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        {settings.releaseChannel === "stable" ? (
          <>
            <p className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                STABLE
              </span>
              Production-ready releases only
            </p>
            <p>✓ Recommended for most users</p>
            <p>✓ Thoroughly tested and reliable</p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                BETA
              </span>
              Experimental features and updates
            </p>
            <p>⚡ Latest features before stable release</p>
            <p>⚠️ May contain bugs - use with caution</p>
          </>
        )}
      </div>
    </div>
  );
}
