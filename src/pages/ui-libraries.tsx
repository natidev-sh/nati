import React from "react";
import { ExternalLink, Library } from "lucide-react";

export default function UiLibrariesPage() {
  return (
    <div className="min-h-screen px-6 md:px-8 py-6">
      <div className="max-w-7xl mx-auto h-[calc(100vh-3rem)] flex flex-col gap-4">
        {/* Header */}
        <div className="rounded-2xl glass-surface border shadow-sm ring-1 ring-white/20 dark:ring-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold glass-contrast-text">UI Libraries</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  A curated collection of Shadcn UI websites. Explore and get inspired.
                </p>
              </div>
            </div>
            <a
              href="https://shadway.online/"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-button glass-hover glass-active text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in browser</span>
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-2xl overflow-hidden glass-surface border ring-1 ring-white/20 dark:ring-white/10">
          <iframe
            title="Shadway - Curated Shadcn UI"
            src="https://shadway.online/"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
