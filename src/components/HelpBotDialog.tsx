import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IpcClient } from "@/ipc/ipc_client";
import { v4 as uuidv4 } from "uuid";
import { LoadingBlock, VanillaMarkdownParser } from "@/components/LoadingBlock";
import { useSettings } from "@/hooks/useSettings";
import { ExternalLink, Sparkles, Key } from "lucide-react";

interface HelpBotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

const SUGGESTIONS = [
  "How do I create a new app?",
  "How to connect to Supabase?",
  "What models are available?",
  "How do I use Nati Pro?",
];

export function HelpBotDialog({ isOpen, onClose }: HelpBotDialogProps) {
  const { settings } = useSettings();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const assistantBufferRef = useRef("");
  const reasoningBufferRef = useRef("");
  const flushTimerRef = useRef<number | null>(null);
  const FLUSH_INTERVAL_MS = 100;
  
  const isPro = settings?.natiUser?.isPro || false;
  const hasProApiKey = Boolean(settings?.providerSettings?.auto?.apiKey?.value);
  const canUseHelpBot = isPro && (hasProApiKey || customApiKey);

  const sessionId = useMemo(() => uuidv4(), [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Clean up when dialog closes
      setMessages([]);
      setInput("");
      setError(null);
      assistantBufferRef.current = "";
      reasoningBufferRef.current = "";

      // Clear the flush timer
      if (flushTimerRef.current) {
        window.clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear the flush timer on unmount
      if (flushTimerRef.current) {
        window.clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    
    if (!canUseHelpBot) {
      setError("Please configure your Nati Pro API key or enter a custom API key to use the help bot.");
      return;
    }
    
    setError(null); // Clear any previous errors
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", reasoning: "" },
    ]);
    assistantBufferRef.current = "";
    reasoningBufferRef.current = "";
    setInput("");
    setStreaming(true);

    IpcClient.getInstance().startHelpChat(sessionId, trimmed, customApiKey || undefined, {
      onChunk: (delta) => {
        // Buffer assistant content; UI will flush on interval for smoothness
        assistantBufferRef.current += delta;
      },
      onEnd: () => {
        // Final flush then stop streaming
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
            next[lastIdx] = {
              ...next[lastIdx],
              content: assistantBufferRef.current,
              reasoning: reasoningBufferRef.current,
            };
          }
          return next;
        });
        setStreaming(false);
        if (flushTimerRef.current) {
          window.clearInterval(flushTimerRef.current);
          flushTimerRef.current = null;
        }
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setStreaming(false);

        // Clear the flush timer
        if (flushTimerRef.current) {
          window.clearInterval(flushTimerRef.current);
          flushTimerRef.current = null;
        }

        // Clear the buffers
        assistantBufferRef.current = "";
        reasoningBufferRef.current = "";

        // Remove the empty assistant message that was added optimistically
        setMessages((prev) => {
          const next = [...prev];
          if (
            next.length > 0 &&
            next[next.length - 1].role === "assistant" &&
            !next[next.length - 1].content
          ) {
            next.pop();
          }
          return next;
        });
      },
    });

    // Start smooth flush interval
    if (flushTimerRef.current) {
      window.clearInterval(flushTimerRef.current);
    }
    flushTimerRef.current = window.setInterval(() => {
      setMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
          const current = next[lastIdx];
          // Only update if there's any new data to apply
          if (
            current.content !== assistantBufferRef.current ||
            current.reasoning !== reasoningBufferRef.current
          ) {
            next[lastIdx] = {
              ...current,
              content: assistantBufferRef.current,
              reasoning: reasoningBufferRef.current,
            };
          }
        }
        return next;
      });
    }, FLUSH_INTERVAL_MS);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Nati Help Bot
          </DialogTitle>
          <DialogDescription>
            Ask questions about Nati. {!isPro && "(Pro feature)"}{" "}
            <a href="https://natiweb.vercel.app/docs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              View Documentation <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 h-[480px]">
          {!isPro && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
              <div className="text-amber-600 dark:text-amber-400 text-sm">
                <strong>Nati Pro Required:</strong> The Help Bot is a Pro feature. Please upgrade to Nati Pro to use this feature.
              </div>
            </div>
          )}
          {isPro && !hasProApiKey && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-blue-600 dark:text-blue-400 text-sm flex-1">
                  {showApiKeyInput ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Enter your OpenAI-compatible API key:</label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                      />
                      <p className="text-xs opacity-70">Your key is stored locally and never sent to our servers.</p>
                    </div>
                  ) : (
                    <div>
                      <strong>No Nati Pro API Key:</strong> Configure your Nati Pro API key in Settings, or use your own API key.
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="flex-shrink-0"
                >
                  <Key className="h-4 w-4 mr-1" />
                  {showApiKeyInput ? 'Hide' : 'Use Custom Key'}
                </Button>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-start gap-2">
                <div className="text-destructive text-sm font-medium">
                  Error:
                </div>
                <div className="text-destructive text-sm flex-1">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="text-destructive hover:text-destructive/80 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-auto rounded-md border p-3 bg-(--background-lightest)">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Ask a question about using Nati.
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={!canUseHelpBot}
                      className="px-3 py-1.5 text-xs rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground/70 bg-muted/50 rounded-md p-3">
                  This conversation may be logged and used to improve the
                  product. Please do not put any sensitive information in here.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i}>
                    {m.role === "user" ? (
                      <div className="text-right">
                        <div className="inline-block rounded-lg px-3 py-2 bg-primary text-primary-foreground">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div className="text-left">
                        {streaming && i === messages.length - 1 && (
                          <LoadingBlock
                            isStreaming={streaming && i === messages.length - 1}
                          />
                        )}

                        {m.content && (
                          <div className="inline-block rounded-lg px-3 py-2 bg-muted prose dark:prose-invert prose-headings:mb-2 prose-p:my-1 prose-pre:my-0 max-w-none">
                            <VanillaMarkdownParser content={m.content} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 h-10 rounded-md border bg-background px-3 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={streaming || !input.trim() || !canUseHelpBot}>
              {streaming ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
