import { useSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showInfo } from "@/lib/toast";
import { Wrench } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AutoFixProblemsSwitch({
  showToast = false,
}: {
  showToast?: boolean;
}) {
  const { settings, updateSettings } = useSettings();
  const enabled = !!settings?.enableAutoFixProblems;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={
              "inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl glass-surface border ring-1 text-xs text-gray-700 dark:text-gray-100 " +
              (enabled ? " glass-active ring-violet-500/30" : " ring-transparent")
            }
          >
            <div className="inline-flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-md bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center">
                <Wrench className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </span>
              <Label htmlFor="auto-fix-problems" className="cursor-pointer">
                Auto-fix problems
              </Label>
            </div>
            <Switch
              id="auto-fix-problems"
              checked={enabled}
              onCheckedChange={() => {
                updateSettings({
                  enableAutoFixProblems: !settings?.enableAutoFixProblems,
                });
                if (!settings?.enableAutoFixProblems && showToast) {
                  showInfo("You can disable Auto-fix problems in the Settings page.");
                }
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>Automatically fix detected problems</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
