import { SendIcon, StopCircleIcon, Sparkles, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useAppVersion } from "@/hooks/useAppVersion";
import { homeChatInputValueAtom } from "@/atoms/chatAtoms"; // Use a different atom for home input
import { useAtom } from "jotai";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useAttachments } from "@/hooks/useAttachments";
import { AttachmentsList } from "./AttachmentsList";
import { DragDropOverlay } from "./DragDropOverlay";
import { FileAttachmentDropdown } from "./FileAttachmentDropdown";
import { usePostHog } from "posthog-js/react";
import { HomeSubmitOptions } from "@/pages/home";
import { ChatInputControls } from "../ChatInputControls";
import { LexicalChatInput } from "./LexicalChatInput";
import { useState, useEffect } from "react";

const ANIMATED_PLACEHOLDERS = [
  "Build a modern dashboard with charts...",
  "Create a social media app with real-time chat...",
  "Design a landing page for a SaaS product...",
  "Generate an e-commerce store with cart...",
];

export function HomeChatInput({
  onSubmit,
}: {
  onSubmit: (options?: HomeSubmitOptions) => void;
}) {
  const posthog = usePostHog();
  const [inputValue, setInputValue] = useAtom(homeChatInputValueAtom);
  const { settings } = useSettings();
  const appVersion = useAppVersion();
  const { isStreaming } = useStreamChat({
    hasChatId: false,
  }); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Animated placeholder rotation
  useEffect(() => {
    if (inputValue) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ANIMATED_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [inputValue]);

  // Use the attachments hook
  const {
    attachments,
    isDraggingOver,
    handleFileSelect,
    removeAttachment,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearAttachments,
    handlePaste,
  } = useAttachments();

  // Custom submit function that wraps the provided onSubmit
  const handleCustomSubmit = () => {
    if ((!inputValue.trim() && attachments.length === 0) || isStreaming) {
      return;
    }

    // Call the parent's onSubmit handler with attachments
    onSubmit({ attachments });

    // Clear attachments as part of submission process
    clearAttachments();
    posthog.capture("chat:home_submit");
  };

  if (!settings) {
    return null; // Or loading state
  }

  const hasContent = inputValue.trim() || attachments.length > 0;

  return (
    <>
      <div className="p-4" data-testid="home-chat-input-container">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="relative"
        >
          {/* Premium animated mesh gradient background */}
          <div className="absolute -inset-[100px] opacity-30 blur-3xl pointer-events-none">
            <motion.div
              className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-500 via-purple-500 to-transparent rounded-full"
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-20 right-0 w-80 h-80 bg-gradient-to-br from-pink-500 via-rose-500 to-transparent rounded-full"
              animate={{
                x: [0, -30, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-500 via-blue-500 to-transparent rounded-full"
              animate={{
                x: [0, 40, 0],
                y: [0, -40, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Main input container */}
          <div
            className={`relative rounded-3xl transition-all duration-500 ${
              isDraggingOver 
                ? "ring-2 ring-indigo-500/50 ring-offset-4 ring-offset-background scale-[1.02]" 
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Premium glow effect */}
            <motion.div 
              className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 blur-2xl transition-opacity duration-500"
              animate={{ opacity: hasContent ? 0.3 : 0 }}
            />
            
            <div className="relative glass-surface rounded-3xl border border-white/20 dark:border-white/10 overflow-hidden backdrop-blur-2xl shadow-2xl">
              {/* Attachments list */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AttachmentsList
                      attachments={attachments}
                      onRemove={removeAttachment}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Drag and drop overlay */}
              <DragDropOverlay isDraggingOver={isDraggingOver} />

              {/* Main input area */}
              <div className="p-4">
                <div className="flex items-end gap-3">
                  {/* Input field with animated placeholder */}
                  <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={placeholderIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <LexicalChatInput
                          value={inputValue}
                          onChange={setInputValue}
                          onSubmit={handleCustomSubmit}
                          onPaste={handlePaste}
                          placeholder={ANIMATED_PLACEHOLDERS[placeholderIndex]}
                          disabled={isStreaming}
                          excludeCurrentApp={false}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* File attachment button */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <FileAttachmentDropdown
                        className=""
                        onFileSelect={handleFileSelect}
                        disabled={isStreaming}
                      />
                    </motion.div>

                    {/* Premium Send/Stop button */}
                    <AnimatePresence mode="wait">
                      {isStreaming ? (
                        <motion.button
                          key="stop"
                          initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.3, type: "spring" }}
                          className="relative flex items-center justify-center h-11 w-11 rounded-xl glass-surface opacity-50 cursor-not-allowed overflow-hidden"
                          title="Cancel generation (unavailable here)"
                          disabled
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-20" />
                          <StopCircleIcon size={20} className="text-red-500 relative z-10" />
                        </motion.button>
                      ) : (
                        <motion.button
                          key="send"
                          initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
                          whileHover={{ scale: hasContent ? 1.1 : 1 }}
                          whileTap={{ scale: hasContent ? 0.9 : 1 }}
                          transition={{ duration: 0.3, type: "spring", bounce: 0.5 }}
                          onClick={handleCustomSubmit}
                          disabled={!hasContent}
                          className={`relative flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-300 overflow-hidden group ${
                            hasContent
                              ? "shadow-2xl shadow-indigo-500/50"
                              : "opacity-30 cursor-not-allowed"
                          }`}
                          title="Send message"
                        >
                          {hasContent ? (
                            <>
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                                animate={{
                                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ backgroundSize: '200% 200%' }}
                              />
                              <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [0, 0.3, 0],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <div className="w-full h-full bg-white rounded-xl" />
                              </motion.div>
                              <SendIcon size={20} className="text-white relative z-10 drop-shadow-lg" />
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 glass-surface" />
                              <SendIcon size={20} className="relative z-10 text-white/40" />
                            </>
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Premium bottom controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 pt-4 border-t border-white/10 dark:border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <ChatInputControls />
                    
                    {/* Version indicator */}
                    <motion.div 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-surface border border-emerald-500/20"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-xs font-medium text-emerald-500">
                        {appVersion ? `v${appVersion}` : "Nati"}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Premium AI indicator with particles */}
          <AnimatePresence>
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl glass-surface border border-indigo-500/30 text-sm shadow-2xl shadow-indigo-500/20 backdrop-blur-xl"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Cpu size={18} className="text-indigo-500" />
                  </motion.div>
                  <motion.div
                    className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-md"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold glass-contrast-text">Nati is building...</span>
                  <motion.div className="flex gap-1 mt-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-indigo-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
