import {
  ArrowLeft,
  Circle,
  ExternalLink,
  GiftIcon,
  KeyRound,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IpcClient } from "@/ipc/ipc_client";

interface ProviderSettingsHeaderProps {
  providerDisplayName: string;
  isConfigured: boolean;
  isLoading: boolean;
  hasFreeTier?: boolean;
  providerWebsiteUrl?: string;
  isDyad: boolean;
  onBackClick: () => void;
  providerLogo?: string;
}

function getKeyButtonText({
  isConfigured,
  isDyad,
}: {
  isConfigured: boolean;
  isDyad: boolean;
}) {
  if (isDyad) {
    return isConfigured
      ? "Manage Nati Pro Subscription"
      : "Setup Nati Pro Subscription";
  }
  return isConfigured ? "Manage API Keys" : "Setup API Key";
}

export function ProviderSettingsHeader({
  providerDisplayName,
  isConfigured,
  isLoading,
  hasFreeTier,
  providerWebsiteUrl,
  isDyad,
  onBackClick,
  providerLogo,
}: ProviderSettingsHeaderProps) {
  const handleGetApiKeyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (providerWebsiteUrl) {
      IpcClient.getInstance().openExternalUrl(providerWebsiteUrl);
    }
  };

  return (
    <div className="mb-8">
      <Button
        onClick={onBackClick}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Providers
      </Button>

      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 flex-1">
          {providerLogo && (
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border">
              <img src={providerLogo} alt="Provider" className="h-10 w-10 object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">
              {providerDisplayName}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {isLoading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    isConfigured
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Circle className="h-2 w-2 fill-current" />
                    {isConfigured ? "Connected" : "Not configured"}
                  </div>
                  {hasFreeTier && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      <GiftIcon className="h-3.5 w-3.5" />
                      Free tier
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {providerWebsiteUrl && !isLoading && (
          <Button
            onClick={handleGetApiKeyClick}
            size="lg"
            className="shadow-sm"
          >
            {isConfigured ? (
              <SettingsIcon className="mr-2 h-4 w-4" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            {getKeyButtonText({ isConfigured, isDyad })}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
