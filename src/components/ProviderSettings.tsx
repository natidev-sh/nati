import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { providerSettingsRoute } from "@/routes/settings/providers/$provider";
import type { LanguageModelProvider } from "@/ipc/ipc_types";

import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useCustomLanguageModelProvider } from "@/hooks/useCustomLanguageModelProvider";
import { GiftIcon, PlusIcon, MoreVertical, Trash2, Edit, Circle, Sparkles, Crown, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { IpcClient } from "@/ipc/ipc_client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CreateCustomProviderDialog } from "./CreateCustomProviderDialog";

// Provider logos
import openaiLogo from "../../assets/ai-logos/openai-logo.svg";
import anthropicLogo from "../../assets/ai-logos/anthropic-logo.svg";
import googleGeminiLogo from "../../assets/ai-logos/google-gemini-logo.svg";
import googleLogo from "../../assets/ai-logos/google-logo.svg";
import openrouterLogo from "../../assets/ai-logos/openrouter-logo.svg";
import ollamaLogo from "../../assets/ai-logos/ollama-logo.svg";
import azureLogo from "../../assets/ai-logos/azureai-color.svg";
import vertexLogo from "../../assets/ai-logos/vertexai-logo.svg";
import xaiLogo from "../../assets/ai-logos/XAI-logo.svg";

export function ProviderSettingsGrid() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<LanguageModelProvider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  
  const isPro = settings?.natiUser?.isPro || false;

  const {
    data: providers,
    isLoading,
    error,
    isProviderSetup,
    refetch,
  } = useLanguageModelProviders();

  const { deleteProvider, isDeleting } = useCustomLanguageModelProvider();

  const handleProviderClick = (providerId: string) => {
    // Check if clicking on Nati (auto) provider and user is not Pro
    // Only show upgrade dialog if settings are loaded and user is confirmed not Pro
    if (providerId === "auto" && settings && !isPro) {
      setShowProUpgrade(true);
      return;
    }
    
    // Navigate to provider settings page
    navigate({
      to: providerSettingsRoute.id,
      params: { provider: providerId },
    });
  };
  
  const handleUpgradeToPro = () => {
    IpcClient.getInstance().openExternalUrl("https://natiweb.vercel.app/pro");
    setShowProUpgrade(false);
  };

  const handleDeleteProvider = async () => {
    if (providerToDelete) {
      await deleteProvider(providerToDelete);
      setProviderToDelete(null);
      refetch();
    }
  };

  const handleEditProvider = (provider: LanguageModelProvider) => {
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">AI Providers</h2>
          <p className="text-sm text-muted-foreground">Connect and configure your AI model providers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative group rounded-xl border bg-card p-6 transition-all">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">AI Providers</h2>
          <p className="text-sm text-muted-foreground">Connect and configure your AI model providers</p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load AI providers: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">AI Providers</h2>
        <p className="text-sm text-muted-foreground">Connect and configure your AI model providers</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers
          ?.filter((p) => p.type !== "local")
          .sort((a, b) => {
            // Nati (auto) always first
            if (a.id === "auto") return -1;
            if (b.id === "auto") return 1;
            // Free tier providers next
            if (a.hasFreeTier && !b.hasFreeTier) return -1;
            if (!a.hasFreeTier && b.hasFreeTier) return 1;
            // Alphabetical for the rest
            return a.name.localeCompare(b.name);
          })
          .map((provider: LanguageModelProvider) => {
            const isNati = provider.id === "auto";
            const isCustom = provider.type === "custom";
            const id = (provider.id || "").toLowerCase();
            const logo = id.includes("openrouter")
              ? openrouterLogo
              : id.includes("openai") || id.includes("gpt")
              ? openaiLogo
              : id.includes("anthropic") || id.includes("claude")
              ? anthropicLogo
              : id.includes("vertex")
              ? vertexLogo
              : id.includes("azure")
              ? azureLogo
              : id.includes("ollama")
              ? ollamaLogo
              : id.includes("xai") || id.includes("grok")
              ? xaiLogo
              : id.includes("gemini") || id.includes("google")
              ? googleGeminiLogo || googleLogo
              : openrouterLogo;

            return (
              <div
                key={provider.id}
                className={`relative group rounded-xl border transition-all cursor-pointer ${
                  isNati
                    ? "bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/50 hover:border-primary shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 ring-2 ring-primary/20"
                    : "bg-card hover:bg-accent/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                }`}
                onClick={() => handleProviderClick(provider.id)}
              >
                <div className="p-6">
                  {isNati && (
                    <div className="absolute top-3 right-3">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg">
                        <Crown className="h-3 w-3" />
                        PRO
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className={`rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                        isNati ? "h-14 w-14 bg-gradient-to-br from-primary to-purple-600" : "h-12 w-12 bg-primary/10 group-hover:bg-primary/20"
                      }`}>
                        <img src={logo} alt="Provider" className={isNati ? "h-9 w-9" : "h-7 w-7"} />
                      </div>
                      {isProviderSetup(provider.id) && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-1 truncate ${
                        isNati ? "text-lg" : "text-base"
                      }`}>
                        {provider.name}
                        {isNati && (
                          <Sparkles className="inline-block h-4 w-4 ml-1.5 text-amber-500" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isProviderSetup(provider.id) ? (
                          <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                            <Circle className="h-2 w-2 fill-current mr-1.5" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-muted-foreground">
                            <Circle className="h-2 w-2 fill-current mr-1.5" />
                            Not configured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isNati ? (
                    <p className="text-xs text-muted-foreground">
                      Premium AI models with advanced features
                    </p>
                  ) : provider.hasFreeTier ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">
                      <GiftIcon className="h-3.5 w-3.5" />
                      Free tier
                    </div>
                  ) : null}
                </div>

                {isCustom && !isNati && (
                  <div
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-accent"
                          data-testid="custom-provider-more-options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-48 p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start rounded-md"
                          onClick={() => handleEditProvider(provider)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md"
                          onClick={() => setProviderToDelete(provider.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            );
          })}

        {/* Add custom provider button */}
        <div
          className="group rounded-xl border-2 border-dashed hover:border-primary/50 bg-card hover:bg-accent/5 transition-all cursor-pointer min-h-[144px] flex items-center justify-center"
          onClick={() => setIsDialogOpen(true)}
        >
          <div className="text-center p-6">
            <div className="h-12 w-12 mx-auto rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
              <PlusIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-base mb-1">Add Custom Provider</h3>
            <p className="text-xs text-muted-foreground">Connect to any LLM API endpoint</p>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Dialog */}
      <Dialog open={showProUpgrade} onOpenChange={setShowProUpgrade}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Upgrade to Nati Pro</DialogTitle>
            <DialogDescription className="text-center">
              Get access to premium AI models and advanced features with Nati Pro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Premium AI Models</p>
                  <p className="text-xs text-muted-foreground">Access GPT-4, Claude, and more</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Priority Support</p>
                  <p className="text-xs text-muted-foreground">Get help when you need it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Advanced Features</p>
                  <p className="text-xs text-muted-foreground">Unlock all Nati capabilities</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={handleUpgradeToPro} className="w-full" size="lg">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => setShowProUpgrade(false)} variant="ghost" className="w-full">
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateCustomProviderDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingProvider(null);
        }}
        onSuccess={() => {
          setIsDialogOpen(false);
          refetch();
          setEditingProvider(null);
        }}
        editingProvider={editingProvider}
      />

      <AlertDialog
        open={!!providerToDelete}
        onOpenChange={(open) => !open && setProviderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Provider</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this custom provider and all its
              associated models. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProvider}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Provider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
