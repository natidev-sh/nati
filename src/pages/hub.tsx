import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Sparkles, Search, DollarSign, ShoppingCart, TrendingUp, GraduationCap, BriefcaseBusiness, PenTool, Lock, Heart, Plug } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useSettings } from "@/hooks/useSettings";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateCard } from "@/components/TemplateCard";
import { CreateAppDialog } from "@/components/CreateAppDialog";
import { NeonConnector } from "@/components/NeonConnector";
import { HubPromptDetails, HubPrompt } from "@/components/HubPromptDetails";
import { HubPluginDetails, HubPlugin } from "@/components/HubPluginDetails";
import { usePrompts } from "@/hooks/usePrompts";
import { usePromptFavorites } from "@/hooks/usePromptFavorites";
// Build-time safe asset URLs (assets live outside src)
const ss1 = new URL("../../assets/resend-brand-assets/resend-screenshot-1.png", import.meta.url).toString();
const ss2 = new URL("../../assets/resend-brand-assets/resend-screenshot-2.png", import.meta.url).toString();
const ss3 = new URL("../../assets/resend-brand-assets/resend-screenshot-3.png", import.meta.url).toString();
const resendIconBlack = new URL("../../assets/resend-brand-assets/resend-icon-black.svg", import.meta.url).toString();
const resendIconWhite = new URL("../../assets/resend-brand-assets/resend-icon-white.svg", import.meta.url).toString();
// Stripe screenshots (assets)
const stripeSS1 = new URL("../../assets/stripe-brand-assets/ss1.png", import.meta.url).toString();
const stripeSS2 = new URL("../../assets/stripe-brand-assets/ss2.png", import.meta.url).toString();
const stripeSS3 = new URL("../../assets/stripe-brand-assets/ss3.png", import.meta.url).toString();
const stripeIconJpeg = new URL("../../assets/stripe-brand-assets/Stripe_Icon_9.jpeg", import.meta.url).toString();

const HubPage: React.FC = () => {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "prompts" | "plugins">("templates");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const { templates, isLoading } = useTemplates();
  const { settings, updateSettings } = useSettings();
  const { createPrompt } = usePrompts();
  const fav = usePromptFavorites();
  const selectedTemplateId = settings?.selectedTemplateId;
  const [query, setQuery] = useState("");
  const [promptQuery, setPromptQuery] = useState("");
  const [activePromptCategory, setActivePromptCategory] = useState<string>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<HubPrompt | null>(null);
  const [pluginOpen, setPluginOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<HubPlugin | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    updateSettings({ selectedTemplateId: templateId });
  };

  const handleCreateApp = () => {
    setIsCreateDialogOpen(true);
  };

  // Prompt categories and sample data (can be replaced by API later)
  const promptCategories = useMemo(
    () => [
      { id: "all", name: "All", icon: Sparkles },
      { id: "finance", name: "Finance", icon: DollarSign },
      { id: "ecommerce", name: "E‑Commerce", icon: ShoppingCart },
      { id: "sales", name: "Sales", icon: TrendingUp },
      { id: "education", name: "Education", icon: GraduationCap },
      { id: "business", name: "Business", icon: BriefcaseBusiness },
      { id: "writing", name: "Writing", icon: PenTool },
      { id: "marketing", name: "Marketing", icon: TrendingUp },
      { id: "productivity", name: "Productivity", icon: Sparkles },
    ],
    [],
  );

  type Prompt = { id: string; title: string; description: string; category: string; isNew?: boolean };
  const allPrompts: Prompt[] = useMemo(
    () => [
      // Finance
      { id: "fin-ops-audit", category: "finance", isNew: true, title: "Get Comprehensive Operational Audits", description: "Conduct comprehensive operational audits with C‑suite grade strategies for measurable ROI within 90 days." },
      { id: "fin-debt-strategy", category: "finance", isNew: true, title: "Develop Debt Payoff Strategy", description: "Guide users to debt freedom with financial analysis and psychological insights for personalized elimination plans." },
      { id: "fin-wealth-plan", category: "finance", title: "Create Wealth Plan", description: "Build a comprehensive wealth plan covering investing, risk and long‑term allocation." },
      { id: "fin-compare-loans", category: "finance", title: "Compare Loan Offers", description: "Organize and compare loan offers to reveal true costs and hidden fees for informed decisions." },
      { id: "fin-tax-savings", category: "finance", title: "Maximize Tax Savings", description: "Uncover deductions and optimizations to maximize legal tax advantages." },
      // E‑Commerce
      { id: "ec-high-convert-landing", category: "ecommerce", isNew: true, title: "Create High‑Converting Landing Pages", description: "Craft landing pages that transform skepticism into action using proven psychological triggers." },
      { id: "ec-product-layouts", category: "ecommerce", isNew: true, title: "Generate Product Page Layouts", description: "Design conversion‑focused product pages optimized for mobile and psychological engagement." },
      { id: "ec-checkout-flow", category: "ecommerce", title: "Design Checkout Flow", description: "Reduce cognitive load and enhance trust for a frictionless checkout experience." },
      { id: "ec-recover-carts", category: "ecommerce", title: "Recover Cart Abandonments", description: "Leverage behavioral insights to transform abandoned carts into completed purchases." },
      { id: "ec-compare-products", category: "ecommerce", title: "Build Product Comparison Tables", description: "Balance clarity and density for mobile/desktop product comparison tables." },
      // Sales
      { id: "sales-outreach", category: "sales", title: "Personalized Outreach Sequence", description: "Generate a 5‑step cold outreach sequence with personalization hooks and rebuttals." },
      { id: "sales-demo-script", category: "sales", title: "Demo Call Script", description: "Structured discovery + demo flow with objection handling and next steps." },
      // Marketing
      { id: "mkt-landing-copy", category: "marketing", title: "High‑Impact Landing Copy", description: "Write hero, value props, and proof sections tailored to ICP." },
      { id: "mkt-twitter-thread", category: "marketing", title: "Twitter/X Thread Generator", description: "Create a 7‑tweet thread from a blog post with CTAs." },
      // Productivity
      { id: "prod-meeting-notes", category: "productivity", title: "Smart Meeting Notes", description: "Summarize transcript into decisions, owners, and follow‑ups." },
      { id: "prod-prd-outline", category: "productivity", title: "PRD Outline", description: "Generate a product requirements doc skeleton for new features." },
    ],
    [],
  );

  const filteredPrompts = useMemo(() => {
    const q = promptQuery.trim().toLowerCase();
    return allPrompts.filter((p) => {
      const inCategory = activePromptCategory === "all" || p.category === activePromptCategory;
      if (!inCategory) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
  }, [allPrompts, promptQuery, activePromptCategory]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: allPrompts.length };
    for (const p of allPrompts) map[p.category] = (map[p.category] || 0) + 1;
    return map;
  }, [allPrompts]);
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

      {/* Tabs + Scope */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border bg-background p-1">
            {(["templates","prompts","plugins"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 text-sm rounded-md ${activeTab===t?"bg-primary text-primary-foreground":"hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                {t[0].toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg border bg-background p-1">
            {(["all","mine"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 text-sm rounded-md ${scope===s?"bg-primary text-primary-foreground":"hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                {s[0].toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body: two-column layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Main content by tab */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === "templates" && (
            <>
              {scope === "all" ? (
                <>
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
                    <header className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold">Community templates</h2>
                        <p className="text-sm text-muted-foreground">Open-source contributions from the community.</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Coming soon</span>
                    </header>
                    <div className="relative overflow-hidden rounded-2xl border shadow-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-fuchsia-400/10 to-indigo-400/10 pointer-events-none" />
                      <div className="relative p-6 sm:p-8">
                        <h3 className="text-lg font-semibold mb-1">A shared gallery for the community</h3>
                        <p className="text-sm text-muted-foreground">Publish and discover open-source templates made by fellow builders. Star your favorites and scaffold in one click.</p>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <section className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
                  <header className="mb-4">
                    <h2 className="text-2xl font-semibold">My templates</h2>
                    <p className="text-sm text-muted-foreground">Templates you’ve created or imported.</p>
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
                    <EmptyState label={query ? "No templates match your search" : "No templates yet"} />
                  )}
                </section>
              )}
            </>
          )}

          {activeTab === "prompts" && (
            <section className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
              <header className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold">Prompt Library</h2>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={promptQuery}
                      onChange={(e) => setPromptQuery(e.target.value)}
                      placeholder="Search prompts..."
                      className="w-64 rounded-lg border bg-background pl-8 pr-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {promptCategories.map((c) => {
                    const Icon = c.icon;
                    const active = activePromptCategory === c.id;
                    const count = categoryCounts[c.id] ?? 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActivePromptCategory(c.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "glass-surface glass-hover"}`}
                        title={`${c.name} • ${count} prompts`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{c.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-black/5 dark:bg-white/10"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </header>

              {/* Category overview grid removed per request; pills already provide navigation */}

              {/* Favorites (if any and within All / current category) */}
              {fav.count > 0 && (
                <div className="mb-4">
                  <div className="text-sm mb-2 opacity-80">Favorites</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPrompts.filter(p => fav.has(p.id)).map((p) => (
                      <PromptCard key={`fav-${p.id}`} prompt={p} onOpenDetails={(prompt) => { setSelectedPrompt({ ...prompt, content: defaultContentFor(prompt) }); setDetailsOpen(true); }} favorite={true} onToggleFavorite={() => fav.toggle(p.id)} />
                    ))}
                  </div>
                  <div className="mt-4 mb-2 border-t border-black/10 dark:border-white/10" />
                </div>
              )}

              {/* Prompt results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(fav.count > 0 ? filteredPrompts.filter(p => !fav.has(p.id)) : filteredPrompts).length ? (
                  (fav.count > 0 ? filteredPrompts.filter(p => !fav.has(p.id)) : filteredPrompts).map((p) => (
                    <PromptCard key={p.id} prompt={p} onOpenDetails={(prompt) => { setSelectedPrompt({ ...prompt, content: defaultContentFor(prompt) }); setDetailsOpen(true); }} favorite={fav.has(p.id)} onToggleFavorite={() => fav.toggle(p.id)} />
                  ))
                ) : (
                  <EmptyState label={promptQuery ? "No prompts match your search" : "No prompts in this category"} />
                )}
              </div>
            </section>
          )}

          {activeTab === "plugins" && (
            <section className="p-5 md:p-6 rounded-2xl glass-surface border shadow-sm">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Plugins</h2>
                  <p className="text-sm text-muted-foreground">Extend Nati with integrations and automations.</p>
                </div>
                {/* Coming soon badge removed per request */}
              </header>

              <div className="relative overflow-hidden rounded-2xl border shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-fuchsia-400/10 to-indigo-400/15 pointer-events-none" />
                <div className="relative p-6 sm:p-8 flex flex-col gap-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/70 dark:bg-white/10 border flex items-center justify-center shadow-sm">
                      <Plug className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold glass-contrast-text">A curated plugin marketplace</h3>
                      <p className="text-sm text-muted-foreground">Install integrations for data, auth, analytics, payments, vector DBs and more—configured in a few clicks.</p>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />One‑click install with safe permissions</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Per‑plugin settings and environment checks</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Events & actions to automate workflows</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Update and version management</li>
                  </ul>

                  <div className="flex items-center gap-3">
                  </div>
                </div>
              </div>
              {/* Featured plugin(s) */}
              <div className="mt-5">
                <div className="text-sm mb-2 opacity-80">Featured</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    className="text-left p-4 rounded-xl border glass-surface glass-hover"
                    onClick={() => {
                      setSelectedPlugin({
                        id: "resend",
                        name: "Resend",
                        tagline: "Transactional emails made delightful",
                        description:
                          "Send reliable transactional emails with a modern API and dashboard. Configure an API key and default from address, then use helpers to send notifications from your apps.",
                        docsUrl: "https://resend.com/docs/introduction",
                        images: [ss1, ss2, ss3],
                      });
                      setPluginOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-white/70 dark:bg-white/10 border flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resendIconBlack} alt="Resend" className="h-5 w-5 dark:hidden" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resendIconWhite} alt="Resend" className="h-5 w-5 hidden dark:block" />
                      </div>
                      <div>
                        <div className="font-semibold">Resend</div>
                        <div className="text-xs text-muted-foreground">Email API • Preview</div>
                      </div>
                    </div>
                    <div
                      className="mt-3 rounded-lg border overflow-hidden relative"
                      style={{ backgroundImage: `url(${ss1})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '120px' }}
                    >
                      <div className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white">Thumbnail</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Click to view details & screenshots</div>
                  </button>
                  {/* Stripe preview card */}
                  <button
                    className="text-left p-4 rounded-xl border glass-surface glass-hover"
                    onClick={() => {
                      setSelectedPlugin({
                        id: "stripe",
                        name: "Stripe",
                        tagline: "Payments, subscriptions, and more",
                        description:
                          "Accept payments with Checkout or build custom flows using Payment Intents. Configure publishable/secret keys and a webhook secret, then use helpers to start sessions.",
                        docsUrl: "https://docs.stripe.com/get-started",
                        images: [stripeSS1, stripeSS2, stripeSS3],
                      });
                      setPluginOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg border overflow-hidden bg-white/70 dark:bg-white/10 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stripeIconJpeg} alt="Stripe" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold">Stripe</div>
                        <div className="text-xs text-muted-foreground">Checkout • Payments</div>
                      </div>
                    </div>
                    <div
                      className="mt-3 rounded-lg border overflow-hidden relative"
                      style={{ backgroundImage: `url(${stripeSS1})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '120px' }}
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Click to view details & setup</div>
                  </button>
                </div>
              </div>
            </section>
          )}
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
      <HubPromptDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        prompt={selectedPrompt}
        onAddToLibrary={async (p) => {
          await createPrompt({ title: p.title, description: p.description, content: p.content });
          setDetailsOpen(false);
        }}
      />
      <HubPluginDetails open={pluginOpen} onOpenChange={setPluginOpen} plugin={selectedPlugin} />
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

function PromptCard({ prompt, onOpenDetails, favorite, onToggleFavorite }: { prompt: { id: string; title: string; description: string; category: string; isNew?: boolean }, onOpenDetails: (p: { id: string; title: string; description: string; category: string; isNew?: boolean }) => void, favorite?: boolean, onToggleFavorite?: () => void }) {
  return (
    <div className="p-4 rounded-2xl glass-surface border hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Badge / Category emoji substitute via icon tint */}
        <div className="mt-0.5 h-8 w-8 rounded-full bg-white/60 dark:bg-white/10 border flex items-center justify-center">
          {/* Simple category glyph */}
          {prompt.category === "finance" ? (
            <DollarSign className="h-4 w-4" />
          ) : prompt.category === "ecommerce" ? (
            <ShoppingCart className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold leading-tight line-clamp-1">{prompt.title}</h3>
            {prompt.isNew && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">NEW</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs px-2" onClick={() => onOpenDetails(prompt)}>View Details</Button>
            <button className={`h-7 w-7 inline-flex items-center justify-center rounded-md border glass-surface glass-hover ${favorite ? "text-rose-500" : ""}`} title={favorite ? "Remove from favorites" : "Save to favorites"} onClick={onToggleFavorite}>
              <Heart className="h-4 w-4" />
            </button>
            <button className="h-7 w-7 inline-flex items-center justify-center rounded-md border glass-surface glass-hover" title="Pro only (placeholder)">
              <Lock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Provide a default prompt content based on id/category. This can later be fetched from an API.
function defaultContentFor(p: { id: string; title: string; description: string; category: string }) {
  switch (p.id) {
    case "fin-ops-audit":
      return "You are a seasoned CFO. Conduct a comprehensive operational audit...";
    case "fin-debt-strategy":
      return "Act as a financial coach. Create a personalized debt payoff strategy...";
    case "ec-high-convert-landing":
      return "You are a CRO expert. Draft a high-converting landing page including hero, social proof...";
    case "ec-checkout-flow":
      return "Design a step-by-step checkout flow optimized for trust and speed...";
    default:
      return `${p.title}\n\n${p.description}`;
  }
}

export default HubPage;
