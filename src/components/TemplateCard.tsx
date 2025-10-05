import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { IpcClient } from "@/ipc/ipc_client";
import { useSettings } from "@/hooks/useSettings";
import { CommunityCodeConsentDialog } from "./CommunityCodeConsentDialog";
import type { Template } from "@/shared/templates";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { showWarning } from "@/lib/toast";

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  onCreateApp: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onCreateApp,
}) => {
  const { settings, updateSettings } = useSettings();
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const handleCardClick = () => {
    // If it's a community template and user hasn't accepted community code yet, show dialog
    if (!template.isOfficial && !settings?.acceptedCommunityCode) {
      setShowConsentDialog(true);
      return;
    }

    if (template.requiresNeon && !settings?.neon?.accessToken) {
      showWarning("Please connect your Neon account to use this template.");
      return;
    }

    // Otherwise, proceed with selection
    onSelect(template.id);
  };

  const handleConsentAccept = () => {
    // Update settings to accept community code
    updateSettings({ acceptedCommunityCode: true });

    // Select the template
    onSelect(template.id);

    // Close dialog
    setShowConsentDialog(false);
  };

  const handleConsentCancel = () => {
    // Just close dialog, don't update settings or select template
    setShowConsentDialog(false);
  };

  const handleGithubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (template.githubUrl) {
      IpcClient.getInstance().openExternalUrl(template.githubUrl);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className={`
          rounded-2xl overflow-hidden transform transition-all duration-300 ease-in-out 
          cursor-pointer group relative border shadow-sm glass-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70
          ${
            isSelected
              ? "ring-2 ring-blue-500/70 dark:ring-blue-400/70 shadow-xl"
              : "hover:shadow-lg hover:-translate-y-1"
          }
        `}
      >
        {/* Animated selected ring overlay */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-blue-500/70 dark:ring-blue-400/70 transition-all duration-300 ${
            isSelected ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        />

        <div className="relative">
          <img
            src={template.imageUrl}
            alt={template.title}
            className={`w-full h-52 object-cover transition-opacity duration-300 group-hover:opacity-90 ${
              isSelected ? "opacity-75" : ""
            }`}
          />
          {/* Faint inner gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          {isSelected && (
            <span className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">
              Selected
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-1.5">
            <h2
              className={`text-lg font-semibold ${
                isSelected
                  ? "text-blue-700 dark:text-blue-300"
                  : "glass-contrast-text"
              }`}
            >
              {template.title}
            </h2>
            {template.isOfficial && !template.isExperimental && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isSelected
                    ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-600 dark:text-blue-100 dark:border-blue-500"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800"
                }`}
              >
                Official
              </span>
            )}
            {template.isExperimental && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
                Experimental
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 h-10 overflow-y-auto">
            {template.description}
          </p>
          {template.githubUrl && (
            <a
              className={`inline-flex items-center text-sm font-medium transition-colors duration-200 ${
                isSelected
                  ? "text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  : "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              }`}
              onClick={handleGithubClick}
            >
              View on GitHub{" "}
              <ArrowLeft className="w-4 h-4 ml-1 transform rotate-180" />
            </a>
          )}

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCreateApp();
            }}
            size="sm"
            className={cn(
              "w-full font-semibold mt-2 transition-opacity duration-200 glass-surface border glass-hover text-zinc-900 dark:text-white",
              settings?.selectedTemplateId !== template.id
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100",
            )}
          >
            Create App
          </Button>
        </div>
      </div>

      <CommunityCodeConsentDialog
        isOpen={showConsentDialog}
        onAccept={handleConsentAccept}
        onCancel={handleConsentCancel}
      />
    </>
  );
};
