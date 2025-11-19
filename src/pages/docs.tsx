import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSearch } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { IpcClient } from "@/ipc/ipc_client";
import catalog from "@/docs/catalog.json";
import { CodeHighlight } from "@/components/chat/CodeHighlight";

// Load providers from editable catalog
const providers = (catalog as any).providers as Array<{
  id: string;
  name: string;
  moreUrl: string;
  sections: { id: string; title: string; url: string; summary?: string }[];
}>;

const defaultDoc = { providerId: providers[0]?.id || "stripe", sectionId: providers[0]?.sections[0]?.id || "checkout-quickstart" } as const;

const DocsPage: React.FC = () => {
  const search = useSearch({ from: "/docs" });
  const [providerId, setProviderId] = useState<string>(defaultDoc.providerId);
  const [sectionId, setSectionId] = useState<string>(defaultDoc.sectionId);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [html, setHtml] = useState<string>("");
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [headings, setHeadings] = useState<Array<{id:string; level:number; text:string}>>([]);
  const [showCards, setShowCards] = useState(false);

  // Preselect provider/section from search params
  useEffect(() => {
    let nextProviderId = providerId;
    if (typeof search?.provider === "string") {
      const exists = providers.some((p) => p.id === search.provider);
      if (exists) {
        nextProviderId = search.provider;
        setProviderId(nextProviderId);
      }
    }

    if (typeof (search as any)?.section === "string") {
      const p = providers.find((p) => p.id === nextProviderId) || providers[0];
      const sec = p.sections.find((s) => s.id === (search as any).section);
      if (sec) {
        setSectionId(sec.id);
        return;
      }
    }

    // fallback: first section of provider if changed via search
    if (typeof search?.provider === "string") {
      const first = providers.find((p) => p.id === search.provider)?.sections[0]?.id;
      if (first) setSectionId(first);
    }
  }, [search?.provider, (search as any)?.section]);

  const provider = useMemo(() => providers.find(p => p.id === providerId) || providers[0], [providerId]);
  const section = useMemo(() => provider.sections.find(s => s.id === sectionId) || provider.sections[0], [provider, sectionId]);

  const flatSections = useMemo(() => {
    return providers.flatMap(p => p.sections.map(s => ({...s, providerId: p.id, providerName: p.name})));
  }, []);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as Array<typeof flatSections[number]>;
    return flatSections.filter(s =>
      s.title.toLowerCase().includes(term) ||
      (s.summary||"").toLowerCase().includes(term) ||
      s.url.toLowerCase().includes(term) ||
      s.providerName.toLowerCase().includes(term)
    );
  }, [q, flatSections]);

  const isLocal = (url: string) => url.startsWith("local:");
  const localPath = (url: string) => url.replace(/^local:/, "");

  // Fetch content when proxy enabled or local markdown selected
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setHtml("");
      setMd("");
      setHeadings([]);
      try {
        if (!section?.url) return;
        if (isLocal(section.url)) {
          const fileUrl = new URL(`../docs/${localPath(section.url)}`, import.meta.url).toString();
          const res = await fetch(fileUrl);
          const text = await res.text();
          if (!cancelled) setMd(text);
        } else if (proxyEnabled) {
          const resp = await IpcClient.getInstance().docsFetch(section.url, false);
          if (!cancelled) setHtml(resp.html || "");
        }
      } catch (e) {
        if (!cancelled) setHtml(`<div style="padding:12px">Failed to load: ${String((e as any)?.message || e)} </div>`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [provider.id, section.id, proxyEnabled]);

  // Build TOC from markdown headings
  useEffect(() => {
    if (!md) { setHeadings([]); return; }
    const hs: Array<{id:string; level:number; text:string}> = [];
    const lines = md.split(/\r?\n/);
    for (const line of lines) {
      const m = /^(#{1,6})\s+(.+)$/.exec(line.trim());
      if (m) {
        const level = m[1].length;
        const raw = m[2].replace(/[#`*_<>{}[\]]/g, "").trim();
        const id = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        hs.push({ id, level, text: raw });
      }
    }
    setHeadings(hs);
  }, [md]);

  // Logos
  const stripeLogo = new URL("../../assets/stripe-brand-assets/stripe-logo-color.svg", import.meta.url).toString();
  const resendBlack = new URL("../../assets/resend-brand-assets/resend-icon-black.svg", import.meta.url).toString();
  const resendWhite = new URL("../../assets/resend-brand-assets/resend-icon-white.svg", import.meta.url).toString();
  const natiLogo = new URL("../../assets/icon/logo.png", import.meta.url).toString();
  const providerLogo = (id: string) => id === "stripe" ? stripeLogo : id === "resend" ? (document.documentElement.classList.contains('dark') ? resendWhite : resendBlack) : natiLogo;

  // Lightweight inline components for MD rendering
  const VideoPlayer: React.FC<React.VideoHTMLAttributes<HTMLVideoElement>> = (props) => {
    const { className, autoPlay, muted, loop, playsInline, controls, ...rest } = props;
    return (
      <div className="rounded-xl overflow-hidden border bg-muted/20">
        <video
          className={className || "w-full aspect-video"}
          autoPlay={autoPlay ?? true}
          muted={muted ?? true}
          loop={loop ?? true}
          playsInline={playsInline ?? true}
          controls={controls ?? false}
          preload={"metadata"}
          {...rest}
        />
      </div>
    );
  };

  const CardGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
    <div className={`grid sm:grid-cols-2 gap-3 ${className || ""}`} {...rest}>{children}</div>
  );

  const Card: React.FC<any> = ({ title, icon, href, children, ...rest }) => {
    const Container: any = href ? 'a' : 'div';
    return (
      <Container href={href} target={href?"_blank":undefined} rel={href?"noreferrer":undefined}
        className="block rounded-xl border p-4 hover:bg-accent/30 transition-colors"
        {...rest}
      >
        {title && <div className="text-sm font-semibold mb-1 flex items-center gap-2">{title}</div>}
        <div className="text-xs text-muted-foreground">{children}</div>
      </Container>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Header */}
      <div className="lg:col-span-12">
        <div className="rounded-3xl border overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-br from-[#0ea5e9]/20 via-transparent to-[#8b5cf6]/20">
            <div className="flex items-center gap-3">
              {provider.id === "stripe" && (<img src={stripeLogo} alt="Stripe" className="h-6 w-auto" />)}
              {provider.id === "resend" && (
                <>
                  <img src={resendBlack} alt="Resend" className="h-6 w-6 dark:hidden" />
                  <img src={resendWhite} alt="Resend" className="h-6 w-6 hidden dark:block" />
                </>
              )}
              {provider.id === "nati" && (<img src={natiLogo} alt="Nati" className="h-6 w-6 rounded" />)}
              <div>
                <div className="text-xl font-semibold">{provider.name} Docs</div>
                <div className="text-xs text-muted-foreground">Curated quick links and inline summaries</div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span>Render inline via proxy</span>
                  <Switch checked={proxyEnabled} onCheckedChange={setProxyEnabled} />
                </div>
                <Button size="sm" variant="outline" onClick={async ()=>{
                  setLoading(true);
                  try{
                    if (isLocal(section.url)){
                      const fileUrl = new URL(`../docs/${localPath(section.url)}`, import.meta.url).toString();
                      const res = await fetch(fileUrl);
                      setMd(await res.text());
                    } else if (proxyEnabled) {
                      const resp = await IpcClient.getInstance().docsFetch(section.url, true);
                      setHtml(resp.html || "");
                    }
                  } finally { setLoading(false);} 
                }}>Refresh</Button>
                <a className="text-xs underline" href={provider.moreUrl} target="_blank" rel="noreferrer">More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Left nav */}
      <aside className="lg:col-span-4 p-4 rounded-2xl glass-surface border">
        <div className="mb-3 text-sm text-muted-foreground">Providers</div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {providers.map(p => (
            <Button key={p.id} size="sm" variant={providerId===p.id?"default":"outline"} onClick={() => { setProviderId(p.id); setSectionId(p.sections[0]?.id || ""); }}>
              {p.name}
            </Button>
          ))}
        </div>
        <div className="mb-3">
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search docs across providers..." />
          <div className="mt-1 text-[11px] text-muted-foreground">Searches titles, summaries, URLs and provider names</div>
        </div>
        <div className="text-sm text-muted-foreground mb-2">Docs</div>
        <div className="flex flex-col gap-1">
          {provider.sections.map(s => (
            <button key={s.id} onClick={() => setSectionId(s.id)} className={`text-left px-3 py-2 rounded-md border ${sectionId===s.id?"bg-primary text-primary-foreground":"glass-surface glass-hover"}`}>
              <div className="text-sm font-medium flex items-center gap-2">{(s as any).emoji && <span>{(s as any).emoji}</span>}<span>{s.title}</span></div>
              {s.summary && <div className="text-[11px] opacity-80 line-clamp-2">{s.summary}</div>}
              <div className="text-[11px] opacity-60 truncate">{s.url}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs">
          More: <a className="underline" href={provider.moreUrl} target="_blank" rel="noreferrer">{provider.moreUrl}</a>
        </div>
      </aside>

      {/* Viewer */}
      <main className="lg:col-span-8 rounded-2xl overflow-hidden border glass-surface h-[78vh] p-0 flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b flex items-center gap-2 text-xs sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button
            className="font-medium hover:underline"
            onClick={() => {
              setProviderId(provider.id);
              const first = provider.sections[0]?.id;
              if (first) setSectionId(first);
            }}
          >
            {section.title}
          </button>
          <span className="opacity-60">•</span>
          <a className="underline" href={section.url.startsWith("local:")? undefined : section.url} target={section.url.startsWith("local:")? undefined : "_blank"} rel="noreferrer">
            {section.url.startsWith("local:")? localPath(section.url) : section.url}
          </a>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Proxy</span>
              <Switch checked={proxyEnabled} onCheckedChange={setProxyEnabled} />
            </div>
            {isLocal(section.url) && (
              <div className="flex items-center gap-2">
                <span>Cards</span>
                <Switch checked={showCards} onCheckedChange={setShowCards} />
              </div>
            )}
            <Button size="sm" variant="outline" onClick={async ()=>{
              setLoading(true);
              try{
                if (isLocal(section.url)){
                  const fileUrl = new URL(`../docs/${localPath(section.url)}`, import.meta.url).toString();
                  const res = await fetch(fileUrl);
                  setMd(await res.text());
                } else if (proxyEnabled) {
                  const resp = await IpcClient.getInstance().docsFetch(section.url, true);
                  setHtml(resp.html || "");
                }
              } finally { setLoading(false);} 
            }}>Refresh</Button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[72vh]">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && section.url && isLocal(section.url) && !showCards && (
            <div className="prose dark:prose-invert max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:underline prose-img:rounded-xl prose-img:shadow-md">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  table: ({node, ...props}: any) => (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}: any) => (
                    <thead className="bg-muted/50" {...props} />
                  ),
                  th: ({node, ...props}: any) => (
                    <th className="px-3 py-2 text-left font-semibold border-b" {...props} />
                  ),
                  td: ({node, ...props}: any) => (
                    <td className="px-3 py-2 align-top border-b" {...props} />
                  ),
                  // media
                  video: ({node, ...props}: any) => (
                    <VideoPlayer {...(props as any)} />
                  ),
                  img: ({node, ...props}: any) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="rounded-lg shadow" loading="lazy" {...props} />
                  ),
                  // simple MDX-like shortcodes
                  cardgroup: ({node, ...props}: any) => (<CardGroup {...(props as any)} />),
                  card: ({node, ...props}: any) => (<Card {...(props as any)} />),
                } as any}
              >{md}</ReactMarkdown>
            </div>
          )}
          {!loading && section.url && isLocal(section.url) && showCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(q? filtered : provider.sections).map((s: any) => (
                <div key={s.id+ (s.providerId||'')} onClick={()=>{ setProviderId(s.providerId||provider.id); setSectionId(s.id); }} className={`rounded-2xl border p-4 cursor-pointer transition-colors ${s.id===section.id && (s.providerId??provider.id)===provider.id?"ring-1 ring-primary":"hover:bg-accent/30"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={providerLogo(s.providerId||provider.id)} alt="logo" className="h-4 w-auto" />
                      <div className="text-[11px] opacity-70">{s.providerName || provider.name}</div>
                    </div>
                    <div className="text-sm font-medium mb-1 flex items-center gap-2">{(s as any).emoji && <span>{(s as any).emoji}</span>}<span>{s.title}</span></div>
                    {s.summary && <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{s.summary}</div>}
                    <div className="text-xs text-muted-foreground truncate mb-3">{s.url}</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={(e)=>{ e.stopPropagation(); setProviderId(s.providerId||provider.id); setSectionId(s.id); }}>Open</Button>
                    </div>
                  </div>
              ))}
            </div>
          )}
          {!loading && !isLocal(section.url) && proxyEnabled && (
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          )}
          {!loading && !isLocal(section.url) && !proxyEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(q? filtered : provider.sections).map((s: any) => (
                <div key={s.id+ (s.providerId||'')} onClick={()=>{ setProviderId(s.providerId||provider.id); setSectionId(s.id); }} className={`rounded-2xl border p-4 cursor-pointer transition-colors ${s.id===section.id && (s.providerId??provider.id)===provider.id?"ring-1 ring-primary":"hover:bg-accent/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={providerLogo(s.providerId||provider.id)} alt="logo" className="h-4 w-auto" />
                    <div className="text-[11px] opacity-70">{s.providerName || provider.name}</div>
                  </div>
                  <div className="text-sm font-medium mb-1">{s.title}</div>
                  {s.summary && <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{s.summary}</div>}
                  <div className="text-xs text-muted-foreground truncate mb-3">{s.url}</div>
                  <div className="flex items-center gap-2">
                    <a className="text-xs underline" href={s.url} target="_blank" rel="noreferrer">Open</a>
                    <Button size="sm" variant="outline" onClick={(e)=>{ e.stopPropagation(); setProviderId(s.providerId||provider.id); setSectionId(s.id); if (!isLocal(s.url)) setProxyEnabled(true); }}>Preview</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DocsPage;
