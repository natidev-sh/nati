import { useSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export function CustomizeSettings() {
  const { settings, updateSettings } = useSettings();

  const consoleSettings = useMemo(
    () => settings?.console || {},
    [settings]
  ) as {
    autoScroll?: boolean;
    fontSize?: number;
    theme?: {
      background?: string;
      foreground?: string;
      accent?: string;
      tabDefault?: string;
      tabActive?: string;
    };
  };

  const theme = consoleSettings.theme || {};

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">Auto scroll</Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={consoleSettings.autoScroll ?? true}
            onCheckedChange={(checked) =>
              updateSettings({ console: { ...consoleSettings, autoScroll: checked } })
            }
          />
          <span className="text-sm text-muted-foreground">Scroll to bottom when new lines arrive.</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Font size (px)</Label>
        <Input
          type="number"
          min={8}
          max={24}
          value={consoleSettings.fontSize ?? 12}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) updateSettings({ console: { ...consoleSettings, fontSize: n } });
          }}
          className="w-28"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">Background</Label>
          <Input
            type="color"
            value={theme.background ?? "#0b0b0c"}
            onChange={(e) => updateSettings({ console: { ...consoleSettings, theme: { ...theme, background: e.target.value } } })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Foreground</Label>
          <Input
            type="color"
            value={theme.foreground ?? "#e6e7e8"}
            onChange={(e) => updateSettings({ console: { ...consoleSettings, theme: { ...theme, foreground: e.target.value } } })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Accent</Label>
          <Input
            type="color"
            value={theme.accent ?? "#ed3378"}
            onChange={(e) => updateSettings({ console: { ...consoleSettings, theme: { ...theme, accent: e.target.value } } })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Tab (default)</Label>
          <Input
            type="color"
            value={theme.tabDefault ?? "#64748b"}
            onChange={(e) => updateSettings({ console: { ...consoleSettings, theme: { ...theme, tabDefault: e.target.value } } })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Tab (active)</Label>
          <Input
            type="color"
            value={theme.tabActive ?? "#4f46e5"}
            onChange={(e) => updateSettings({ console: { ...consoleSettings, theme: { ...theme, tabActive: e.target.value } } })}
          />
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="text-xs text-muted-foreground mb-2">Preview</div>
        <div
          className="rounded-md p-3 font-mono text-sm"
          style={{
            background: theme.background ?? "#0b0b0c",
            color: theme.foreground ?? "#e6e7e8",
          }}
        >
          <div>npm run dev</div>
          <div>Vite v5.0.0 ready in 300ms</div>
          <div>Local: http://localhost:5173</div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            updateSettings({
              console: {
                autoScroll: true,
                fontSize: 12,
                theme: {
                  background: "#0b0b0c",
                  foreground: "#e6e7e8",
                  accent: "#ed3378",
                  tabDefault: "#64748b",
                  tabActive: "#4f46e5",
                },
              },
            })
          }
        >
          Reset to default
        </Button>
      </div>
    </div>
  );
}
