import React from "react";
import { toast } from "sonner";
import { X, Copy, Check } from "lucide-react";

interface CustomErrorToastProps {
  message: string;
  toastId: string | number;
  copied?: boolean;
  onCopy?: () => void;
}

export function CustomErrorToast({
  message,
  toastId,
  copied = false,
  onCopy,
}: CustomErrorToastProps) {
  const handleClose = () => {
    toast.dismiss(toastId);
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    }
  };

  return (
    <div className="relative rounded-2xl glass-surface border shadow-lg ring-1 ring-red-400/40 border-red-500/60 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_0_16px_rgba(248,113,113,0.18)] w-[min(92vw,500px)] overflow-hidden select-none">
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-sm">
                  <X className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="ml-3 text-sm font-medium text-red-800 dark:text-red-200">Error</h3>

              {/* Action buttons */}
              <div className="flex items-center space-x-1.5 ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-white/10 rounded-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-white/10 rounded-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm glass-contrast-text leading-relaxed whitespace-pre-wrap glass-surface border p-3 rounded-xl select-text">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
