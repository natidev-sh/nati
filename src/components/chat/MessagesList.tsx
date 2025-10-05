import type React from "react";
import type { Message } from "@/ipc/ipc_types";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import { OpenRouterSetupBanner, SetupBanner } from "../SetupBanner";

import { useStreamChat } from "@/hooks/useStreamChat";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { useAtomValue, useSetAtom } from "jotai";
import { Loader2, RefreshCw, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVersions } from "@/hooks/useVersions";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { showError, showWarning } from "@/lib/toast";
import { IpcClient } from "@/ipc/ipc_client";
import { chatMessagesAtom } from "@/atoms/chatAtoms";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useSettings } from "@/hooks/useSettings";
import { useUserBudgetInfo } from "@/hooks/useUserBudgetInfo";
import { PromoMessage } from "./PromoMessage";

interface MessagesListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessagesList = forwardRef<HTMLDivElement, MessagesListProps>(
  function MessagesList({ messages, messagesEndRef }, ref) {
    const appId = useAtomValue(selectedAppIdAtom);
    const { versions, revertVersion } = useVersions(appId);
    const { streamMessage, isStreaming } = useStreamChat();
    const { isAnyProviderSetup, isProviderSetup } = useLanguageModelProviders();
    const { settings } = useSettings();
    const setMessages = useSetAtom(chatMessagesAtom);
    const [isUndoLoading, setIsUndoLoading] = useState(false);
    const [isRetryLoading, setIsRetryLoading] = useState(false);
    const selectedChatId = useAtomValue(selectedChatIdAtom);
    const { userBudget } = useUserBudgetInfo();

    // Remember per-chat visible counts during the session
    const visibleCountStoreRef = useRef<Map<number, number>>(new Map());
    const STORAGE_KEY_PREFIX = "chatVisibleCount:";

    // Lazy rendering: only show last N messages, allow loading older chunks.
    const DEFAULT_CHUNK = 40; // adjust as desired
    const initialVisible = (() => {
      // Prefer persisted value from localStorage
      let saved: number | undefined = undefined;
      if (selectedChatId) {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + String(selectedChatId));
        if (raw) {
          const n = Number.parseInt(raw, 10);
          if (!Number.isNaN(n)) saved = n;
        }
        if (saved === undefined) {
          saved = visibleCountStoreRef.current!.get(selectedChatId);
        }
      }
      const base = Math.min(DEFAULT_CHUNK, messages.length || 0);
      return Math.min(messages.length || 0, saved ?? base);
    })();
    const [visibleCount, setVisibleCount] = useState<number>(initialVisible);

    // Keep visibleCount in bounds when messages length changes
    useEffect(() => {
      setVisibleCount((prev) => {
        if (messages.length === 0) return 0;
        // Ensure we at least show last DEFAULT_CHUNK, but don't exceed length
        const minNeeded = Math.min(DEFAULT_CHUNK, messages.length);
        // If prev is 0 (first mount) or too small, bump to minNeeded
        const next = Math.max(prev || 0, minNeeded);
        return Math.min(next, messages.length);
      });
    }, [messages.length]);

    // Persist per-chat visible count (runtime + localStorage)
    useEffect(() => {
      if (selectedChatId) {
        visibleCountStoreRef.current!.set(selectedChatId, visibleCount);
        try {
          localStorage.setItem(
            STORAGE_KEY_PREFIX + String(selectedChatId),
            String(visibleCount),
          );
        } catch {}
      }
    }, [selectedChatId, visibleCount]);

    const startIndex = Math.max(0, messages.length - visibleCount);
    const visibleMessages = useMemo(
      () => messages.slice(startIndex),
      [messages, startIndex],
    );

    // Ensure the list starts at the bottom (latest message) after mount and when the visible window changes
    useEffect(() => {
      // Only when we actually have messages rendered
      if (visibleMessages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleMessages.length]);

    const renderSetupBanner = () => {
      const selectedModel = settings?.selectedModel;
      if (
        selectedModel?.name === "free" &&
        selectedModel?.provider === "auto" &&
        !isProviderSetup("openrouter")
      ) {
        return <OpenRouterSetupBanner className="w-full" />;
      }
      if (!isAnyProviderSetup()) {
        return <SetupBanner />;
      }
      return null;
    };

    // Helper to preserve scroll position when prepending items
    const containerRef = ref as React.MutableRefObject<HTMLDivElement | null>;
    const isLoadingPrevRef = useRef(false);
    const lastLoadTsRef = useRef(0);
    const loadPrevious = () => {
      if (isLoadingPrevRef.current) return;
      // throttle loads to ~200ms
      const now = Date.now();
      if (now - lastLoadTsRef.current < 200) return;
      lastLoadTsRef.current = now;
      isLoadingPrevRef.current = true;
      const container = containerRef?.current;
      const prevScrollHeight = container?.scrollHeight ?? 0;
      const prevScrollTop = container?.scrollTop ?? 0;
      const toAdd = DEFAULT_CHUNK;
      setVisibleCount((prev) => Math.min(messages.length, prev + toAdd));
      // After React renders more items, adjust scrollTop so viewport stays put
      requestAnimationFrame(() => {
        const newScrollHeight = container?.scrollHeight ?? prevScrollHeight;
        if (container) {
          const delta = newScrollHeight - prevScrollHeight;
          container.scrollTop = prevScrollTop + delta;
        }
        isLoadingPrevRef.current = false;
      });
    };

    // Infinite scroll on reaching near the top
    useEffect(() => {
      const el = containerRef?.current;
      if (!el) return;
      const onScroll = () => {
        if (el.scrollTop <= 120 && startIndex > 0) {
          loadPrevious();
        }
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    }, [containerRef, startIndex]);

    return (
      <div
        className="relative flex-1 overflow-y-auto p-4"
        ref={ref}
        data-testid="messages-list"
      >
        {/* Infinite scroll up enabled; button removed */}

        {visibleMessages.length > 0
          ? visibleMessages.map((message, localIndex) => {
              const index = startIndex + localIndex;
              // Compute neighboring assistant commits for this message
              let prevAssistantCommit: string | null = null;
              let nextAssistantCommit: string | null = null;
              let nextAssistantSummary: string | null = null;
              // previous assistant (state before this message led to any changes)
              for (let i = index - 1; i >= 0; i--) {
                const m = messages[i];
                if (m.role === "assistant" && m.commitHash) {
                  prevAssistantCommit = m.commitHash;
                  break;
                }
              }
              // next assistant (likely the changes produced from this message)
              for (let i = index + 1; i < messages.length; i++) {
                const m = messages[i];
                if (m.role === "assistant" && m.commitHash) {
                  nextAssistantCommit = m.commitHash;
                  nextAssistantSummary = m.content || null;
                  break;
                }
              }

              return (
                <ChatMessage
                  key={index}
                  message={message}
                  isLastMessage={index === messages.length - 1}
                  prevAssistantCommit={prevAssistantCommit}
                  nextAssistantCommit={nextAssistantCommit}
                  nextAssistantSummary={nextAssistantSummary}
                />
              );
            })
          : !renderSetupBanner() && (
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
                <div className="flex flex-1 items-center justify-center text-gray-500">
                  No messages yet
                </div>
              </div>
            )}
        {!isStreaming && (
          <div className="flex max-w-3xl mx-auto gap-2">
            {!!messages.length &&
              messages[messages.length - 1].role === "assistant" &&
              messages[messages.length - 1].commitHash && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUndoLoading}
                  onClick={async () => {
                    if (!selectedChatId || !appId) {
                      console.error("No chat selected or app ID not available");
                      return;
                    }

                    setIsUndoLoading(true);
                    try {
                      if (messages.length >= 3) {
                        const previousAssistantMessage =
                          messages[messages.length - 3];
                        if (
                          previousAssistantMessage?.role === "assistant" &&
                          previousAssistantMessage?.commitHash
                        ) {
                          console.debug(
                            "Reverting to previous assistant version",
                          );
                          await revertVersion({
                            versionId: previousAssistantMessage.commitHash,
                          });
                          const chat =
                            await IpcClient.getInstance().getChat(
                              selectedChatId,
                            );
                          setMessages(chat.messages);
                        }
                      } else {
                        const chat =
                          await IpcClient.getInstance().getChat(selectedChatId);
                        if (chat.initialCommitHash) {
                          await revertVersion({
                            versionId: chat.initialCommitHash,
                          });
                          try {
                            await IpcClient.getInstance().deleteMessages(
                              selectedChatId,
                            );
                            setMessages([]);
                          } catch (err) {
                            showError(err);
                          }
                        } else {
                          showWarning(
                            "No initial commit hash found for chat. Need to manually undo code changes",
                          );
                        }
                      }
                    } catch (error) {
                      console.error("Error during undo operation:", error);
                      showError("Failed to undo changes");
                    } finally {
                      setIsUndoLoading(false);
                    }
                  }}
                >
                  {isUndoLoading ? (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  ) : (
                    <Undo size={16} />
                  )}
                  Undo
                </Button>
              )}
            {!!messages.length && (
              <Button
                variant="outline"
                size="sm"
                disabled={isRetryLoading}
                onClick={async () => {
                  if (!selectedChatId) {
                    console.error("No chat selected");
                    return;
                  }

                  setIsRetryLoading(true);
                  try {
                    // The last message is usually an assistant, but it might not be.
                    const lastVersion = versions[0];
                    const lastMessage = messages[messages.length - 1];
                    let shouldRedo = true;
                    if (
                      lastVersion.oid === lastMessage.commitHash &&
                      lastMessage.role === "assistant"
                    ) {
                      const previousAssistantMessage =
                        messages[messages.length - 3];
                      if (
                        previousAssistantMessage?.role === "assistant" &&
                        previousAssistantMessage?.commitHash
                      ) {
                        console.debug(
                          "Reverting to previous assistant version",
                        );
                        await revertVersion({
                          versionId: previousAssistantMessage.commitHash,
                        });
                        shouldRedo = false;
                      } else {
                        const chat =
                          await IpcClient.getInstance().getChat(selectedChatId);
                        if (chat.initialCommitHash) {
                          console.debug(
                            "Reverting to initial commit hash",
                            chat.initialCommitHash,
                          );
                          await revertVersion({
                            versionId: chat.initialCommitHash,
                          });
                        } else {
                          showWarning(
                            "No initial commit hash found for chat. Need to manually undo code changes",
                          );
                        }
                      }
                    }

                    // Find the last user message
                    const lastUserMessage = [...messages]
                      .reverse()
                      .find((message) => message.role === "user");
                    if (!lastUserMessage) {
                      console.error("No user message found");
                      return;
                    }
                    // Need to do a redo, if we didn't delete the message from a revert.
                    const redo = shouldRedo;
                    console.debug("Streaming message with redo", redo);

                    streamMessage({
                      prompt: lastUserMessage.content,
                      chatId: selectedChatId,
                      redo,
                    });
                  } catch (error) {
                    console.error("Error during retry operation:", error);
                    showError("Failed to retry message");
                  } finally {
                    setIsRetryLoading(false);
                  }
                }}
              >
                {isRetryLoading ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Retry
              </Button>
            )}
          </div>
        )}

        {isStreaming &&
          !settings?.enableDyadPro &&
          !userBudget &&
          messages.length > 0 && (
            <PromoMessage
              seed={messages.length * (appId ?? 1) * (selectedChatId ?? 1)}
            />
          )}
        <div ref={messagesEndRef} />
        {renderSetupBanner()}

        {/* Scroll to latest floating button */}
        <ScrollToLatestButton containerRef={containerRef} onClick={() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }} />
      </div>
    );
  },
);

function ScrollToLatestButton({
  containerRef,
  onClick,
}: {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  onClick: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    let lastTop = el.scrollTop;
    const check = (forceShowUp = false) => {
      const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
      if (forceShowUp) {
        // As soon as user scrolls up, show the button
        setVisible(true);
        return;
      }
      // Otherwise, show when not near bottom; hide near bottom
      setVisible(distance > 40);
    };
    // Initial check
    check();
    const onScroll = () => {
      const currentTop = el.scrollTop;
      const delta = currentTop - lastTop;
      lastTop = currentTop;
      if (delta < -2) {
        // User scrolled up
        check(true);
      } else {
        // Scrolling down or stationary; hide if near bottom
        check(false);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute bottom-4 right-4">
      <Button
        size="sm"
        variant="outline"
        className="pointer-events-auto shadow-md"
        onClick={onClick}
      >
        Scroll to latest
      </Button>
    </div>
  );
}
