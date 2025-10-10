import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Rocket, X } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { appsListAtom, selectedAppIdAtom } from "@/atoms/appAtoms";
import { useNavigate } from "@tanstack/react-router";
import { IpcClient } from "@/ipc/ipc_client";

export type HubPlugin = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  docsUrl: string;
  images: string[];
};

export function HubPluginDetails({
  open,
  onOpenChange,
  plugin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plugin: HubPlugin | null;
}) {
  const p = plugin;
  const [idx, setIdx] = useState(0);
  const safeIdx = useMemo(
    () => (p ? Math.min(Math.max(idx, 0), Math.max(0, p.images.length - 1)) : 0),
    [idx, p]
  );

  const navigate = useNavigate();
  const apps = useAtomValue(appsListAtom);
  const [selectedAppId, setSelectedAppId] = useAtom(selectedAppIdAtom);
  const firstAppId = apps[0]?.id ? String(apps[0].id) : "";
  const currentAppId = selectedAppId ? String(selectedAppId) : firstAppId;

  const resendBlack = new URL(
    "../../assets/resend-brand-assets/resend-icon-black.svg",
    import.meta.url
  ).toString();
  const resendWhite = new URL(
    "../../assets/resend-brand-assets/resend-icon-white.svg",
    import.meta.url
  ).toString();
  const stripeLogoColor = new URL(
    "../../assets/stripe-brand-assets/stripe-logo-color.svg",
    import.meta.url
  ).toString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl p-0 overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
      >
        {p ? (
          <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-[60%_40%]">
            {/* Close Button */}
            <button
              aria-label="Close"
              className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 backdrop-blur hover:bg-muted transition"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Gallery */}
            <div className="md:col-span-7 bg-muted/20 p-6 flex flex-col overflow-hidden">
              <div className="flex-1 flex items-center justify-center border rounded-xl bg-black/5 dark:bg-white/5 overflow-hidden">
                <img
                  src={p.images[safeIdx]}
                  alt={`${p.name} screenshot ${safeIdx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {p.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setIdx(i)}
                    className={`shrink-0 rounded-lg overflow-hidden border transition ${
                      i === safeIdx ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt={`${p.name} thumb ${i + 1}`} className="w-28 h-20 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-5 p-8 space-y-5 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  {p.id === "stripe" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={stripeLogoColor} alt="Stripe" className="h-5 w-auto" />
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resendBlack} alt="Resend" className="h-5 w-5 dark:hidden" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resendWhite} alt="Resend" className="h-5 w-5 hidden dark:block" />
                    </>
                  )}
                  {p.name}
                </DialogTitle>
                <DialogDescription className="text-sm opacity-80">{p.tagline}</DialogDescription>
              </DialogHeader>

              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>

              <div className="flex gap-2 items-center pt-2">
                <a href={p.docsUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Open Docs
                  </Button>
                </a>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate({ to: "/docs", search: { provider: p.id } })}
                >
                  View in Docs
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="text-sm font-medium">Add to an app</div>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full border rounded-md bg-background px-2 py-2 text-sm"
                    value={currentAppId}
                    onChange={(e) => setSelectedAppId(Number(e.target.value))}
                  >
                    {apps.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <Button
                    className="gap-2"
                    disabled={!apps.length}
                    onClick={() => {
                      if (!apps.length) return;
                      const appId = Number(currentAppId || apps[0].id);
                      (async () => {
                        try {
                          const existing = await IpcClient.getInstance().getAppEnvVars({ appId });
                          const keys = new Set(existing.map((e: any) => e.key));
                          const next = [...existing];

                          // Determine which keys to ensure based on plugin id
                          const needed: string[] =
                            p?.id === "stripe"
                              ? [
                                  "STRIPE_PUBLISHABLE_KEY",
                                  "STRIPE_SECRET_KEY",
                                  "STRIPE_WEBHOOK_SECRET",
                                ]
                              : [
                                  "RESEND_API_KEY",
                                  "RESEND_FROM_EMAIL",
                                ];

                          for (const k of needed) {
                            if (!keys.has(k)) next.push({ key: k, value: "" });
                          }
                          if (next.length !== existing.length) {
                            await IpcClient.getInstance().setAppEnvVars({ appId, envVars: next });
                          }
                        } catch {}
                        onOpenChange(false);
                        navigate({ to: "/app-details", search: { appId } });
                      })();
                    }}
                  >
                    <Rocket className="h-4 w-4" /> Implement in App
                  </Button>
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug">
                  Configure in the app’s Configure tab: set <code>RESEND_API_KEY</code> and optional <code>RESEND_FROM_EMAIL</code>.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-sm text-muted-foreground">Select a plugin</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
