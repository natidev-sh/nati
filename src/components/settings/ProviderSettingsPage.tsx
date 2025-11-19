import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { showError } from "@/lib/toast";
import { UserSettings } from "@/lib/schemas";

import { ProviderSettingsHeader } from "./ProviderSettingsHeader";
import { ApiKeyConfiguration } from "./ApiKeyConfiguration";
import { ModelsSection } from "./ModelsSection";

// Provider logos
import openaiLogo from "../../../assets/ai-logos/openai-logo.svg";
import anthropicLogo from "../../../assets/ai-logos/anthropic-logo.svg";
import googleGeminiLogo from "../../../assets/ai-logos/google-gemini-logo.svg";
import googleLogo from "../../../assets/ai-logos/google-logo.svg";
import openrouterLogo from "../../../assets/ai-logos/openrouter-logo.svg";
import ollamaLogo from "../../../assets/ai-logos/ollama-logo.svg";
import azureLogo from "../../../assets/ai-logos/azureai-color.svg";
import vertexLogo from "../../../assets/ai-logos/vertexai-logo.svg";
import xaiLogo from "../../../assets/ai-logos/XAI-logo.svg";
import natiLogo from "../../../assets/ai-logos/nati-logo.svg";

interface ProviderSettingsPageProps {
  provider: string;
}

export function ProviderSettingsPage({ provider }: ProviderSettingsPageProps) {
  const {
    settings,
    envVars,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useSettings();

  // Fetch all providers
  const {
    data: allProviders,
    isLoading: providersLoading,
    error: providersError,
  } = useLanguageModelProviders();

  // Find the specific provider data from the fetched list
  const providerData = allProviders?.find((p) => p.id === provider);
  const supportsCustomModels =
    providerData?.type === "custom" || providerData?.type === "cloud";

  const isDyad = provider === "auto";

  // Compute provider logo for header
  const providerLogo = useMemo(() => {
    if (isDyad) return natiLogo;
    const id = (provider || "").toLowerCase();
    if (id.includes("openrouter")) return openrouterLogo;
    if (id.includes("openai") || id.includes("gpt")) return openaiLogo;
    if (id.includes("anthropic") || id.includes("claude")) return anthropicLogo;
    if (id.includes("vertex")) return vertexLogo;
    if (id.includes("azure")) return azureLogo;
    if (id.includes("ollama")) return ollamaLogo;
    if (id.includes("xai") || id.includes("grok")) return xaiLogo;
    if (id.includes("gemini") || id.includes("google")) return googleGeminiLogo || googleLogo;
    return openrouterLogo;
  }, [provider, isDyad]);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  // Use fetched data (or defaults for Dyad)
  const providerDisplayName = isDyad
    ? "Nati"
    : (providerData?.name ?? "Unknown Provider");
  const providerWebsiteUrl = isDyad
    ? "https://natiweb.vercel.app/dashboard"
    : providerData?.websiteUrl;
  const hasFreeTier = isDyad ? false : providerData?.hasFreeTier;
  const envVarName = isDyad ? undefined : providerData?.envVarName;

  // Use provider ID (which is the 'provider' prop)
  const userApiKey = settings?.providerSettings?.[provider]?.apiKey?.value;

  // --- Configuration Logic --- Updated Priority ---
  const isValidUserKey =
    !!userApiKey &&
    !userApiKey.startsWith("Invalid Key") &&
    userApiKey !== "Not Set";
  const hasEnvKey = !!(envVarName && envVars[envVarName]);

  // Special handling for Azure OpenAI configuration
  const isAzureConfigured =
    provider === "azure"
      ? !!(envVars["AZURE_API_KEY"] && envVars["AZURE_RESOURCE_NAME"])
      : false;

  // Special handling for Vertex configuration status
  const vertexSettings = settings?.providerSettings?.vertex as any;
  const isVertexConfigured = Boolean(
    vertexSettings?.projectId &&
      vertexSettings?.location &&
      vertexSettings?.serviceAccountKey?.value,
  );

  const isConfigured =
    provider === "azure"
      ? isAzureConfigured
      : provider === "vertex"
        ? isVertexConfigured
        : isValidUserKey || hasEnvKey; // Configured if either is set

  // --- Save Handler ---
  const handleSaveKey = async () => {
    if (!apiKeyInput) {
      setSaveError("API Key cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const settingsUpdate: Partial<UserSettings> = {
        providerSettings: {
          ...settings?.providerSettings,
          [provider]: {
            ...settings?.providerSettings?.[provider],
            apiKey: {
              value: apiKeyInput,
            },
          },
        },
      };
      if (isDyad) {
        settingsUpdate.enableDyadPro = true;
      }
      await updateSettings(settingsUpdate);
      setApiKeyInput(""); // Clear input on success
      // Optionally show a success message
    } catch (error: any) {
      console.error("Error saving API key:", error);
      setSaveError(error.message || "Failed to save API key.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Handler ---
  const handleDeleteKey = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateSettings({
        providerSettings: {
          ...settings?.providerSettings,
          [provider]: {
            ...settings?.providerSettings?.[provider],
            apiKey: undefined,
          },
        },
      });
      // Optionally show a success message
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      setSaveError(error.message || "Failed to delete API key.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Toggle Nati Pro Handler ---
  const handleToggleDyadPro = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await updateSettings({
        enableDyadPro: enabled,
      });
    } catch (error: any) {
      showError(`Error toggling Nati Pro: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Effect to clear input error when input changes
  useEffect(() => {
    if (saveError) {
      setSaveError(null);
    }
  }, [apiKeyInput]);

  // --- Loading State for Providers ---
  if (providersLoading) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex items-start gap-4 mb-8">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error State for Providers ---
  if (providersError) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.history.back()}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Providers
          </Button>
          <h1 className="text-3xl font-bold mb-6">
            Configure Provider
          </h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Provider Details</AlertTitle>
            <AlertDescription>
              Could not load provider data: {providersError.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Handle case where provider is not found (e.g., invalid ID in URL)
  if (!providerData && !isDyad) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.history.back()}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Providers
          </Button>
          <h1 className="text-3xl font-bold mb-6">
            Provider Not Found
          </h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The provider with ID "{provider}" could not be found.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <ProviderSettingsHeader
          providerDisplayName={providerDisplayName}
          isConfigured={isConfigured}
          isLoading={settingsLoading}
          hasFreeTier={hasFreeTier}
          providerWebsiteUrl={providerWebsiteUrl}
          isDyad={isDyad}
          onBackClick={() => router.history.back()}
          providerLogo={providerLogo}
          badgeLabel={!isDyad && providerData?.id === "google" ? "NEW" : undefined}
        />

        {settingsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : settingsError ? (
          <Alert variant="destructive">
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription>
              Could not load configuration data: {settingsError.message}
            </AlertDescription>
          </Alert>
        ) : (
          <ApiKeyConfiguration
            provider={provider}
            providerDisplayName={providerDisplayName}
            settings={settings}
            envVars={envVars}
            envVarName={envVarName}
            isSaving={isSaving}
            saveError={saveError}
            apiKeyInput={apiKeyInput}
            onApiKeyInputChange={setApiKeyInput}
            onSaveKey={handleSaveKey}
            onDeleteKey={handleDeleteKey}
            isDyad={isDyad}
          />
        )}

        {isDyad && !settingsLoading && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Enable Nati Pro</CardTitle>
                    <CardDescription>
                      Access premium features and models
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings?.enableDyadPro}
                  onCheckedChange={handleToggleDyadPro}
                  disabled={isSaving}
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Conditionally render CustomModelsSection */}
        {supportsCustomModels && providerData && (
          <ModelsSection providerId={providerData.id} />
        )}
        <div className="h-24"></div>
      </div>
    </div>
  );
}
