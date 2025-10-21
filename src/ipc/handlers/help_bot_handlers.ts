import { ipcMain } from "electron";
import { streamText } from "ai";
import { readSettings } from "../../main/settings";

import log from "electron-log";
import { safeSend } from "../utils/safe_sender";
import { createOpenAI } from "@ai-sdk/openai";
import { StartHelpChatParams } from "../ipc_types";

const logger = log.scope("help-bot");

// In-memory session store for help bot conversations
type HelpMessage = { role: "user" | "assistant"; content: string };
const helpSessions = new Map<string, HelpMessage[]>();
const activeHelpStreams = new Map<string, AbortController>();

export function registerHelpBotHandlers() {
  ipcMain.handle(
    "help:chat:start",
    async (event, params: StartHelpChatParams) => {
      const { sessionId, message, customApiKey } = params;
      try {
        if (!sessionId || !message?.trim()) {
          throw new Error("Missing sessionId or message");
        }

        // Clear any existing active streams (only one session at a time)
        for (const [existingSessionId, controller] of activeHelpStreams) {
          controller.abort();
          activeHelpStreams.delete(existingSessionId);
          helpSessions.delete(existingSessionId);
        }

        // Append user message to session history
        const history = helpSessions.get(sessionId) ?? [];
        const updatedHistory: HelpMessage[] = [
          ...history,
          { role: "user", content: message },
        ];

        const abortController = new AbortController();
        activeHelpStreams.set(sessionId, abortController);
        const settings = await readSettings();
        
        // Use custom API key if provided, otherwise fall back to Nati Pro key
        const apiKey = customApiKey || settings.providerSettings?.["auto"]?.apiKey?.value;
        
        if (!apiKey) {
          throw new Error("No API key available. Please configure your Nati Pro API key in Settings or provide a custom API key.");
        }
        
        // Use LiteLLM endpoint
        const provider = createOpenAI({
          baseURL: "https://litellm-production-6380.up.railway.app",
          apiKey,
        });

        let assistantContent = "";

        const systemPrompt = `You are Nati Help Bot, a specialized AI assistant EXCLUSIVELY for helping users with Nati - a free, local, open-source AI app builder.

STRICT RULES - YOU MUST FOLLOW THESE:
1. ONLY answer questions about Nati, its features, setup, and usage
2. REFUSE to write code, debug code, or help with programming tasks
3. REFUSE to engage in general conversation, creative writing, or any non-Nati topics
4. If asked about anything outside Nati, respond: "I can only help with questions about Nati. Please ask me about Nati features, setup, or usage. For general questions, please use the main chat feature."

Key features of Nati:
- Build web and mobile apps using AI
- Supports multiple AI models (Claude, GPT-5, Gemini, etc.)
- Local-first development
- Can connect to Supabase for database and auth
- Can connect to Neon for PostgreSQL databases
- Pro users get access to premium models and features
- Documentation: https://natiweb.vercel.app/docs

Your responses should be:
- Focused ONLY on Nati-related questions
- Concise and helpful
- Direct users to documentation when appropriate
- If you don't know something specific about Nati, admit it and suggest checking the documentation

Remember: You are NOT a general-purpose assistant. You ONLY help with Nati.`;

        const stream = streamText({
          model: provider("gpt-4o-mini"),
          system: systemPrompt,
          messages: updatedHistory as any,
          maxRetries: 1,
          onError: (error) => {
            let errorMessage = (error as any)?.error?.message || String(error);
            logger.error("help bot stream error", errorMessage);
            safeSend(event.sender, "help:chat:response:error", {
              sessionId,
              error: errorMessage,
            });
          },
        });

        (async () => {
          try {
            for await (const part of stream.fullStream) {
              if (abortController.signal.aborted) break;

              if (part.type === "text-delta") {
                assistantContent += part.text;
                safeSend(event.sender, "help:chat:response:chunk", {
                  sessionId,
                  delta: part.text,
                  type: "text",
                });
              }
            }

            // Finalize session history
            const finalHistory: HelpMessage[] = [
              ...updatedHistory,
              { role: "assistant", content: assistantContent },
            ];
            helpSessions.set(sessionId, finalHistory);

            safeSend(event.sender, "help:chat:response:end", { sessionId });
          } catch (err) {
            if ((err as any)?.name === "AbortError") {
              logger.log("help bot stream aborted", sessionId);
              return;
            }
            logger.error("help bot stream loop error", err);
            safeSend(event.sender, "help:chat:response:error", {
              sessionId,
              error: String(err instanceof Error ? err.message : err),
            });
          } finally {
            activeHelpStreams.delete(sessionId);
          }
        })();

        return { ok: true } as const;
      } catch (err) {
        logger.error("help:chat:start error", err);
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
  );

  ipcMain.handle("help:chat:cancel", async (_event, sessionId: string) => {
    const controller = activeHelpStreams.get(sessionId);
    if (controller) {
      controller.abort();
      activeHelpStreams.delete(sessionId);
    }
    return { ok: true } as const;
  });
}
