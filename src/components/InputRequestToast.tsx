import React from "react";
import { toast } from "sonner";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface InputRequestToastProps {
  message: string;
  toastId: string | number;
  onResponse: (response: "y" | "n") => void;
}

export function InputRequestToast({
  message,
  toastId,
  onResponse,
}: InputRequestToastProps) {
  const handleClose = () => {
    toast.dismiss(toastId);
  };

  const handleResponse = (response: "y" | "n") => {
    onResponse(response);
    toast.dismiss(toastId);
  };

  // Clean up the message by removing excessive newlines and whitespace
  const cleanMessage = message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return (
    <div className="relative rounded-2xl glass-surface border shadow-lg ring-1 ring-amber-400/40 border-amber-500/60 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_16px_rgba(251,191,36,0.18)] w-[min(92vw,520px)] overflow-hidden">
      {/* Content */}
      <div className="p-5">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <h3 className="ml-3 text-base font-semibold text-amber-900 dark:text-amber-100">
                Input Required
              </h3>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="ml-auto flex-shrink-0 p-1.5 text-amber-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-slate-200 transition-colors duration-200 rounded-md hover:bg-amber-100/50 dark:hover:bg-slate-700/50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message */}
            <div className="mb-5">
              <p className="text-sm glass-contrast-text whitespace-pre-wrap leading-relaxed">
                {cleanMessage}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleResponse("y")}
                size="sm"
                className="px-6 glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 hover:text-white dark:hover:text-white"
              >
                Yes
              </Button>
              <Button
                onClick={() => handleResponse("n")}
                size="sm"
                variant="outline"
                className="px-6 border-amber-300 dark:border-slate-500 text-amber-800 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
