import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Sparkles } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useSettings } from "@/hooks/useSettings";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateCard } from "@/components/TemplateCard";
import { CreateAppDialog } from "@/components/CreateAppDialog";
import { NeonConnector } from "@/components/NeonConnector";

const HubPage: React.FC = () => {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { templates, isLoading } = useTemplates();
  const { settings, updateSettings } = useSettings();
  const selectedTemplateId = settings?.selectedTemplateId;
  const [query, setQuery] = useState("");

  const handleTemplateSelect = (templateId: string) => {
    updateSettings({ selectedTemplateId: templateId });
  };

  const handleCreateApp = () => {
    setIsCreateDialogOpen(true);
  };
  // Separate templates into official and community (with search)
  const { officialTemplates, communityTemplates } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (templates || []).filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
    return {
      officialTemplates: list.filter((t) => t.isOfficial),
      communityTemplates: list.filter((t) => !t.isOfficial),
    };
  }, [templates, query]);

  return (
    <div className="min-h-screen from-zinc-100 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 border-b">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.history.back()} variant="outline" size="sm" className="glass-button glass-hover glass-active">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold">Templates Hub</h1>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Pick your default template and spin up a new app.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-64 rounded-lg border bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button onClick={handleCreateApp} size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" /> Create App
            </Button>
          </div>
        </div>
      </div>

      {/* Body: two-column layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Template lists */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
            <header className="mb-4">
              <h2 className="text-2xl font-semibold">Official templates</h2>
              <p className="text-sm text-muted-foreground">Curated, first-party starters. {isLoading && " Loading..."}</p>
            </header>
            {officialTemplates.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {officialTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={template.id === selectedTemplateId}
                    onSelect={handleTemplateSelect}
                    onCreateApp={handleCreateApp}
                  />
                ))}
              </div>
            ) : (
              <EmptyState label={query ? "No official templates match your search" : "No official templates"} />
            )}
          </section>

          <section className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
            <header className="mb-4">
              <h2 className="text-2xl font-semibold">Community templates</h2>
              <p className="text-sm text-muted-foreground">Open-source contributions from the community.</p>
            </header>
            {communityTemplates.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {communityTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={template.id === selectedTemplateId}
                    onSelect={handleTemplateSelect}
                    onCreateApp={handleCreateApp}
                  />
                ))}
              </div>
            ) : (
              <EmptyState label={query ? "No community templates match your search" : "No community templates"} />
            )}
          </section>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Search</h3>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <BackendSection />

          <div className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-5">
              <li>Select a template to set it as default.</li>
              <li>Click Create App to scaffold in one step.</li>
              <li>Use the search to filter templates quickly.</li>
            </ul>
          </div>
        </div>
      </div>

      <CreateAppDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        template={templates.find((t) => t.id === settings?.selectedTemplateId)}
      />
    </div>
  );
};

function BackendSection() {
  return (
    <div className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
      <header className="mb-4 text-left">
        <h2 className="text-xl md:text-2xl font-bold glass-contrast-text mb-1">Backend Services</h2>
        <p className="text-sm text-muted-foreground">Connect to backend services for your projects.</p>
      </header>
      <div className="grid grid-cols-1 gap-6">
        <NeonConnector />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">
      {label}
    </div>
  );
}

export default HubPage;
