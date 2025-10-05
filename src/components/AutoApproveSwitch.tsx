import { useSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showInfo } from "@/lib/toast";
import { ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AutoApproveSwitch({
  showToast = true,
}: {
  showToast?: boolean;
}) {
  const { settings, updateSettings } = useSettings();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={
              "inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl glass-surface border ring-1 text-xs text-gray-700 dark:text-gray-100 " +
              (settings?.autoApproveChanges ? " glass-active ring-emerald-500/30" : " ring-transparent")
            }
          >
            <div className="inline-flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <Label htmlFor="auto-approve" className="cursor-pointer">
                Auto-approve
              </Label>
            </div>
            <Switch
              id="auto-approve"
              checked={settings?.autoApproveChanges}
              onCheckedChange={() => {
                updateSettings({ autoApproveChanges: !settings?.autoApproveChanges });
                if (!settings?.autoApproveChanges && showToast) {
                  showInfo("You can disable auto-approve in the Settings.");
                }
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Auto-approve generated changes</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
