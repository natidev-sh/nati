import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { appsListAtom, appBasePathAtom } from "@/atoms/appAtoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Trash2,
  Edit2,
  Plus,
  Save,
  X,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { showError, showSuccess } from "@/lib/toast";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { useNavigate } from "@tanstack/react-router";
import { NeonConfigure } from "./NeonConfigure";
import { SupabaseConfigure } from "./SupabaseConfigure";

// Optional icons used in the quick app settings
import { Loader2, Folder, GitBranch, History, BookOpen, PlusCircle, Trash2 as TrashIcon } from "lucide-react";

const EnvironmentVariablesTitle = () => (
  <div className="flex items-center gap-2">
    <span className="text-lg font-semibold">Environment Variables</span>
    <span className="text-sm text-muted-foreground font-normal">Local</span>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle size={16} className="text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent>
        <p>
          To modify environment variables for Supabase or production,
          <br />
          access your hosting provider's console and update them there.
        </p>
      </TooltipContent>
    </Tooltip>
  </div>
);

export const ConfigurePanel = () => {
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const appsList = useAtomValue(appsListAtom);
  const appBasePath = useAtomValue(appBasePathAtom);
  const queryClient = useQueryClient();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingKeyValue, setEditingKeyValue] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const navigate = useNavigate();

  // Quick App Settings state
  const selectedApp = selectedAppId
    ? appsList.find((app) => app.id === Number(selectedAppId))
    : null;
  const [newAppName, setNewAppName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [copyName, setCopyName] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Test email state
  const [testEmailTo, setTestEmailTo] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  // Resend icons
  const resendIconBlack = new URL("../../../assets/resend-brand-assets/resend-icon-black.svg", import.meta.url).toString();
  const resendIconWhite = new URL("../../../assets/resend-brand-assets/resend-icon-white.svg", import.meta.url).toString();
  const stripeLogoColor = new URL("../../../assets/stripe-brand-assets/stripe-logo-color.svg", import.meta.url).toString();
  const stripeLogoWhite = new URL("../../../assets/stripe-brand-assets/stripe-logo-white.svg", import.meta.url).toString();

  // Query to get environment variables
  const {
    data: envVars = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["app-env-vars", selectedAppId],
    queryFn: async () => {
      if (!selectedAppId) return [];
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getAppEnvVars({ appId: selectedAppId });
    },
    enabled: !!selectedAppId,
  });

  const hasResend = useMemo(() => (envVars || []).some(e => e.key === "RESEND_API_KEY" || e.key === "RESEND_FROM_EMAIL"), [envVars]);
  const hasStripe = useMemo(() => (envVars || []).some(e => e.key.startsWith("STRIPE_")), [envVars]);
  const [stripeSuccessUrl, setStripeSuccessUrl] = useState("https://example.com/success");
  const [stripeCancelUrl, setStripeCancelUrl] = useState("https://example.com/cancel");
  const [stripePriceId, setStripePriceId] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  // Mutation to save environment variables
  const saveEnvVarsMutation = useMutation({
    mutationFn: async (newEnvVars: { key: string; value: string }[]) => {
      if (!selectedAppId) throw new Error("No app selected");
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.setAppEnvVars({
        appId: selectedAppId,
        envVars: newEnvVars,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["app-env-vars", selectedAppId],
      });
      showSuccess("Environment variables saved");
    },
    onError: (error) => {
      showError(`Failed to save environment variables: ${error}`);
    },
  });

  const handleAdd = useCallback(() => {
    if (!newKey.trim() || !newValue.trim()) {
      showError("Both key and value are required");
      return;
    }

    // Check for duplicate keys
    if (envVars.some((envVar) => envVar.key === newKey.trim())) {
      showError("Environment variable with this key already exists");
      return;
    }

    const newEnvVars = [
      ...envVars,
      { key: newKey.trim(), value: newValue.trim() },
    ];
    saveEnvVarsMutation.mutate(newEnvVars);
    setNewKey("");
    setNewValue("");
    setIsAddingNew(false);
  }, [newKey, newValue, envVars, saveEnvVarsMutation]);

  const handleEdit = useCallback((envVar: { key: string; value: string }) => {
    setEditingKey(envVar.key);
    setEditingKeyValue(envVar.key);
    setEditingValue(envVar.value);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingKeyValue.trim() || !editingValue.trim()) {
      showError("Both key and value are required");
      return;
    }

    // Check for duplicate keys (excluding the current one being edited)
    if (
      envVars.some(
        (envVar) =>
          envVar.key === editingKeyValue.trim() && envVar.key !== editingKey,
      )
    ) {
      showError("Environment variable with this key already exists");
      return;
    }

    const newEnvVars = envVars.map((envVar) =>
      envVar.key === editingKey
        ? { key: editingKeyValue.trim(), value: editingValue.trim() }
        : envVar,
    );
    saveEnvVarsMutation.mutate(newEnvVars);
    setEditingKey(null);
    setEditingKeyValue("");
    setEditingValue("");
  }, [editingKey, editingKeyValue, editingValue, envVars, saveEnvVarsMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingKey(null);
    setEditingKeyValue("");
    setEditingValue("");
  }, []);

  const handleDelete = useCallback(
    (key: string) => {
      const newEnvVars = envVars.filter((envVar) => envVar.key !== key);
      saveEnvVarsMutation.mutate(newEnvVars);
    },
    [envVars, saveEnvVarsMutation],
  );

  const handleCancelAdd = useCallback(() => {
    setIsAddingNew(false);
    setNewKey("");
    setNewValue("");
  }, []);


  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <EnvironmentVariablesTitle />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading environment variables...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <EnvironmentVariablesTitle />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-sm text-red-500">
                Error loading environment variables: {error.message}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show no app selected state
  if (!selectedAppId) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <EnvironmentVariablesTitle />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                Select an app to manage environment variables
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <EnvironmentVariablesTitle />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Add new environment variable form */}
          {isAddingNew ? (
            <div className="space-y-3 p-3 border rounded-md bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="new-key">Key</Label>
                <Input
                  id="new-key"
                  placeholder="e.g., API_URL"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-value">Value</Label>
                <Input
                  id="new-value"
                  placeholder="e.g., https://api.example.com"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  size="sm"
                  disabled={saveEnvVarsMutation.isPending}
                >
                  <Save size={14} />
                  {saveEnvVarsMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button onClick={handleCancelAdd} variant="outline" size="sm">
                  <X size={14} />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAddingNew(true)}
              variant="outline"
              className="w-full"
            >
              <Plus size={14} />
              Add Environment Variable
            </Button>
          )}

      {/* Stripe (only if implemented) */}
      {hasStripe && (
        <Card>
          <CardHeader className="select-none">
            <CardTitle className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stripeLogoColor} alt="Stripe" className="h-4 w-auto dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stripeLogoWhite} alt="Stripe" className="h-4 w-auto hidden dark:block" />
              Stripe Checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Create a test Checkout Session using your configured Stripe keys. Use <button className="underline hover:opacity-80" onClick={()=> (navigate as any)({ to: "/docs", search: { provider: "stripe", section: "stripe-local-testing" } })}>test cards</button>.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Success URL" value={stripeSuccessUrl} onChange={(e)=>setStripeSuccessUrl(e.target.value)} />
              <Input placeholder="Cancel URL" value={stripeCancelUrl} onChange={(e)=>setStripeCancelUrl(e.target.value)} />
              <Input placeholder="Price ID (optional)" value={stripePriceId} onChange={(e)=>setStripePriceId(e.target.value)} />
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="default"
                onClick={async ()=>{
                  const secret = envVars.find(e=>e.key==="STRIPE_SECRET_KEY")?.value?.trim();
                  const publishable = envVars.find(e=>e.key==="STRIPE_PUBLISHABLE_KEY")?.value?.trim();
                  if(!secret){ showError("STRIPE_SECRET_KEY is not set"); return; }
                  if(!publishable){ showError("STRIPE_PUBLISHABLE_KEY is not set"); return; }
                  setCreatingSession(true);
                  try{
                    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions",{
                      method:"POST",
                      headers:{
                        Authorization:`Bearer ${secret}`,
                        "Content-Type":"application/x-www-form-urlencoded",
                      },
                      body:new URLSearchParams({
                        mode:"payment",
                        success_url: stripeSuccessUrl,
                        cancel_url: stripeCancelUrl,
                        ...(stripePriceId?{ "line_items[0][price]": stripePriceId, "line_items[0][quantity]":"1" }:{ "line_items[0][price_data][currency]":"usd","line_items[0][price_data][unit_amount]":"500","line_items[0][price_data][product_data][name]":"Test Item","line_items[0][quantity]":"1"})
                      } as any).toString()
                    });
                    if(!resp.ok){ const t=await resp.text(); throw new Error(t||`HTTP ${resp.status}`); }
                    const data = await resp.json();
                    const url = data?.url as string | undefined;
                    if(!url) throw new Error("No session URL returned");
                    window.open(url, "_blank");
                    showSuccess("Opened Stripe Checkout in a new tab");
                  }catch(e:any){
                    showError(`Failed to create session: ${e?.message||e}`);
                  }finally{ setCreatingSession(false); }
                }}
                disabled={creatingSession}
              >
                {creatingSession? <Loader2 className="h-4 w-4 animate-spin"/>: "Create test Checkout Session"}
              </Button>
              <button className="text-xs underline text-muted-foreground" onClick={()=> (navigate as any)({ to: "/docs", search: { provider: "stripe", section: "stripe-local-quickstart" } })}>Checkout quickstart</button>
              <button className="text-xs underline text-muted-foreground" onClick={()=> (navigate as any)({ to: "/docs", search: { provider: "stripe", section: "stripe-local-webhooks" } })}>Webhooks</button>
            </div>
          </CardContent>
        </Card>
      )}

          {/* List of existing environment variables */}
          <div className="space-y-2">
            {envVars.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No environment variables configured
              </p>
            ) : (
              envVars.map((envVar) => (
                <div
                  key={envVar.key}
                  className="flex items-center space-x-2 p-2 border rounded-md"
                >
                  {editingKey === envVar.key ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editingKeyValue}
                          onChange={(e) => setEditingKeyValue(e.target.value)}
                          placeholder="Key"
                          className="h-8"
                        />
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          placeholder="Value"
                          className="h-8"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          data-testid={`save-edit-env-var`}
                          onClick={handleSaveEdit}
                          size="sm"
                          variant="outline"
                          disabled={saveEnvVarsMutation.isPending}
                        >
                          <Save size={14} />
                        </Button>
                        <Button
                          data-testid={`cancel-edit-env-var`}
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {envVar.key}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {envVar.value}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          data-testid={`edit-env-var-${envVar.key}`}
                          onClick={() => handleEdit(envVar)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          data-testid={`delete-env-var-${envVar.key}`}
                          onClick={() => handleDelete(envVar.key)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={saveEnvVarsMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* More app configurations button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full text-sm justify-between"
              onClick={() => {
                if (selectedAppId) {
                  navigate({
                    to: "/app-details",
                    search: { appId: selectedAppId },
                  });
                }
              }}
            >
              <span>More app settings</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Configurations */}
      <div className="grid grid-cols-1 gap-6">
        <SupabaseConfigure />
        <NeonConfigure />
      </div>

      {/* Resend (only if implemented) */}
      {hasResend && (
        <Card>
          <CardHeader className="select-none">
            <CardTitle className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resendIconBlack} alt="Resend" className="h-4 w-4 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resendIconWhite} alt="Resend" className="h-4 w-4 hidden dark:block" />
              Resend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Send a test email using your configured <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code>.</div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Recipient email (you@domain.com)"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
              />
              <Button
                onClick={async () => {
                  const key = envVars.find((e) => e.key === "RESEND_API_KEY")?.value?.trim();
                  const from = envVars.find((e) => e.key === "RESEND_FROM_EMAIL")?.value?.trim();
                  if (!key) { showError("RESEND_API_KEY is not set"); return; }
                  if (!from) { showError("RESEND_FROM_EMAIL is not set"); return; }
                  if (!testEmailTo.trim()) { showError("Enter a recipient email"); return; }
                  setSendingTest(true);
                  try {
                    const resp = await fetch("https://api.resend.com/emails", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${key}`,
                      },
                      body: JSON.stringify({
                        from,
                        to: testEmailTo.trim(),
                        subject: "Test email from Nati (Resend)",
                        html: `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto">Hello from <b>Nati</b> 👋<br/><br/>This is a test email sent via <a href="https://resend.com">Resend</a> using your configured API key.</div>`,
                      }),
                    });
                    if (!resp.ok) {
                      const txt = await resp.text();
                      throw new Error(txt || `HTTP ${resp.status}`);
                    }
                    showSuccess("Test email sent");
                  } catch (e: any) {
                    showError(`Failed to send: ${e?.message || e}`);
                  } finally {
                    setSendingTest(false);
                  }
                }}
                disabled={sendingTest}
              >
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versioning */}
      <Card>
        <CardHeader className="select-none">
          <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Versioning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Accordion type="single" collapsible defaultValue="closed">
            <AccordionItem value="versions">
              <AccordionTrigger className="select-none">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>History</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {selectedAppId ? (
                  <VersioningSection appId={Number(selectedAppId)} />
                ) : (
                  <div className="text-sm text-muted-foreground">Select an app to view versions</div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Backups */}
      <Card>
        <CardHeader className="select-none">
          <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Backups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BackupsSection />
        </CardContent>
      </Card>

      {/* Knowledge */}
      <Card>
        <CardHeader className="select-none">
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAppId ? (
            <KnowledgeSection appId={Number(selectedAppId)} />
          ) : (
            <div className="text-sm text-muted-foreground">Select an app to manage knowledge</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VersioningSection({ appId }: { appId: number }) {
  const qc = useQueryClient();
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["versions", appId],
    queryFn: () => IpcClient.getInstance().listVersions({ appId }),
  });

  const checkout = useMutation({
    mutationFn: (versionId: string) =>
      IpcClient.getInstance().checkoutVersion({ appId, versionId }),
    onSuccess: () => {
      showSuccess("Checked out version");
    },
    onError: (e) => showError(e),
  });

  const revert = useMutation({
    mutationFn: (versionId: string) =>
      IpcClient.getInstance().revertVersion({ appId, previousVersionId: versionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["versions", appId] });
      showSuccess("Reverted to selected version");
    },
    onError: (e) => showError(e),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading versions…</div>;
  }

  if (!versions.length) {
    return <div className="text-sm text-muted-foreground">No versions yet</div>;
  }

  return (
    <div className="space-y-2">
      {versions.slice(0, 15).map((v) => (
        <div key={v.oid} className="flex items-center justify-between gap-2 p-2 border rounded-md">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{v.message}</div>
            <div className="text-xs text-muted-foreground truncate">{new Date(v.timestamp * 1000).toLocaleString()} • {v.oid.slice(0, 7)}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => checkout.mutate(v.oid)} disabled={checkout.isPending}>
              {checkout.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Checkout"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => revert.mutate(v.oid)} disabled={revert.isPending}>
              {revert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Revert"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BackupsSection() {
  const qc = useQueryClient();
  const { data: backups = [], isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () => IpcClient.getInstance().listBackups(),
  });

  const create = useMutation({
    mutationFn: (reason?: string) => IpcClient.getInstance().createBackup(reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"] });
      showSuccess("Backup created");
    },
    onError: (e) => showError(e),
  });

  const del = useMutation({
    mutationFn: (name: string) => IpcClient.getInstance().deleteBackup(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }),
    onError: (e) => showError(e),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={() => create.mutate("manual")} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "+ Create Backup"}
        </Button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading backups…</div>
      ) : backups.length === 0 ? (
        <div className="text-sm text-muted-foreground">No backups yet</div>
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <div key={b.name} className="flex items-center justify-between gap-2 p-2 border rounded-md">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground truncate">{new Date(b.timestamp).toLocaleString()} • v{b.version} • {b.reason}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => del.mutate(b.name)} disabled={del.isPending}>
                  {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KnowledgeSection({ appId }: { appId: number }) {
  const qc = useQueryClient();
  const [newGlob, setNewGlob] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["context-paths", appId],
    queryFn: () => IpcClient.getInstance().getChatContextResults({ appId }),
  });

  const save = useMutation({
    mutationFn: (globs: string[]) =>
      IpcClient.getInstance().setChatContext({
        appId,
        chatContext: {
          contextPaths: globs.map((g) => ({ globPath: g })),
          smartContextAutoIncludes: [],
          excludePaths: [],
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context-paths", appId] }),
    onError: (e) => showError(e),
  });

  const currentGlobs = (data?.contextPaths || []).map((c) => c.globPath);

  return (
    <div className="space-y-3 select-none">
      <div className="flex gap-2">
        <Input
          placeholder="e.g. src/**/*.ts, docs/**"
          value={newGlob}
          onChange={(e) => setNewGlob(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => {
            const g = newGlob.trim();
            if (!g) return;
            const merged = Array.from(new Set([...currentGlobs, g]));
            save.mutate(merged);
            setNewGlob("");
          }}
          disabled={save.isPending || !newGlob.trim()}
        >
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-1" />Add
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading knowledge…</div>
      ) : currentGlobs.length === 0 ? (
        <div className="text-sm text-muted-foreground">No knowledge paths defined</div>
      ) : (
        <div className="space-y-2">
          {data!.contextPaths.map((p) => (
            <div key={p.globPath} className="flex items-center justify-between gap-2 p-2 border rounded-md">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.globPath}</div>
                <div className="text-xs text-muted-foreground">{p.files} files • ~{p.tokens} tokens</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const next = currentGlobs.filter((g) => g !== p.globPath);
                    save.mutate(next);
                  }}
                >
                  <TrashIcon className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
