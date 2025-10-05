import type { Message } from "@/ipc/ipc_types";
import {
  DyadMarkdownParser,
  VanillaMarkdownParser,
} from "./DyadMarkdownParser";
import { motion } from "framer-motion";
import { useStreamChat } from "@/hooks/useStreamChat";
import {
  CheckCircle,
  XCircle,
  Clock,
  GitCommit,
  Copy,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useVersions } from "@/hooks/useVersions";
import { useAtomValue, useSetAtom } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { isPreviewOpenAtom, selectedFileAtom } from "@/atoms/viewAtoms";
import { useMemo, useEffect, useState } from "react";
import { Files, FileCode2, AlertTriangle } from "lucide-react";
import { ChatImageLightBox } from "./ChatImageLightBox";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ChatMessageProps {
  message: Message;
  isLastMessage: boolean;
  prevAssistantCommit?: string | null;
  nextAssistantCommit?: string | null;
  nextAssistantSummary?: string | null;
}

const ChatMessage = ({ message, isLastMessage, prevAssistantCommit, nextAssistantCommit, nextAssistantSummary }: ChatMessageProps) => {
  const { isStreaming } = useStreamChat();
  const appId = useAtomValue(selectedAppIdAtom);
  const { versions: liveVersions, revertVersion, isRevertingVersion } = useVersions(appId);
  //handle copy chat
  const { copyMessageContent, copied } = useCopyToClipboard();
  const setPreviewOpen = useSetAtom(isPreviewOpenAtom);
  const setSelectedFile = useSetAtom(selectedFileAtom);
  const handleCopyFormatted = async () => {
    await copyMessageContent(message.content);
  };

  // Detect and render Problem Fix Prompt (pretty UI)
  const isProblemFixPrompt = (text: string) =>
    /^Fix these \d+ TypeScript compile-time error/.test(text.trim());

  type ParsedProblem = {
    index: number;
    file?: string;
    line?: number;
    column?: number;
    message?: string;
    code?: string;
    snippet?: string | null;
  };

  const parseProblemFixPrompt = (text: string): { total: number; items: ParsedProblem[] } => {
    const lines = text.split(/\r?\n/);
    const header = lines[0] ?? "";
    const m = header.match(/Fix these (\d+)/);
    const total = m ? Number(m[1]) : 0;
    const items: ParsedProblem[] = [];
    let i = 1;
    while (i < lines.length) {
      const line = lines[i];
      const itemMatch = line?.match(/^(\d+)\.\s+([^:]+):(\d+):(\d+)\s+-\s+(.+?)\s+\(TS(\d+)\)\s*$/);
      if (itemMatch) {
        const idx = Number(itemMatch[1]);
        const file = itemMatch[2];
        const ln = Number(itemMatch[3]);
        const col = Number(itemMatch[4]);
        const msg = itemMatch[5];
        const code = `TS${itemMatch[6]}`;
        let snippet: string | null = null;
        // Look ahead for fenced block
        if (lines[i + 1] === "```" ) {
          let j = i + 2;
          const buf: string[] = [];
          while (j < lines.length && lines[j] !== "```") { buf.push(lines[j]); j++; }
          if (j < lines.length && lines[j] === "```") { snippet = buf.join("\n"); i = j + 1; } else { i++; }
        } else {
          i++;
        }
        items.push({ index: idx, file, line: ln, column: col, message: msg, code, snippet });
      } else {
        i++;
      }
    }
    return { total, items };
  };

  // Open file in preview panel
  const openFileInPreview = (path: string) => {
    if (!path) return;
    setSelectedFile({ path });
    setPreviewOpen(true);
  };

  // Parse inline dyad-attachment tags from message content
  const parseInlineAttachments = (text: string) => {
    const attachments: { name: string; type: string; dataUrl: string }[] = [];
    const tagRegex = /<dyad-attachment\s+name="([^"]+)"\s+type="([^"]+)"\s+data-url="([^"]+)">\s*<\/dyad-attachment>|<dyad-attachment\s+name="([^"]+)"\s+type="([^"]+)"\s+data-url="([^"]+)">\s*/g;
    let cleaned = text;
    cleaned = cleaned.replace(/\n?Attachments:\n?/g, "\n");
    // remove bullet lines like: - filename (type)
    cleaned = cleaned
      .split(/\r?\n/)
      .filter((line) => !/^\s*-\s+.+\([^()]+\)\s*$/.test(line))
      .join("\n");

    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(text)) !== null) {
      const name = m[1] || m[4] || "attachment";
      const type = m[2] || m[5] || "application/octet-stream";
      const dataUrl = m[3] || m[6] || "";
      if (dataUrl) attachments.push({ name, type, dataUrl });
    }
    cleaned = cleaned.replace(/<dyad-attachment[\s\S]*?>[\s\S]*?<\/dyad-attachment>/g, "");
    cleaned = cleaned.replace(/<dyad-attachment[\s\S]*?>/g, "");
    return { cleaned, attachments };
  };

  // Lightbox state for image previews
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);

  // Render user message with inline clickable @file tokens
  const renderUserContentWithMentions = (text: string) => {
    const parts: Array<{ t: string; file?: string }> = [];
    const regex = /@([^\s`]+)|\n|\r/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const idx = match.index;
      if (idx > lastIndex) {
        parts.push({ t: text.slice(lastIndex, idx) });
      }
      if (match[0] === "\n" || match[0] === "\r") {
        parts.push({ t: "\n" });
      } else if (match[1]) {
        parts.push({ t: "@" + match[1], file: match[1] });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ t: text.slice(lastIndex) });
    }

    return (
      <div className="whitespace-pre-wrap break-words leading-6">
        {parts.map((p, i) =>
          p.file ? (
            <button
              key={i}
              onClick={() => openFileInPreview(p.file!)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium glass-button glass-hover align-baseline cursor-pointer"
              title={p.file}
            >
              <FileCode2 size={14} className="glass-contrast-text" />
              <code className="text-xs">{p.t}</code>
            </button>
          ) : (
            <span key={i}>{p.t}</span>
          ),
        )}
      </div>
    );
  };
  // Find the version that was active when this message was sent
  const messageVersion = useMemo(() => {
    if (
      message.role === "assistant" &&
      message.commitHash &&
      liveVersions.length
    ) {
      return (
        liveVersions.find(
          (version) =>
            message.commitHash &&
            version.oid.slice(0, 7) === message.commitHash.slice(0, 7),
        ) || null
      );
    }
    return null;
  }, [message.commitHash, message.role, liveVersions]);

  // Format the message timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours =
      (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return formatDistanceToNow(messageTime, { addSuffix: true });
    } else {
      return format(messageTime, "MMM d, yyyy 'at' h:mm a");
    }
  };

  return (
    <div
      className={`flex ${
        message.role === "assistant" ? "justify-start" : "justify-end"
      }`}
    >
      <div className={`mt-2 w-full max-w-3xl mx-auto group`}>
        <div
          className={`rounded-lg p-2 relative ${
            message.role === "assistant" ? "" : "ml-24 bg-(--sidebar-accent)"
          }`}
        >
          {message.role === "assistant" &&
          !message.content &&
          isStreaming &&
          isLastMessage ? (
            <div className="flex h-6 items-center space-x-2 p-2">
              <motion.div
                className="h-3 w-3 rounded-full bg-(--primary) dark:bg-blue-500"
                animate={{ y: [0, -12, 0] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 0.4,
                  ease: "easeOut",
                  repeatDelay: 1.2,
                }}
              />
              <motion.div
                className="h-3 w-3 rounded-full bg-(--primary) dark:bg-blue-500"
                animate={{ y: [0, -12, 0] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.4,
                  repeatDelay: 1.2,
                }}
              />
              <motion.div
                className="h-3 w-3 rounded-full bg-(--primary) dark:bg-blue-500"
                animate={{ y: [0, -12, 0] }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.8,
                  repeatDelay: 1.2,
                }}
              />
            </div>
          ) : (
            (() => {
              // Extract a special "Files referenced" section and render it in a nati-styled panel.
              const content = message.content || "";
              const { cleaned, attachments } = parseInlineAttachments(content);
              const remaining = cleaned;

              return (
                <div
                  className="prose dark:prose-invert prose-headings:mb-2 prose-p:my-1 prose-pre:my-0 max-w-none break-words"
                  suppressHydrationWarning
                >
                  {/* Message content first */}
                  {message.role === "assistant"
                    ? (
                      isProblemFixPrompt(remaining)
                        ? (() => {
                            const { total, items } = parseProblemFixPrompt(remaining);
                            return (
                              <div className="rounded-xl glass-surface border p-2 sm:p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  <div className="font-semibold text-sm">TypeScript Problems</div>
                                  <div className="text-[11px] opacity-70">{total} issue{total === 1 ? "" : "s"}</div>
                                </div>
                                <div className="space-y-2">
                                  {items.map((p) => (
                                    <div key={p.index} className="rounded-lg border border-white/10 overflow-hidden">
                                      <div className="flex items-center justify-between px-2 py-1.5 bg-white/50 dark:bg-white/5">
                                        <div className="flex items-center gap-2 text-[12px]">
                                          <FileCode2 className="h-3.5 w-3.5" />
                                          <span className="font-mono truncate max-w-[50vw]" title={`${p.file}:${p.line}:${p.column}`}>{p.file}:{p.line}:{p.column}</span>
                                        </div>
                                        <span className="text-[11px] opacity-70">{p.code}</span>
                                      </div>
                                      <div className="px-2 py-1.5 text-sm">
                                        <div className="text-[13px] mb-1">{p.message}</div>
                                        {p.snippet && (
                                          <pre className="mt-1 p-2 rounded-md bg-zinc-900/90 text-zinc-100 overflow-auto text-xs"><code>{p.snippet}</code></pre>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-[12px] opacity-70">Please fix all errors in a concise way.</div>
                              </div>
                            );
                          })()
                        : (
                          <>
                            <DyadMarkdownParser content={remaining} />
                            {isLastMessage && isStreaming && (
                              <div className="mt-4 ml-4 relative w-5 h-5 animate-spin">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-(--primary) dark:bg-blue-500 rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 bg-(--primary) dark:bg-blue-500 rounded-full opacity-80"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-(--primary) dark:bg-blue-500 rounded-full opacity-60"></div>
                              </div>
                            )}
                          </>
                        )
                    )
                    : (
                      <>
                        {renderUserContentWithMentions(remaining)}
                        {attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {attachments.map((a, i) => {
                              const isImage = a.type.startsWith("image/");
                              if (isImage) {
                                return (
                                  <button
                                    key={i}
                                    className="overflow-hidden rounded-lg border glass-surface hover:opacity-90 transition cursor-pointer"
                                    title={a.name}
                                    onClick={() => {
                                      const imgs = attachments
                                        .filter((x) => x.type.startsWith("image/"))
                                        .map((x) => ({ name: x.name, dataUrl: x.dataUrl }));
                                      setLightboxImages(imgs);
                                      // compute index among images only
                                      const imgIndex = imgs.findIndex((im) => im.dataUrl === a.dataUrl);
                                      setLightboxIndex(imgIndex >= 0 ? imgIndex : 0);
                                    }}
                                  >
                                    <img src={a.dataUrl} alt={a.name} className="h-24 w-24 object-cover" />
                                  </button>
                                );
                              }
                              return (
                                <a
                                  key={i}
                                  href={a.dataUrl}
                                  download={a.name}
                                  className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border glass-surface text-xs cursor-pointer"
                                  title={a.name}
                                >
                                  <Files className="h-3.5 w-3.5" />
                                  <span className="max-w-[200px] truncate">{a.name}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                  {/* No files panel */}
                </div>
              );
            })()
          )}
          <ChatImageLightBox
            images={lightboxImages}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onChangeIndex={(idx) => setLightboxIndex(idx)}
          />
          {(message.role === "assistant" && message.content && !isStreaming) ||
          message.approvalState ? (
            <div
              className={`mt-2 flex items-center ${
                message.role === "assistant" &&
                message.content &&
                !isStreaming &&
                message.approvalState
                  ? "justify-between"
                  : ""
              } text-xs`}
            >
              {message.role === "assistant" &&
                message.content &&
                !isStreaming && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          data-testid="copy-message-button"
                          onClick={handleCopyFormatted}
                          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200 cursor-pointer"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline"></span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? "Copied!" : "Copy"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              {message.approvalState && (
                <div className="flex items-center">
                  {message.approvalState === "approved" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg glass-surface border ring-1 ring-green-500/20 text-green-700 dark:text-green-300 bg-green-500/10">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Approved</span>
                    </span>
                  ) : message.approvalState === "rejected" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg glass-surface border ring-1 ring-red-500/20 text-red-700 dark:text-red-300 bg-red-500/10">
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Rejected</span>
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {/* User revert affordance: hover button + confirm dialog (inside bubble for correct positioning) */}
          {message.role === "user" && prevAssistantCommit && nextAssistantCommit && (
            <>
              <div className="absolute bottom-1 right-1 z-10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                <button
                  className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border glass-surface glass-hover cursor-pointer"
                  disabled={!!isRevertingVersion}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRevertDialogOpen(true);
                  }}
                  title="Revert changes from this message"
                >
                  {isRevertingVersion ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  <span>Revert</span>
                </button>
              </div>

              <Dialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Revert changes from this message?</DialogTitle>
                    <DialogDescription>
                      This will revert the app from <code>{nextAssistantCommit.slice(0,7)}</code> back to <code>{prevAssistantCommit.slice(0,7)}</code>.
                    </DialogDescription>
                  </DialogHeader>
                  {nextAssistantSummary && (
                    <div className="mt-2 text-sm">
                      <div className="mb-1 font-medium">Summary of changes (assistant):</div>
                      <div className="max-h-48 overflow-auto p-2 rounded border bg-white/50 dark:bg-white/5">
                        <pre className="text-xs whitespace-pre-wrap">{nextAssistantSummary}</pre>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRevertDialogOpen(false)} disabled={isRevertingVersion}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!prevAssistantCommit) return;
                        try {
                          await revertVersion({ versionId: prevAssistantCommit });
                          setIsRevertDialogOpen(false);
                        } catch (e) {
                          console.error("Failed to revert", e);
                        }
                      }}
                      disabled={isRevertingVersion}
                    >
                      {isRevertingVersion ? "Reverting..." : "Confirm Revert"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
        {/* Timestamp and commit info for assistant messages - only visible on hover */}
        {message.role === "assistant" && message.createdAt && (
          <div className="mt-1 flex items-center justify-start space-x-2 text-xs text-gray-500 dark:text-gray-400 ">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatTimestamp(message.createdAt)}</span>
            </div>
            {messageVersion && messageVersion.message && (
              <div className="flex items-center space-x-1">
                <GitCommit className="h-3 w-3" />
                {messageVersion && messageVersion.message && (
                  <span className="max-w-70 truncate font-medium">
                    {
                      messageVersion.message
                        .replace(/^\[dyad\]\s*/i, "")
                        .split("\n")[0]
                    }
                  </span>
                )}
              </div>
            )}
        </div>
        )}

      </div>
    </div>
  );
}
;
export default ChatMessage;
