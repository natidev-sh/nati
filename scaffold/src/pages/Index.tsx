// Update this page (the content is just a fallback if you fail to update the page)

import { MadeWithNati } from "@/components/made-with-nati";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0ea5e9]/20 via-background to-[#8b5cf6]/20">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-16">
        {/* Glass hero card */}
        <div className="rounded-3xl border bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-xl ring-1 ring-white/20 overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Left: Branding & intro */}
            <div className="flex-1 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="App Logo" className="h-10 w-10 rounded-xl shadow-md" />
                <div>
                  <div className="text-sm uppercase tracking-wider text-muted-foreground">Starter</div>
                  <h1 className="text-2xl md:text-3xl font-semibold">Your Blank App</h1>
                </div>
              </div>

              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Kick off fast with a beautiful, glassmorphic starter. Build features, iterate in Chat,
                and reference Docs without leaving your flow.
              </p>

              {/* Quick Actions */}
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <a href="/chat" className="group rounded-xl border bg-background/60 hover:bg-accent/40 transition-colors p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/20 ring-1 ring-white/30 flex items-center justify-center text-sm">💬</div>
                  <div>
                    <div className="text-sm font-medium">Open Chat</div>
                    <div className="text-xs text-muted-foreground">Generate code, refactor, and debug with AI</div>
                  </div>
                </a>
                <a href="/docs" className="group rounded-xl border bg-background/60 hover:bg-accent/40 transition-colors p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 ring-1 ring-white/30 flex items-center justify-center text-sm">📚</div>
                  <div>
                    <div className="text-sm font-medium">Browse Docs</div>
                    <div className="text-xs text-muted-foreground">Local cards for Stripe, Resend, and more</div>
                  </div>
                </a>
                <a href="/hub" className="group rounded-xl border bg-background/60 hover:bg-accent/40 transition-colors p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 ring-1 ring-white/30 flex items-center justify-center text-sm">🧩</div>
                  <div>
                    <div className="text-sm font-medium">Templates & Plugins</div>
                    <div className="text-xs text-muted-foreground">Install starters and extend your stack</div>
                  </div>
                </a>
                <a href="/settings" className="group rounded-xl border bg-background/60 hover:bg-accent/40 transition-colors p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/20 ring-1 ring-white/30 flex items-center justify-center text-sm">⚙️</div>
                  <div>
                    <div className="text-sm font-medium">Settings</div>
                    <div className="text-xs text-muted-foreground">Configure providers, keys, and preferences</div>
                  </div>
                </a>
              </div>

              {/* Tips */}
              <div className="mt-6 text-xs text-muted-foreground space-y-1">
                <div>Tip: Use Chat to scaffold features quickly, then refine the code inline.</div>
                <div>Press Ctrl/Cmd + K to search, or explore the Docs panel for focused guides.</div>
              </div>
            </div>

            {/* Right: Showcase panel */}
            <div className="md:max-w-sm w-full p-8 md:p-10 bg-gradient-to-b from-white/5 to-transparent border-l">
              <div className="rounded-2xl border bg-background/60 backdrop-blur-md p-5">
                <div className="text-sm font-medium mb-2">What you can do</div>
                <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Spin up a checkout with Stripe using the Docs cards</li>
                  <li>Send test emails via Resend from Configure panel</li>
                  <li>Wire webhooks and preview them locally</li>
                  <li>Version and backup your app from Configure</li>
                </ul>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href="/docs?provider=stripe" className="text-xs rounded-lg border px-3 py-2 hover:bg-accent/40 transition-colors text-center">Stripe</a>
                  <a href="/docs?provider=resend" className="text-xs rounded-lg border px-3 py-2 hover:bg-accent/40 transition-colors text-center">Resend</a>
                </div>

                <div className="mt-5 rounded-xl p-3 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border">
                  <div className="text-xs">Pro tip</div>
                  <div className="text-[11px] text-muted-foreground">Use Chat to generate UI components, routes, and tests. Ask it to “Create a pricing page with Tailwind and glassmorphism.”</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">Theme-ready • Glassmorphism • Tailwind • TypeScript</div>
          <MadeWithNati />
        </div>
      </div>
    </div>
  );
};

export default Index;
