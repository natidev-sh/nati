import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyboardIcon } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  const isMac = navigator.platform.includes('Mac');
  
  const key = (s: string) => {
    // Always show both Windows/Linux and macOS symbols
    const displayKey = s
      .replace('Ctrl/Cmd', 'Ctrl/⌘')
      .replace('Alt/Option', 'Alt/⌥')
      .replace('Shift', 'Shift/⇧')
      .replace('Enter', 'Enter/⏎')
      .replace('Up', '↑')
      .replace('Down', '↓')
      .replace('/', '⁄');
      
    return (
      <kbd className="px-2 py-1 rounded-md border bg-muted/50 text-xs font-mono select-none">
        {displayKey}
      </kbd>
    );
  };

  const keyCombo = (keys: string[]) => (
    <div className="flex gap-1">
      {keys.map((k, i) => (
        <span key={i} className="flex items-center">
          {key(k)}
          {i < keys.length - 1 && <span className="mx-0.5 text-muted-foreground">+</span>}
        </span>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="select-none">
          <DialogTitle className="glass-contrast-text flex items-center gap-2">
            <KeyboardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm select-none">
          <div className="flex items-center justify-between">
            <div>Save file</div>
            {keyCombo(['Ctrl/Cmd', 'S'])}
          </div>
          <div className="flex items-center justify-between">
            <div>Save + Check Problems</div>
            {keyCombo(['Ctrl/Cmd', 'Enter'])}
          </div>
          <div className="flex items-center justify-between">
            <div>Toggle line comment</div>
            {keyCombo(['Ctrl/Cmd', '/'])}
          </div>
          <div className="flex items-center justify-between">
            <div>Format document</div>
            {keyCombo(['Ctrl/Cmd', 'Shift', 'F'])}
          </div>
          <div className="flex items-center justify-between">
            <div>Duplicate line down</div>
            {keyCombo(['Shift', 'Alt/Option', 'Down'])}
          </div>
          <div className="flex items-center justify-between">
            <div>Move line up</div>
            {keyCombo(['Alt/Option', 'Up'])}
          </div>
          <div className="flex items-center justify-between">
            <div>Move line down</div>
            {keyCombo(['Alt/Option', 'Down'])}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
