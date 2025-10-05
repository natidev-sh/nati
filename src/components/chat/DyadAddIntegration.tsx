import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useAtomValue } from "jotai";
import { showError } from "@/lib/toast";
import { useLoadApp } from "@/hooks/useLoadApp";

interface DyadAddIntegrationProps {
  node: {
    properties: {
      provider: string;
    };
  };
  children: React.ReactNode;
}

export const DyadAddIntegration: React.FC<DyadAddIntegrationProps> = ({
  node,
  children,
}) => {
  const navigate = useNavigate();

  const { provider } = node.properties;
  const appId = useAtomValue(selectedAppIdAtom);
  const { app } = useLoadApp(appId);

  const handleSetupClick = () => {
    if (!appId) {
      showError("No app ID found");
      return;
    }
    navigate({ to: "/app-details", search: { appId } });
  };

  if (app?.supabaseProjectName) {
    return (
      <div className="my-2 rounded-2xl glass-surface border shadow-sm p-4 select-none">
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          </svg>
          <span className="text-sm font-medium glass-contrast-text">Supabase integration complete</span>
        </div>
        <div className="text-xs glass-contrast-text/80">
          <p>
            This app is connected to Supabase project:
            <span className="ml-1 px-1.5 py-0.5 rounded-md border font-mono text-[11px]">
              {app.supabaseProjectName}
            </span>
          </p>
          <p className="mt-1">Click the chat suggestion "Keep going" to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-2xl glass-surface border shadow-sm p-4">
      <div className="text-sm glass-contrast-text">
        <div className="font-medium">Integrate with {provider}?</div>
        <div className="text-xs opacity-80">{children}</div>
      </div>
      <Button
        onClick={handleSetupClick}
        className="mt-2 self-start w-full glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 hover:text-white dark:hover:text-white cursor-pointer"
      >
        Set up {provider}
      </Button>
    </div>
  );
};
