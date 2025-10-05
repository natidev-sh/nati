import { useMemo, useState } from "react";
import { AlertTriangle, PlusIcon, TrashIcon, Search, Edit3, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateCustomModelDialog } from "@/components/CreateCustomModelDialog";
import { EditCustomModelDialog } from "@/components/EditCustomModelDialog";
import { useLanguageModelsForProvider } from "@/hooks/useLanguageModelsForProvider"; // Use the hook directly here
import { useDeleteCustomModel } from "@/hooks/useDeleteCustomModel"; // Import the new hook
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

interface ModelsSectionProps {
  providerId: string;
}

export function ModelsSection({ providerId }: ModelsSectionProps) {
  const [isCustomModelDialogOpen, setIsCustomModelDialogOpen] = useState(false);
  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [modelToEdit, setModelToEdit] = useState<any | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Fetch custom models within this component now
  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useLanguageModelsForProvider(providerId);

  const { mutate: deleteModel, isPending: isDeleting } = useDeleteCustomModel({
    onSuccess: () => {
      refetchModels(); // Refetch models list after successful deletion
      // Optionally show a success toast here
    },
    onError: (error: Error) => {
      // Optionally show an error toast here
      console.error("Failed to delete model:", error);
    },
  });

  const handleDeleteClick = (modelApiName: string) => {
    setModelToDelete(modelApiName);
    setIsConfirmDeleteDialogOpen(true);
  };

  // Provider logo (heuristic by providerId)
  const providerLogo = useMemo(() => {
    const id = (providerId || "").toLowerCase();
    if (id.includes("openrouter")) return openrouterLogo;
    if (id.includes("openai") || id.includes("gpt")) return openaiLogo;
    if (id.includes("anthropic") || id.includes("claude")) return anthropicLogo;
    if (id.includes("vertex")) return vertexLogo;
    if (id.includes("azure")) return azureLogo;
    if (id.includes("ollama")) return ollamaLogo;
    if (id.includes("xai") || id.includes("grok")) return xaiLogo;
    if (id.includes("gemini") || id.includes("google")) return googleGeminiLogo || googleLogo;
    return openrouterLogo;
  }, [providerId]);

  // Brand color classes per provider
  const brand = useMemo(() => {
    const id = (providerId || "").toLowerCase();
    if (id.includes("openrouter")) return { ring: "ring-rose-400/40 dark:ring-rose-300/20", chip: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" };
    if (id.includes("openai") || id.includes("gpt")) return { ring: "ring-emerald-400/40 dark:ring-emerald-300/20", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" };
    if (id.includes("anthropic") || id.includes("claude")) return { ring: "ring-amber-400/40 dark:ring-amber-300/20", chip: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" };
    if (id.includes("gemini") || id.includes("google")) return { ring: "ring-sky-400/40 dark:ring-sky-300/20", chip: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" };
    if (id.includes("azure")) return { ring: "ring-blue-400/40 dark:ring-blue-300/20", chip: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    if (id.includes("vertex")) return { ring: "ring-indigo-400/40 dark:ring-indigo-300/20", chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" };
    if (id.includes("ollama")) return { ring: "ring-lime-400/40 dark:ring-lime-300/20", chip: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200" };
    if (id.includes("xai") || id.includes("grok")) return { ring: "ring-fuchsia-400/40 dark:ring-fuchsia-300/20", chip: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200" };
    return { ring: "ring-white/30 dark:ring-white/10", chip: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" };
  }, [providerId]);

  const formatUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(n);

  // Filtered models by query (displayName/apiName)
  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models ?? [];
    return (models ?? []).filter((m) =>
      (m.displayName || "").toLowerCase().includes(q) ||
      (m.apiName || "").toLowerCase().includes(q)
    );
  }, [models, query]);

  const handleEditClick = (model: any) => {
    setModelToEdit(model);
    setIsEditModelDialogOpen(true);
  };

  const handleModelClick = (modelApiName: string) => {
    setSelectedModel(selectedModel === modelApiName ? null : modelApiName);
  };

  const handleModelDoubleClick = (model: any) => {
    if (model.type === "custom") {
      handleEditClick(model);
    }
  };

  const handleConfirmDelete = () => {
    if (modelToDelete) {
      deleteModel({ providerId, modelApiName: modelToDelete });
      setModelToDelete(null);
    }
    setIsConfirmDeleteDialogOpen(false);
  };

  return (
    <div className="mt-8 rounded-2xl glass-surface glass-hover p-6">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row justify-between">
        <div>
          <h2 className="text-xl font-semibold glass-contrast-text flex items-center gap-2">
            <img src={providerLogo} alt="Provider" className="h-5 w-5" />
            Models
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage specific models available through this provider. Add custom entries or edit existing ones.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-surface border shadow-sm outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-sm"
            />
          </div>
          {providerId !== "auto" && (
            <Button
              onClick={() => setIsCustomModelDialogOpen(true)}
              variant="ghost"
              className="glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add
            </Button>
          )}
        </div>
      </div>

      {/* Custom Models List Area */}
      {modelsLoading && (
        <div className="space-y-3 mt-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      )}
      {modelsError && (
        <Alert variant="destructive" className="mt-4 rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Models</AlertTitle>
          <AlertDescription>{modelsError.message}</AlertDescription>
        </Alert>
      )}
      {!modelsLoading && !modelsError && filteredModels && filteredModels.length > 0 && (
        <div className="mt-4 space-y-3">
          {filteredModels.map((model) => {
            const anyModel = model as any;
            const inputPer1k: number | undefined =
              typeof anyModel?.pricing?.input === "number"
                ? anyModel.pricing.input
                : undefined;
            const outputPer1k: number | undefined =
              typeof anyModel?.pricing?.output === "number"
                ? anyModel.pricing.output
                : undefined;
            const costPer1k: number | undefined =
              typeof anyModel?.costPer1kTokens === "number"
                ? anyModel.costPer1kTokens
                : undefined;

            return (
            <div
              key={model.apiName + model.displayName}
              className={`p-4 rounded-2xl glass-surface shadow-sm cursor-pointer transition-all glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 ${
                selectedModel === model.apiName ? `ring-1 ${brand.ring}` : ""
              }`}
              onClick={() => handleModelClick(model.apiName)}
              onDoubleClick={() => handleModelDoubleClick(model)}
            >
              <div className="flex justify-between items-center">
                <h4 className="text-base font-semibold glass-contrast-text">
                  {model.displayName}
                </h4>
                {model.type === "custom" && (
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(model);
                          }}
                          className="h-8 w-8 glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
                          aria-label="Edit model"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit model</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(model.apiName);
                          }}
                          disabled={isDeleting}
                          className="h-8 w-8 glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-red-500"
                          aria-label="Delete model"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete model</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {model.apiName}
              </p>
              {model.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {model.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {model.contextWindow && (
                  <span>
                    Context: {model.contextWindow.toLocaleString()} tokens
                  </span>
                )}
                {model.maxOutputTokens && (
                  <span>
                    Max Output: {model.maxOutputTokens.toLocaleString()} tokens
                  </span>
                )}
                {/* Optional pricing display if present on model */}
                {typeof inputPer1k === "number" && (
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> In: {formatUSD(inputPer1k)}/1k • {formatUSD(inputPer1k * 1000)}/1M</span>
                )}
                {typeof outputPer1k === "number" && (
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Out: {formatUSD(outputPer1k)}/1k • {formatUSD(outputPer1k * 1000)}/1M</span>
                )}
                {typeof costPer1k === "number" && typeof inputPer1k !== "number" && typeof outputPer1k !== "number" && (
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {formatUSD(costPer1k)}/1k • {formatUSD(costPer1k * 1000)}/1M</span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span className={`mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${brand.chip}`}>
                  {model.type === "cloud" ? "Built-in" : "Custom"}
                </span>

                {model.tag && (
                  <span className={`mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${brand.chip}`}>
                    {model.tag}
                  </span>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
      {!modelsLoading && !modelsError && (!models || models.length === 0) && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          No custom models have been added for this provider yet.
        </p>
      )}
      {/* End Custom Models List Area */}

      {providerId !== "auto" && (
        <Button
          onClick={() => setIsCustomModelDialogOpen(true)}
          variant="ghost"
          className="mt-6 glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Add Custom Model
        </Button>
      )}

      {/* Render the dialogs */}
      <CreateCustomModelDialog
        isOpen={isCustomModelDialogOpen}
        onClose={() => setIsCustomModelDialogOpen(false)}
        onSuccess={() => {
          setIsCustomModelDialogOpen(false);
          refetchModels(); // Refetch models on success
        }}
        providerId={providerId}
      />

      <EditCustomModelDialog
        isOpen={isEditModelDialogOpen}
        onClose={() => setIsEditModelDialogOpen(false)}
        onSuccess={() => {
          setIsEditModelDialogOpen(false);
          refetchModels(); // Refetch models on success
        }}
        providerId={providerId}
        model={modelToEdit}
      />

      <AlertDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this model?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              custom model "
              {modelToDelete
                ? models?.find((m) => m.apiName === modelToDelete)
                    ?.displayName || modelToDelete
                : ""}
              " (API Name: {modelToDelete}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModelToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
