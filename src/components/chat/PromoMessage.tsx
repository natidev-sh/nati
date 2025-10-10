import { IpcClient } from "@/ipc/ipc_client";
import React from "react";
import { Sparkles } from "lucide-react";

// Types for the message system
export interface TextSpan {
  type: "text";
  content: string;
}

export interface LinkSpan {
  type: "link";
  content: string;
  url?: string;
  action?: () => void;
}

export type MessageSpan = TextSpan | LinkSpan;

export interface MessageConfig {
  spans: MessageSpan[];
}

// Generic Message component
export function Message({ spans }: MessageConfig) {
  return (
    <div className="max-w-3xl mx-auto my-3 rounded-2xl glass-surface border shadow-lg ring-1 ring-sky-400/30 px-4 sm:px-6 py-3 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-400/10 via-fuchsia-400/10 to-rose-400/10" />
      <div className="relative flex items-center justify-center gap-2 sm:gap-3 text-center select-none">
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" aria-hidden />
        <p className="text-sm sm:text-base glass-contrast-text">
          {spans.map((span, index) => {
            if (span.type === "text") {
              return (
                <span key={index} className="opacity-90">
                  {span.content}
                </span>
              );
            } else if (span.type === "link") {
              const onClick = () => {
                if (span.action) {
                  span.action();
                } else if (span.url) {
                  IpcClient.getInstance().openExternalUrl(span.url);
                }
              };
              return (
                <button
                  key={index}
                  onClick={onClick}
                  className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-md glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 hover:text-white dark:hover:text-white cursor-pointer"
                >
                  {span.content}
                </button>
              );
            }
            return null;
          })}
        </p>
      </div>
    </div>
  );
}

// Predefined message configurations
export const TURBO_EDITS_PROMO_MESSAGE: MessageConfig = {
  spans: [
    { type: "text", content: "Tired of waiting on AI?" },
    { type: "link", content: " Get Nati Pro", url: "https://natidev.com/pro#ai" },
    { type: "text", content: " for faster edits with Turbo Edits." },
  ],
};

export const SMART_CONTEXT_PROMO_MESSAGE: MessageConfig = {
  spans: [
    { type: "text", content: "Save up to 5x on AI costs with " },
    {
      type: "link",
      content: "Nati Pro's Smart Context",
      url: "https://natidev.com/pro#ai",
    },
  ],
};

// Example of other message types you could easily add
export const DIFFERENT_MODEL_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Getting stuck in a debugging loop? Try a different model.",
    },
  ],
};

export const REDDIT_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Join our ",
    },
    {
      type: "link",
      content: "Nati subreddit",
      url: "https://www.reddit.com/r/natidevs",
    },
  ],
};

export const REPORT_A_BUG_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Found a bug? Click Help > Report a Bug",
    },
  ],
};

export const UPLOAD_CHAT_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content:
        "Want to report a bad AI response? Upload the chat by clicking Help",
    },
  ],
};
// https://www.youtube.com/watch?v=a7OoruOkkeg&list=PL1xR2pfIiRlW7mgr9AS95OkFQBtvrSlO5
export const BUILD_A_BIBLE_APP_TIP: MessageConfig = {
  spans: [
    {
      type: "link",
      content: "Check",
      url: "https://www.reactbits.dev/",
    },
    {
      type: "text",
      content: " ReactBits - The best way to build React apps",
    },
  ],
};

export const DEBUGGING_TIPS_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Getting stuck? Read our ",
    },
    {
      type: "link",
      content: "debugging tips",
      url: "https://www.nati.dev/docs/guides/debugging",
    },
  ],
};

// Advanced tip: Customize your AI rules https://www.natidev.com/docs/guides/ai-rules
export const AI_RULES_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Advanced tip: Customize your ",
    },
    {
      type: "link",
      content: "AI rules",
      url: "https://www.natidev.com/docs/guides/ai-rules",
    },
  ],
};

export const NEW_CHAT_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Want to keep the AI focused? Start a new chat.",
    },
  ],
};

// Want to know what's next? Checkout our roadmap https://www.natidev.com/docs/roadmap
export const ROADMAP_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Want to know what's next? Check out our ",
    },
    {
      type: "link",
      content: "roadmap",
      url: "https://www.natidev.com/docs/roadmap",
    },
  ],
};

export const GITHUB_TIP: MessageConfig = {
  spans: [
    {
      type: "text",
      content: "Like Nati? Star it on ",
    },
    {
      type: "link",
      content: "GitHub",
      url: "https://github.com/dyad-sh/dyad",
    },
  ],
};
// Array of all available messages for rotation
const ALL_MESSAGES = [
  TURBO_EDITS_PROMO_MESSAGE,
  SMART_CONTEXT_PROMO_MESSAGE,
  DIFFERENT_MODEL_TIP,
  REDDIT_TIP,
  REPORT_A_BUG_TIP,
  UPLOAD_CHAT_TIP,
  BUILD_A_BIBLE_APP_TIP,
  DEBUGGING_TIPS_TIP,
  AI_RULES_TIP,
  NEW_CHAT_TIP,
  ROADMAP_TIP,
  GITHUB_TIP,
];

// Main PromoMessage component using the modular system
export function PromoMessage({ seed }: { seed: number }) {
  const hashedSeed = hashNumber(seed);
  const randomMessage = ALL_MESSAGES[hashedSeed % ALL_MESSAGES.length];
  return <Message {...randomMessage} />;
}

/**
 * Hashes a 32-bit integer using a variant of the MurmurHash3 algorithm.
 * This function is designed to produce a good, random-like distribution
 * of hash values, which is crucial for data structures like hash tables.
 * @param {number} key - The integer to hash.
 * @returns {number} A 32-bit integer hash.
 */
function hashNumber(key: number): number {
  // Ensure the key is treated as an integer.
  let i = key | 0;

  // MurmurHash3's mixing function (fmix32)
  // It uses a series of bitwise multiplications, shifts, and XORs
  // to thoroughly mix the bits of the input key.

  // XOR with a shifted version of itself to start mixing bits.
  i ^= i >>> 16;
  // Multiply by a large prime to further scramble bits.
  i = Math.imul(i, 0x85ebca6b);
  // Another XOR shift.
  i ^= i >>> 13;
  // Another prime multiplication.
  i = Math.imul(i, 0xc2b2ae35);
  // Final XOR shift to get the final mix.
  i ^= i >>> 16;

  // Return the result as an unsigned 32-bit integer.
  return i >>> 0;
}
