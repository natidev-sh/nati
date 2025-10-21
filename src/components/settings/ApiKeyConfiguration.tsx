import { Info, KeyRound, Trash2, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AzureConfiguration } from "./AzureConfiguration";
import { VertexConfiguration } from "./VertexConfiguration";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/lib/schemas";
import { useState } from "react";

// Helper function to mask ENV API keys (move or duplicate if needed elsewhere)
const maskEnvApiKey = (key: string | undefined): string => {
  if (!key) return "Not Set";
  if (key.length < 8) return "****";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

interface ApiKeyConfigurationProps {
  provider: string;
  providerDisplayName: string;
  settings: UserSettings | null | undefined;
  envVars: Record<string, string | undefined>;
  envVarName?: string;
  isSaving: boolean;
  saveError: string | null;
  apiKeyInput: string;
  onApiKeyInputChange: (value: string) => void;
  onSaveKey: () => Promise<void>;
  onDeleteKey: () => Promise<void>;
  isDyad: boolean;
}

export function ApiKeyConfiguration({
  provider,
  providerDisplayName,
  settings,
  envVars,
  envVarName,
  isSaving,
  saveError,
  apiKeyInput,
  onApiKeyInputChange,
  onSaveKey,
  onDeleteKey,
  isDyad,
}: ApiKeyConfigurationProps) {
  const [showKey, setShowKey] = useState(false);
  const [showEnvKey, setShowEnvKey] = useState(false);
  
  // Special handling for Azure OpenAI which requires environment variables
  if (provider === "azure") {
    return <AzureConfiguration envVars={envVars} />;
  }
  // Special handling for Google Vertex AI which uses service account credentials
  if (provider === "vertex") {
    return <VertexConfiguration />;
  }

  const envApiKey = envVarName ? envVars[envVarName] : undefined;
  const userApiKey = settings?.providerSettings?.[provider]?.apiKey?.value;

  const isValidUserKey =
    !!userApiKey &&
    !userApiKey.startsWith("Invalid Key") &&
    userApiKey !== "Not Set";
  const hasEnvKey = !!envApiKey;

  const activeKeySource = isValidUserKey
    ? "settings"
    : hasEnvKey
      ? "env"
      : "none";

  const maskApiKey = (key: string) => {
    if (key.length < 12) return "••••••••";
    return `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Current API Key Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">API Key Configuration</CardTitle>
                <CardDescription>
                  {isValidUserKey ? "Manage your API key" : `Configure your ${providerDisplayName} API key`}
                </CardDescription>
              </div>
            </div>
            {isValidUserKey && activeKeySource === "settings" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                <Check className="h-3.5 w-3.5" />
                Active
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isValidUserKey && (
            <div className="p-4 rounded-lg border bg-accent/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-semibold text-sm">Configured Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    className="h-8 px-2"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeleteKey}
                    disabled={isSaving}
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm bg-background px-3 py-2 rounded-md border">
                {showKey ? userApiKey : maskApiKey(userApiKey)}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label
                htmlFor="apiKeyInput"
                className="block text-sm font-medium mb-2"
              >
                {isValidUserKey ? "Update" : "Enter"} API Key
              </label>
              <div className="flex gap-2">
                <Input
                  id="apiKeyInput"
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => onApiKeyInputChange(e.target.value)}
                  placeholder={`sk-...`}
                  className={`font-mono ${saveError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <Button 
                  onClick={onSaveKey} 
                  disabled={isSaving || !apiKeyInput}
                  className="min-w-24"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
            {saveError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {!isDyad && hasEnvKey && (
              <p className="text-xs text-muted-foreground">
                Setting a key here will override the environment variable.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Variable Card */}
      {!isDyad && envVarName && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Environment Variable</CardTitle>
                <CardDescription>
                  API key from system environment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasEnvKey ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border bg-accent/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center ${
                        activeKeySource === "env" 
                          ? "bg-green-500/10" 
                          : "bg-amber-500/10"
                      }`}>
                        {activeKeySource === "env" ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{envVarName}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEnvKey(!showEnvKey)}
                      className="h-8 px-2"
                    >
                      {showEnvKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-background px-3 py-2 rounded-md border">
                    {showEnvKey ? envApiKey : maskEnvApiKey(envApiKey)}
                  </div>
                  {activeKeySource === "env" && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ This environment key is currently active
                    </p>
                  )}
                  {activeKeySource === "settings" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠ Overridden by configured API key above
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Environment variables require app restart to detect changes.
                </p>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Not Set</AlertTitle>
                <AlertDescription>
                  The <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{envVarName}</code> environment variable is not configured.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
