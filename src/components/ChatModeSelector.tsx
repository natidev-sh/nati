import {
  MiniSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/useSettings";
import type { ChatMode } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Hammer, MessageSquare, Bot } from "lucide-react";

export function ChatModeSelector() {
  const { settings, updateSettings } = useSettings();

  const selectedMode = settings?.selectedChatMode || "build";

  const handleModeChange = (value: string) => {
    updateSettings({ selectedChatMode: value as ChatMode });
  };

  const getModeDisplayName = (mode: ChatMode) => {
    switch (mode) {
      case "build":
        return "Build";
      case "ask":
        return "Ask";
      case "agent":
        return "Agent";
      default:
        return "Build";
    }
  };

  return (
    <Select value={selectedMode} onValueChange={handleModeChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <MiniSelectTrigger
            data-testid="chat-mode-selector"
            className={cn(
              // nati glass button styling
              "h-6 w-fit px-2 py-0 text-xs-sm font-medium gap-1 rounded-lg glass-button glass-hover",
              selectedMode === "build"
                ? ""
                : "glass-active text-primary",
            )}
            size="sm"
          >
            <span className="inline-flex items-center gap-1">
              {selectedMode === "build" && <Hammer className="h-3.5 w-3.5" />}
              {selectedMode === "ask" && (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              {selectedMode === "agent" && <Bot className="h-3.5 w-3.5" />}
              <SelectValue>{getModeDisplayName(selectedMode)}</SelectValue>
            </span>
          </MiniSelectTrigger>
        </TooltipTrigger>
        <TooltipContent>Open mode menu</TooltipContent>
      </Tooltip>
      <SelectContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
        <SelectItem value="build">
          <div className="flex items-start gap-2">
            <Hammer className="h-4 w-4 mt-0.5 text-sky-600 dark:text-sky-400" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Build</span>
              <span className="text-xs text-muted-foreground">
                Generate and edit code
              </span>
            </div>
          </div>
        </SelectItem>
        <SelectItem value="ask">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Ask</span>
              <span className="text-xs text-muted-foreground">
                Ask questions about the app
              </span>
            </div>
          </div>
        </SelectItem>
        <SelectItem value="agent">
          <div className="flex items-start gap-2">
            <Bot className="h-4 w-4 mt-0.5 text-violet-600 dark:text-violet-400" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Agent (experimental)</span>
              <span className="text-xs text-muted-foreground">
                Agent can use tools (MCP) and generate code
              </span>
            </div>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
