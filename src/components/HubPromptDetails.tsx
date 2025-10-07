import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Copy, ClipboardCheck, FolderPlus } from "lucide-react";

export type HubPrompt = {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  isNew?: boolean;
};

export function HubPromptDetails({
  open,
  onOpenChange,
  prompt,
  onAddToLibrary,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prompt: HubPrompt | null;
  onAddToLibrary: (p: HubPrompt) => Promise<void> | void;
}) {
  const p = prompt;
  const [copied, setCopied] = useState(false);
  const copyBtnRef = useRef<HTMLButtonElement | null>(null);

  // Inject sprinkle keyframes once
  useEffect(() => {
    const id = "nati-sprinkle-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        @keyframes nati-sprinkle-pop {
          0% { transform: translate(0,0) scale(1) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.9) rotate(var(--rot)); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  function fireSprinklesFrom(el: HTMLElement | null) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";

    const colors = ["#10b981", "#34d399", "#a7f3d0", "#ecfccb", "#fde68a"]; // emerald + soft
    const shapes = ["✦", "✧", "•", "★", "◇"];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.textContent = shapes[i % shapes.length];
      span.style.position = "absolute";
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;
      span.style.fontSize = `${10 + Math.random() * 8}px`;
      span.style.color = colors[i % colors.length];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 40 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = (Math.random() * 180 - 90).toFixed(0) + "deg";
      span.style.setProperty("--dx", `${dx}px`);
      span.style.setProperty("--dy", `${dy}px`);
      span.style.setProperty("--rot", rot);
      span.style.animation = `nati-sprinkle-pop ${500 + Math.random() * 400}ms ease-out forwards`;
      container.appendChild(span);
    }
    document.body.appendChild(container);
    window.setTimeout(() => container.remove(), 900);
  }

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    setCopied(false);
  }, [p?.id]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-surface border">
        {p ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{p.title}</span>
                {p.isNew ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">NEW</span>
                ) : null}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {p.description}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 space-y-2">
              <div className="text-[11px] uppercase tracking-wide opacity-70">Prompt</div>
              <pre className="text-sm whitespace-pre-wrap rounded-xl border bg-black/5 dark:bg-white/5 p-3 max-h-80 overflow-auto">
                {p.content}
              </pre>
            </div>

            <DialogFooter className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                className={`gap-2 ${copied ? "border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" : ""}`}
                ref={copyBtnRef}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(p.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                    fireSprinklesFrom(copyBtnRef.current);
                  } catch {
                    // Fallback: select text in a hidden textarea
                    try {
                      const ta = document.createElement("textarea");
                      ta.value = p.content;
                      ta.style.position = "fixed";
                      ta.style.left = "-9999px";
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand("copy");
                      document.body.removeChild(ta);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                      fireSprinklesFrom(copyBtnRef.current);
                    } catch {}
                  }
                }}
              >
                {copied ? (
                  <>
                    <ClipboardCheck className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
              <Button
                className="gap-2"
                onClick={() => onAddToLibrary(p)}
              >
                <FolderPlus className="h-4 w-4" /> Add to Library
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center text-sm opacity-70 flex flex-col items-center gap-2">
            <BadgeCheck className="h-6 w-6" />
            Select a prompt to view details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
