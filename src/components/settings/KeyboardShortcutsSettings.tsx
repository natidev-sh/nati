import { useSettings } from "@/hooks/useSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";

export function KeyboardShortcutsSettings() {
  const { settings, updateSettings } = useSettings();
  const keyboard = settings?.keyboard ?? {};
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-save-on-blur"
            checked={keyboard.enableSaveOnBlur ?? true}
            onCheckedChange={(checked) =>
              updateSettings({ keyboard: { ...keyboard, enableSaveOnBlur: checked } })
            }
          />
          <Label htmlFor="enable-save-on-blur">Save on blur</Label>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Automatically save file when editor loses focus.
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-ctrl-enter-save-check"
            checked={keyboard.enableCtrlEnterSaveCheck ?? true}
            onCheckedChange={(checked) =>
              updateSettings({ keyboard: { ...keyboard, enableCtrlEnterSaveCheck: checked } })
            }
          />
          <Label htmlFor="enable-ctrl-enter-save-check">Ctrl/Cmd+Enter saves and checks problems</Label>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          After saving, automatically run problem checks if enabled in Workflow.
        </div>
      </div>

      <div className="pt-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          View all shortcuts
        </Button>
      </div>

      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
