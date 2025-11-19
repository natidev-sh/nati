import { useEffect, useMemo, useState } from "react";
import { 
  Database, Shield, Play, Table as TableIcon, Plus, Pencil, Trash2, 
  Columns, AlertTriangle, TerminalSquare, GitBranch, History, 
  Save, Download, Upload, RefreshCw, Search, Filter, 
  ChevronDown, ChevronRight, Copy, Check, Settings, Sparkles,
  Code2, FileText, Zap
} from "lucide-react";
import { DropColumnDialog } from "@/components/db/DropColumnDialog";
import { IpcClient } from "@/ipc/ipc_client";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useSettings } from "@/hooks/useSettings";
import { ModelPicker } from "@/components/ModelPicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props {
  appId: number;
}

interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  success: boolean;
  rowCount?: number;
}

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  description?: string;
  createdAt: number;
}

export function SupabaseDbBrowser({ appId }: Props) {
  const { isAnyProviderSetup, isProviderSetup } = useLanguageModelProviders();
  const { settings } = useSettings();
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);

  const [sql, setSql] = useState<string>("SELECT now();");
  const [executing, setExecuting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [lastResultTable, setLastResultTable] = useState<string | null>(null);

  const [seedSql, setSeedSql] = useState<string>("");
  const [seedBusy, setSeedBusy] = useState(false);
  const [confirmSeedOpen, setConfirmSeedOpen] = useState(false);
  // Insert dialog state
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertTable, setInsertTable] = useState<string | null>(null);
  const [insertSql, setInsertSql] = useState<string>("");
  // Column DDL dialogs
  const [newColOpen, setNewColOpen] = useState(false);
  const [dropColOpen, setDropColOpen] = useState(false);
  const [ddlTable, setDdlTable] = useState<string | null>(null);
  const [ddlColumn, setDdlColumn] = useState<string>("");
  const [ddlType, setDdlType] = useState<string>("text");
  // SQL preview confirm dialog
  const [confirmSqlOpen, setConfirmSqlOpen] = useState(false);
  const [confirmSql, setConfirmSql] = useState<string>("");
  const [confirmStage, setConfirmStage] = useState<0 | 1>(0);
  // UI state
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  // Persisted browse params per app
  const browseKey = `dbb:${appId}:browse`;
  const initialBrowse = (()=>{ try { return JSON.parse(localStorage.getItem(browseKey) || '{}'); } catch { return {}; }})();
  const [browseLimit, setBrowseLimit] = useState<number>(Number(initialBrowse.limit) || 100);
  const [browseOffset, setBrowseOffset] = useState<number>(Number(initialBrowse.offset) || 0);
  useEffect(()=>{ try { localStorage.setItem(browseKey, JSON.stringify({ limit: browseLimit, offset: browseOffset, table: lastResultTable })); } catch {} }, [browseKey, browseLimit, browseOffset, lastResultTable]);
  // Insert structured form values
  const [insertValues, setInsertValues] = useState<Record<string, any>>({});
  // removed single-purpose policies-only mode; we will offer a focus button instead
  const [schemaView, setSchemaView] = useState<"table" | "cards" | "tree">(() => {
    try {
      const raw = localStorage.getItem(`dbb:${appId}:schema_prefs`);
      const v = raw ? JSON.parse(raw).view : null;
      return v === "cards" || v === "tree" || v === "table" ? v : "table";
    } catch { return "table"; }
  });
  const policiesRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
  const resultsRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

  // Detect multi-statement to trigger confirm dialog
  const isMultiStatement = (sqlText: string) => {
    const statements = sqlText
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    return statements.length > 1;
  };
  const [deleteRows, setDeleteRows] = useState<Set<number>>(new Set());
  const anyDeletes = deleteRows.size > 0;
  
  // Branch management
  const [currentBranch, setCurrentBranch] = useState<string>("main");
  const [branches, setBranches] = useState<string[]>(["main"]);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  
  // Query history and saved queries
  const historyKey = `dbb:${appId}:query_history`;
  const savedQueriesKey = `dbb:${appId}:saved_queries`;
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(historyKey) || "[]"); } catch { return []; }
  });
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(() => {
    try { return JSON.parse(localStorage.getItem(savedQueriesKey) || "[]"); } catch { return []; }
  });
  const [showSaveQueryDialog, setShowSaveQueryDialog] = useState(false);
  const [saveQueryName, setSaveQueryName] = useState("");
  const [saveQueryDesc, setSaveQueryDesc] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  
  // Advanced UI state
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [sqlFormatter, setSqlFormatter] = useState<"none" | "basic">("basic");
  const [autoExecute, setAutoExecute] = useState(false);
  const [queryTimeout, setQueryTimeout] = useState(30);
  const [maxRows, setMaxRows] = useState(1000);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);
  
  // Table operations
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableColumns, setNewTableColumns] = useState<Array<{name: string; type: string; nullable: boolean}>>([{name: "id", type: "bigserial", nullable: false}]);
  
  // SQL Templates
  const sqlTemplates = [
    { name: "Select All", sql: "SELECT * FROM table_name LIMIT 100;", category: "Query" },
    { name: "Count Rows", sql: "SELECT COUNT(*) FROM table_name;", category: "Query" },
    { name: "Join Tables", sql: "SELECT a.*, b.*\nFROM table_a a\nINNER JOIN table_b b ON a.id = b.table_a_id;", category: "Query" },
    { name: "Group By", sql: "SELECT column_name, COUNT(*)\nFROM table_name\nGROUP BY column_name\nORDER BY COUNT(*) DESC;", category: "Query" },
    { name: "Create Table", sql: "CREATE TABLE table_name (\n  id BIGSERIAL PRIMARY KEY,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);", category: "Schema" },
    { name: "Add Column", sql: "ALTER TABLE table_name ADD COLUMN column_name TEXT;", category: "Schema" },
    { name: "Drop Column", sql: "ALTER TABLE table_name DROP COLUMN column_name;", category: "Schema" },
    { name: "Create Index", sql: "CREATE INDEX idx_name ON table_name(column_name);", category: "Schema" },
    { name: "Add Foreign Key", sql: "ALTER TABLE child_table\nADD CONSTRAINT fk_name\nFOREIGN KEY (parent_id)\nREFERENCES parent_table(id);", category: "Schema" },
    { name: "Enable RLS", sql: "ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;", category: "Security" },
    { name: "Create Policy", sql: "CREATE POLICY policy_name ON table_name\n  FOR SELECT\n  USING (auth.uid() = user_id);", category: "Security" },
    { name: "Grant Permissions", sql: "GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO authenticated;", category: "Security" },
    { name: "Create Function", sql: "CREATE OR REPLACE FUNCTION function_name()\nRETURNS trigger AS $$\nBEGIN\n  -- Your logic here\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;", category: "Advanced" },
    { name: "Create Trigger", sql: "CREATE TRIGGER trigger_name\nBEFORE INSERT OR UPDATE ON table_name\nFOR EACH ROW\nEXECUTE FUNCTION function_name();", category: "Advanced" },
    { name: "Full Text Search", sql: "SELECT * FROM table_name\nWHERE to_tsvector('english', column_name) @@ to_tsquery('search_term');", category: "Advanced" },
  ];
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  
  // Data visualization
  const [showDataViz, setShowDataViz] = useState(false);
  const [vizType, setVizType] = useState<"chart" | "stats">("stats");
  
  // AI Assistant
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysisType, setAiAnalysisType] = useState<"explain" | "optimize" | "generate" | "debug">("generate");
  
  // AI SQL Generation - Real implementation
  const generateSqlWithAI = async (prompt: string, type: string) => {
    if (!isAnyProviderSetup()) {
      setAiResponse("Please configure an AI provider in Settings first.");
      return;
    }
    
    setAiLoading(true);
    setAiResponse("");
    
    let systemPrompt = "";
    let userPrompt = "";
    
    if (type === "generate") {
      systemPrompt = `You are a PostgreSQL SQL generator. You MUST return ONLY the raw SQL query, nothing else.

Available tables: ${schemaTableNames.join(", ")}

STRICT RULES:
- Return ONLY the SQL query
- NO <think> tags
- NO <dyad-execute-sql> tags  
- NO markdown code blocks (no \`\`\`)
- NO explanations before or after
- NO descriptions
- NO natural language
- Just the raw SQL query that starts with SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER

Example good response: SELECT * FROM users WHERE id = 1
Example bad response: <think>...</think>SELECT * FROM users`;
      userPrompt = `Generate SQL for: ${prompt}`;
    } else if (type === "explain") {
      systemPrompt = "You are a PostgreSQL expert. Explain SQL queries in simple, clear terms. Break down what each part does. Return only plain text explanation, no XML tags or markdown.";
      userPrompt = `Explain this SQL query:\n\n${sql}`;
    } else if (type === "optimize") {
      systemPrompt = "You are a PostgreSQL performance expert. Analyze queries and suggest specific optimizations with index recommendations. Return only plain text suggestions, no XML tags or markdown.";
      userPrompt = `Analyze and optimize this query:\n\n${sql}\n\nAvailable tables: ${schemaTableNames.join(", ")}`;
    } else if (type === "debug") {
      systemPrompt = "You are a PostgreSQL expert. Debug SQL errors and provide corrected versions with clear explanations. Return only plain text with the fixed SQL and explanation, no XML tags or markdown.";
      userPrompt = `Debug this SQL error:\n\nQuery: ${sql}\nError: ${execError || "Unknown error"}\n\nProvide the fixed SQL and explanation.`;
    }
    
    try {
      // Create a temporary chat for AI analysis
      const tempChatId = await IpcClient.getInstance().createChat(appId);
      
      let fullResponse = "";
      
      // Stream the AI response
      IpcClient.getInstance().streamMessage(
        `${systemPrompt}\n\n${userPrompt}`,
        {
          chatId: tempChatId,
          selectedComponent: null,
          onUpdate: (messages: any[]) => {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              fullResponse = lastMessage.content;
              setAiResponse(fullResponse);
            }
          },
          onEnd: () => {
            setAiLoading(false);
            
            // For generate type, extract and load SQL
            if (type === "generate" && fullResponse) {
              let extractedSql = fullResponse;
              
              // Remove <think> tags if present
              extractedSql = extractedSql.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
              
              // Remove XML tags if present (dyad-execute-sql, dyad-chat-summary)
              extractedSql = extractedSql.replace(/<dyad-execute-sql[^>]*>([\s\S]*?)<\/dyad-execute-sql>/g, '$1');
              extractedSql = extractedSql.replace(/<dyad-chat-summary>[\s\S]*?<\/dyad-chat-summary>/g, '');
              extractedSql = extractedSql.replace(/<\/?[^>]+(>|$)/g, ''); // Remove any remaining XML/HTML tags
              
              // Remove markdown code blocks if present
              const sqlMatch = extractedSql.match(/```(?:sql)?\n([\s\S]*?)\n```/);
              if (sqlMatch) {
                extractedSql = sqlMatch[1].trim();
              }
              
              // Clean up any remaining markdown
              extractedSql = extractedSql
                .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                .trim();
              
              // Extract just the SQL statement (first line that looks like SQL)
              const lines = extractedSql.split('\n');
              const sqlLines = lines.filter(line => {
                const upper = line.trim().toUpperCase();
                return upper.startsWith('SELECT') || 
                       upper.startsWith('INSERT') || 
                       upper.startsWith('UPDATE') || 
                       upper.startsWith('DELETE') || 
                       upper.startsWith('CREATE') || 
                       upper.startsWith('ALTER') ||
                       upper.startsWith('WITH') ||
                       (line.trim() && !upper.startsWith('//') && !upper.startsWith('--'));
              });
              
              if (sqlLines.length > 0) {
                extractedSql = sqlLines.join('\n').trim();
                setSql(extractedSql);
                
                // Close dialog and focus on query section
                setShowAiAssistant(false);
                setOpenAccordions((prev) => Array.from(new Set([...prev, "query"])));
                setAiPrompt("");
                setAiResponse("");
              }
            }
            
            // Clean up temporary chat
            IpcClient.getInstance().deleteChat(tempChatId).catch(() => {});
          },
          onError: (error: string) => {
            setAiResponse(`Error: ${error}`);
            setAiLoading(false);
            IpcClient.getInstance().deleteChat(tempChatId).catch(() => {});
          },
        }
      );
    } catch (error: any) {
      setAiResponse(`Error: ${error.message || "Failed to connect to AI service"}`);
      setAiLoading(false);
    }
  };
  
  // Schema Diff & Version Control
  const [showSchemaDiff, setShowSchemaDiff] = useState(false);
  const [schemaSnapshots, setSchemaSnapshots] = useState<Array<{id: string; name: string; timestamp: number; schema: any}>>([]);
  
  // Performance Monitor
  const [showPerfMonitor, setShowPerfMonitor] = useState(false);
  const [queryStats, setQueryStats] = useState<{avgTime: number; slowQueries: number; totalQueries: number}>({avgTime: 0, slowQueries: 0, totalQueries: 0});
  
  // Collaboration
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [sharedQueries, setSharedQueries] = useState<Array<{id: string; name: string; sql: string; sharedBy: string}>>([]);

  useEffect(() => {
    let mounted = true;
    const fetchSchema = async () => {
      setLoadingSchema(true);
      setSchemaError(null);
      try {
        const res = await IpcClient.getInstance().getSupabaseSchema(appId);
        // Handler returns { schema } or { error }
        if (res?.error) {
          setSchemaError(String(res.error));
        } else if (res?.schema) {
          setSchema(res.schema);
        } else {
          setSchema(res);
        }
      } catch (e: any) {
        setSchemaError(e?.message || String(e));
      } finally {
        if (mounted) setLoadingSchema(false);
      }
    };
    fetchSchema();
    return () => {
      mounted = false;
    };
  }, [appId]);

  const pretty = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const schemaGroups = useMemo(() => {
    // Expecting an array of rows like [{ result_type: 'tables', data: 'json-string' }, ...]
    // but the management client may already return structured objects.
    const groups: Record<string, any[]> = {};
    if (!schema) return groups;

    const rows = Array.isArray(schema) ? schema : schema?.rows || schema?.data || [];
    if (!Array.isArray(rows)) return groups;

    for (const row of rows) {
      const type = row.result_type || row.resultType || row.type || "unknown";
      let data = row.data ?? row;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { /* keep as string */ }
      }
      if (!groups[type]) groups[type] = [];
      groups[type].push(data);
    }
    return groups;
  }, [schema]);

  // Accordion open state persisted per app
  const accordionKey = `dbb:${appId}:accordions`;
  const [openAccordions, setOpenAccordions] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(accordionKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return ["schema", "query", "result"]; // defaults (schema open)
  });
  useEffect(() => {
    try { localStorage.setItem(accordionKey, JSON.stringify(openAccordions)); } catch {}
  }, [accordionKey, openAccordions]);

  const runSql = async (text: string) => {
    setExecuting(true);
    setExecError(null);
    setResult(null);
    const startTime = Date.now();
    let success = false;
    let rowCount: number | undefined;
    
    try {
      const res = await IpcClient.getInstance().executeSupabaseSql(appId, text);
      if (res?.error) {
        setExecError(String(res.error));
      } else {
        setResult(res?.result ?? res);
        success = true;
        const resultRows = inferRows(res?.result ?? res);
        rowCount = resultRows.length;
      }
    } catch (e: any) {
      setExecError(e?.message || String(e));
    } finally {
      setExecuting(false);
      
      // Add to query history
      const historyItem: QueryHistoryItem = {
        id: `${Date.now()}-${Math.random()}`,
        sql: text,
        timestamp: startTime,
        success,
        rowCount
      };
      const newHistory = [historyItem, ...queryHistory].slice(0, 50); // Keep last 50
      setQueryHistory(newHistory);
      try { localStorage.setItem(historyKey, JSON.stringify(newHistory)); } catch {}
    }
    // naive parse for SELECT ... FROM <table>
    const m = /select\s+[\s\S]*?from\s+([a-zA-Z0-9_."]+)/i.exec(text);
    if (m && m[1]) setLastResultTable(m[1].replace(/"/g, ""));
  };

  const seedRecipes: { title: string; sql: string; description?: string }[] = [
    {
      title: "Create sample table",
      sql: `BEGIN;
CREATE TABLE IF NOT EXISTS public.sample (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMIT;`,
      description: "Creates a simple public.sample table.",
    },
    {
      title: "Insert sample rows",
      sql: `BEGIN;
INSERT INTO public.sample (name) VALUES ('Alice'), ('Bob'), ('Carol');
COMMIT;`,
      description: "Seeds three demo rows into public.sample.",
    },
    {
      title: "Rollback example (preview only)",
      sql: `BEGIN;
-- your changes here
ROLLBACK;`,
      description: "Preview transactional changes without persisting.",
    },
  ];

  // Policies (RLS) warning
  const policies = useMemo(() => schemaGroups["policies"] || [], [schemaGroups]);
  const schemaColumns = useMemo<any[]>(() => {
    // Extract columns metadata from multiple possible shapes
    const list: any[] = [];
    const directCols = schemaGroups["columns"] || schemaGroups["table_columns"] || [];
    const pushCol = (tableName: string, c: any) => {
      // Normalize to a common shape
      list.push({
        table: tableName || c.table || c.table_name,
        table_name: tableName || c.table || c.table_name,
        column: c.column || c.column_name || c.name,
        column_name: c.column || c.column_name || c.name,
        data_type: c.data_type || c.udt_name || c.type,
        udt_name: c.udt_name,
        type: c.type,
        is_nullable: c.is_nullable,
        nullable: c.nullable,
        column_default: c.column_default ?? c.default,
        default: c.default,
      });
    };
    // 1) Collect any direct column entries
    for (const groupItem of directCols as any[]) {
      if (Array.isArray(groupItem)) {
        for (const c of groupItem) pushCol(c.table || c.table_name || "", c);
      } else if (groupItem && typeof groupItem === "object") {
        pushCol(groupItem.table || groupItem.table_name || "", groupItem);
      }
    }
    // 2) If none found, derive from tables group which often embeds columns
    if (list.length === 0 && Array.isArray(schemaGroups["tables"])) {
      for (const t of schemaGroups["tables"]) {
        const tName = t?.name || t?.table || t?.table_name || t?.relation || "";
        const cols = t?.columns || t?.Cols || t?.fields || [];
        if (Array.isArray(cols)) {
          for (const c of cols) pushCol(tName, c);
        }
      }
    }
    return list;
  }, [schemaGroups]);

  // Schema table filters/sort
  const schemaPrefsKey = `dbb:${appId}:schema_prefs`;
  const loadSchemaPrefs = () => {
    try { return JSON.parse(localStorage.getItem(schemaPrefsKey) || "{}"); } catch { return {}; }
  };
  const initialPrefs = loadSchemaPrefs();
  const [schemaSearch, setSchemaSearch] = useState<string>(initialPrefs.search ?? "");
  const [schemaTableFilter, setSchemaTableFilter] = useState<string>(initialPrefs.table ?? "all");
  const [schemaSortCol, setSchemaSortCol] = useState<"table"|"column"|"type">(initialPrefs.sortCol ?? "table");
  const [schemaSortDir, setSchemaSortDir] = useState<"asc"|"desc">(initialPrefs.sortDir ?? "asc");
  const [schemaTypeFilters, setSchemaTypeFilters] = useState<string[]>(initialPrefs.typeFilters ?? []);
  useEffect(() => {
    try {
      localStorage.setItem(schemaPrefsKey, JSON.stringify({
        search: schemaSearch,
        table: schemaTableFilter,
        sortCol: schemaSortCol,
        sortDir: schemaSortDir,
        typeFilters: schemaTypeFilters,
        view: schemaView,
      }));
    } catch {}
  }, [schemaPrefsKey, schemaSearch, schemaTableFilter, schemaSortCol, schemaSortDir, schemaTypeFilters, schemaView]);
  const schemaTableNames = useMemo(() => Array.from(new Set(schemaColumns.map((c:any)=> c.table || c.table_name))).filter(Boolean), [schemaColumns]);
  const schemaTypes = useMemo(() => Array.from(new Set(schemaColumns.map((c:any)=> (c.data_type || c.type || "").toString().toLowerCase()))).filter(Boolean), [schemaColumns]);
  const schemaRows = useMemo(() => {
    const rows = schemaColumns.map((c:any) => ({
      table: c.table || c.table_name || c.table_schema || "",
      column: c.column || c.column_name || c.name || "",
      type: c.data_type || c.udt_name || c.type || "",
      nullable: c.is_nullable ?? c.nullable ?? "",
      default: c.column_default ?? c.default ?? "",
    }));
    let list = rows;
    if (schemaTableFilter !== "all") list = list.filter(r => String(r.table) === schemaTableFilter);
    if (schemaSearch.trim()) {
      const q = schemaSearch.toLowerCase();
      list = list.filter(r =>
        String(r.table).toLowerCase().includes(q) ||
        String(r.column).toLowerCase().includes(q) ||
        String(r.type).toLowerCase().includes(q)
      );
    }
    if (schemaTypeFilters.length > 0) {
      const set = new Set(schemaTypeFilters.map((t)=>t.toLowerCase()));
      list = list.filter(r => set.has(String(r.type).toLowerCase()));
    }
    list = [...list].sort((a,b)=>{
      const av = String(a[schemaSortCol]||"").toLowerCase();
      const bv = String(b[schemaSortCol]||"").toLowerCase();
      const cmp = av.localeCompare(bv);
      return schemaSortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [schemaColumns, schemaTableFilter, schemaSearch, schemaSortCol, schemaSortDir]);

  // Grouped rows by table for expanders
  const schemaRowsByTable = useMemo(() => {
    const map: Record<string, typeof schemaRows> = {};
    for (const r of schemaRows) {
      if (!map[r.table]) map[r.table] = [] as any;
      map[r.table].push(r);
    }
    return map;
  }, [schemaRows]);

  // Row count cache
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
  const fetchRowCount = async (table: string) => {
    if (rowCounts[table] != null) return;
    try {
      const res = await IpcClient.getInstance().executeSupabaseSql(appId, `SELECT count(*)::int AS c FROM ${table};`);
      const cnt = Array.isArray(res?.result?.rows) ? (res.result.rows[0]?.c ?? res.result.rows[0]?.count) : Array.isArray(res?.rows) ? (res.rows[0]?.c ?? res.rows[0]?.count) : 0;
      setRowCounts((m)=> ({...m, [table]: Number(cnt)||0 }));
    } catch {}
  };

  const openResultsWithTable = async (tableName: string) => {
    const sqlText = `SELECT * FROM ${tableName} LIMIT ${browseLimit} OFFSET ${browseOffset};`;
    setSql(sqlText);
    await runSql(sqlText);
    setOpenAccordions((prev) => Array.from(new Set([...prev, "result"])));
    setLastResultTable(tableName);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  // Persist open tables in Schema view
  const openTablesKey = `dbb:${appId}:schema_open_tables`;
  const [openTables, setOpenTables] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(openTablesKey) || "[]"); } catch { return []; }
  });
  useEffect(()=>{
    try { localStorage.setItem(openTablesKey, JSON.stringify(openTables)); } catch {}
  }, [openTablesKey, openTables]);

  // Table rendering helpers
  const inferRows = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const rows = useMemo(() => inferRows(result), [result]);
  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const v1 = a?.[sortCol as any];
      const v2 = b?.[sortCol as any];
      const s1 = typeof v1 === "string" ? v1 : JSON.stringify(v1);
      const s2 = typeof v2 === "string" ? v2 : JSON.stringify(v2);
      return sortDir === "asc" ? s1.localeCompare(s2) : s2.localeCompare(s1);
    });
    return copy;
  }, [rows, sortCol, sortDir]);
  const pagedRows = useMemo(
    () => sortedRows.slice((page - 1) * pageSize, page * pageSize),
    [sortedRows, page]
  );

  // Results edit mode (beta)
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState<Record<number, Record<string, any>>>({});
  const hasIdColumn = useMemo(() => columns.includes("id") || columns.includes("ID") || columns.includes("Id"), [columns]);
  const anyEdits = useMemo(() => Object.keys(edited).length > 0, [edited]);
  const buildUpdateSQL = () => {
    const table = lastResultTable;
    if (!table) return "";
    const stmts: string[] = ["BEGIN;"];
    // deletes first
    for (const idx of Array.from(deleteRows)) {
      const original = pagedRows[idx];
      if (!original) continue;
      const idVal = original.id ?? original.ID ?? original.Id;
      if (idVal === undefined) continue;
      const idLit = typeof idVal === "number" ? idVal : `'${String(idVal).replace(/'/g, "''")}'`;
      stmts.push(`DELETE FROM ${table} WHERE id = ${idLit};`);
    }
    for (const [rowIdxStr, changes] of Object.entries(edited)) {
      const rowIdx = Number(rowIdxStr);
      const original = pagedRows[rowIdx];
      if (!original) continue;
      const idVal = original.id ?? original.ID ?? original.Id;
      if (idVal === undefined) continue;
      const sets: string[] = [];
      for (const [col, val] of Object.entries(changes)) {
        let v = val;
        if (v === null || v === undefined) {
          sets.push(`${col} = NULL`);
        } else if (typeof v === "number") {
          sets.push(`${col} = ${v}`);
        } else if (typeof v === "boolean") {
          sets.push(`${col} = ${v ? "TRUE" : "FALSE"}`);
        } else {
          const s = String(v).replace(/'/g, "''");
          sets.push(`${col} = '${s}'`);
        }
      }
      if (sets.length > 0) {
        const idLit = typeof idVal === "number" ? idVal : `'${String(idVal).replace(/'/g, "''")}'`;
        stmts.push(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ${idLit};`);
      }
    }
    stmts.push("COMMIT;");
    return stmts.join("\n");
  };

  // Value formatting helpers
  const isIsoDate = (val: any) =>
    typeof val === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);
  const looksLikePgArray = (val: any) => typeof val === "string" && val.startsWith("{") && val.endsWith("}");
  const parsePgArray = (s: string) => {
    // naive parser for {a,b,c} without quotes/escapes
    const inner = s.slice(1, -1);
    if (!inner) return [] as string[];
    return inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((x) => x.replace(/^"|"$/g, ""));
  };
  const isGeometryLike = (val: any) => typeof val === "string" && /^(\(|\[|\{).*(\)|\]|\})$/.test(val) && /,/.test(val);
  const formatValue = (val: any) => {
    if (val == null) return "";
    if (isIsoDate(val)) {
      try {
        return new Date(val).toLocaleString();
      } catch {
        return val;
      }
    }
    if (looksLikePgArray(val)) {
      try { return JSON.stringify(parsePgArray(val)); } catch { return val; }
    }
    if (isGeometryLike(val)) {
      return val; // keep raw but allow copy
    }
    if (typeof val === "object") return pretty(val);
    return String(val);
  };

  // Export helpers
  const exportJSON = () => {
    const data = JSON.stringify(sortedRows, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportCSV = () => {
    if (exportCols.length === 0) return;
    const header = exportCols.join(",");
    const rowsToUse = sortedRows.slice(0, exportLimit);
    const lines = rowsToUse.map((r) =>
      exportCols
        .map((c) => {
          let v = r?.[c];
          if (typeof v === "object") v = JSON.stringify(v);
          if (v == null) v = "";
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // SQL Formatter (basic)
  const formatSql = (sql: string): string => {
    if (sqlFormatter === "none") return sql;
    // Basic formatting
    return sql
      .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON|AND|OR|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|INSERT INTO|UPDATE|DELETE|CREATE|ALTER|DROP|BEGIN|COMMIT|ROLLBACK)\b/gi, (match) => match.toUpperCase())
      .replace(/,\s*/g, ", ")
      .trim();
  };
  
  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };
  
  // Save query
  const saveQuery = () => {
    if (!saveQueryName.trim()) return;
    const newQuery: SavedQuery = {
      id: `${Date.now()}-${Math.random()}`,
      name: saveQueryName,
      sql: sql,
      description: saveQueryDesc,
      createdAt: Date.now()
    };
    const updated = [newQuery, ...savedQueries];
    setSavedQueries(updated);
    try { localStorage.setItem(savedQueriesKey, JSON.stringify(updated)); } catch {}
    setShowSaveQueryDialog(false);
    setSaveQueryName("");
    setSaveQueryDesc("");
  };
  
  // Delete saved query
  const deleteSavedQuery = (id: string) => {
    const updated = savedQueries.filter(q => q.id !== id);
    setSavedQueries(updated);
    try { localStorage.setItem(savedQueriesKey, JSON.stringify(updated)); } catch {}
  };
  
  // Load query from history or saved
  const loadQuery = (queryText: string) => {
    setSql(queryText);
    setOpenAccordions((prev) => Array.from(new Set([...prev, "query"])));
  };

  // infer simple column types for badges (number/date/json/text)
  const inferTypeFromSchema = (columnName: string): string | null => {
    const match = schemaColumns.find((c: any) => (c.column || c.column_name || c.name) === columnName);
    const t = (match as any)?.data_type || (match as any)?.udt_name || (match as any)?.type;
    if (!t) return null;
    const lower = String(t).toLowerCase();
    if (lower.includes("json")) return "json";
    if (lower.includes("int") || lower.includes("numeric") || lower.includes("float") || lower.includes("double")) return "number";
    if (lower.includes("bool")) return "boolean";
    if (lower.includes("timestamp") || lower.includes("date") || lower.includes("time")) return "date";
    if (lower.endsWith("[]")) return "array";
    if (["point","line","lseg","box","path","polygon","circle"].some((g) => lower.includes(g))) return "geometry";
    return "text";
  };
  const inferType = (val: any, col: string): string => {
    const schemaT = inferTypeFromSchema(col);
    if (schemaT) return schemaT;
    if (val === null || val === undefined) return "text";
    if (typeof val === "number") return "number";
    if (typeof val === "object") return "json";
    if (isIsoDate(val)) return "date";
    if (looksLikePgArray(val)) return "array";
    if (isGeometryLike(val)) return "geometry";
    return "text";
  };
  const columnTypes = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of columns) {
      let t = "text";
      for (const r of rows) {
        if (r && r.hasOwnProperty(c)) {
          t = inferType(r[c], c);
          if (t !== "text") break;
        }
      }
      map[c] = t;
    }
    return map;
  }, [columns, rows]);

  // UI state for export controls
  const [exportCols, setExportCols] = useState<string[]>([]);
  const [exportLimit, setExportLimit] = useState<number>(1000);
  useEffect(() => {
    setExportCols(columns);
  }, [columns]);

  // Policies table helpers
  const PoliciesRow = ({ policy, index }: { policy: any; index: number }) => {
    const [expanded, setExpanded] = useState(false);
    const raw = policy?.definition ?? "-";
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const threshold = 180;
    const isLong = text.length > threshold;
    const shown = expanded || !isLong ? text : text.slice(0, threshold) + "…";
    return (
      <tr className="border-b border-white/30 dark:border-white/5 align-top">
        <td className="py-1 pr-4">{policy?.name ?? "-"}</td>
        <td className="py-1 pr-4">{policy?.table ?? "-"}</td>
        <td className="py-1 pr-4">{policy?.command ?? "-"}</td>
        <td className="py-1 pr-4">
          <pre className="whitespace-pre-wrap break-words inline">{shown}</pre>
          {isLong && (
            <button
              type="button"
              className="ml-2 text-[11px] underline opacity-80 hover:opacity-100"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </td>
      </tr>
    );
  };

  const PoliciesTable = ({ policies }: { policies: any[] }) => (
    <table className="w-full text-xs">
      <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur">
        <tr className="text-left border-b border-white/40 dark:border-white/10">
          <th className="py-1 pr-4 font-semibold">Name</th>
          <th className="py-1 pr-4 font-semibold">Table</th>
          <th className="py-1 pr-4 font-semibold">Command</th>
          <th className="py-1 pr-4 font-semibold">Definition</th>
        </tr>
      </thead>
      <tbody>
        {policies.map((p: any, idx: number) => (
          <PoliciesRow key={idx} policy={p} index={idx} />
        ))}
      </tbody>
    </table>
  );

  // Policies filters and sorting
  const [polSearch, setPolSearch] = useState("");
  const [polTable, setPolTable] = useState("all");
  const [polCmd, setPolCmd] = useState("all");
  const [polSortCol, setPolSortCol] = useState<"name"|"table"|"command">("name");
  const [polSortDir, setPolSortDir] = useState<"asc"|"desc">("asc");
  const policyTables = useMemo(() => Array.from(new Set((policies||[]).map((p:any)=>p?.table).filter(Boolean))), [policies]);
  const policyCmds = useMemo(() => Array.from(new Set((policies||[]).map((p:any)=>p?.command).filter(Boolean))), [policies]);
  const policiesFilteredSorted = useMemo(() => {
    let list = [...(policies||[])];
    if (polTable !== "all") list = list.filter((p:any)=>String(p?.table||"")===polTable);
    if (polCmd !== "all") list = list.filter((p:any)=>String(p?.command||"")===polCmd);
    if (polSearch.trim()) {
      const q = polSearch.toLowerCase();
      list = list.filter((p:any)=>
        String(p?.name||"").toLowerCase().includes(q) ||
        String(p?.table||"").toLowerCase().includes(q) ||
        String(p?.command||"").toLowerCase().includes(q) ||
        String(p?.definition||"").toLowerCase().includes(q)
      );
    }
    list.sort((a:any,b:any)=>{
      const av = String(a?.[polSortCol]||"").toLowerCase();
      const bv = String(b?.[polSortCol]||"").toLowerCase();
      const cmp = av.localeCompare(bv);
      return polSortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [policies, polTable, polCmd, polSearch, polSortCol, polSortDir]);

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 space-y-4">
      {/* Header Section with better alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold glass-contrast-text">Database Browser</h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Comprehensive Supabase database management with schema browsing, SQL execution, and branch management.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-white/5">
            <GitBranch className="h-3.5 w-3.5" />
            <select 
              className="bg-transparent text-xs font-medium outline-none cursor-pointer"
              value={currentBranch}
              onChange={(e) => setCurrentBranch(e.target.value)}
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={() => setShowBranchDialog(true)}
              title="Create new branch"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Density Toggle */}
          <div className="hidden sm:flex items-center text-xs border rounded-lg overflow-hidden">
            <button
              type="button"
              className={`px-3 py-1.5 transition-colors ${density === "comfortable" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "hover:bg-white/5"}`}
              onClick={() => setDensity("comfortable")}
              title="Comfortable row height"
            >
              Comfort
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 transition-colors ${density === "compact" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "hover:bg-white/5"}`}
              onClick={() => setDensity("compact")}
              title="Compact row height"
            >
              Compact
            </button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Quick Actions Toolbar */}
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg border border-white/10 bg-white/5">
        <div className="text-xs font-medium text-muted-foreground mr-2">Quick Actions:</div>
        {isAnyProviderSetup() && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50"
            onClick={() => setShowAiAssistant(true)}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            AI Assistant
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2"
          onClick={() => setShowTemplatesDialog(true)}
        >
          <Database className="h-3.5 w-3.5" />
          SQL Templates
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2"
          onClick={() => setShowCreateTableDialog(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Table
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2"
          onClick={() => {
            setSql("SELECT table_name, table_type\\nFROM information_schema.tables\\nWHERE table_schema = 'public'\\nORDER BY table_name;");
            setOpenAccordions((prev) => Array.from(new Set([...prev, "query"])));
          }}
        >
          <Search className="h-3.5 w-3.5" />
          Analyze Schema
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2"
          onClick={() => {
            const tables = schemaTableNames.join(", ");
            setSql(`-- Database Overview\\n-- Tables: ${tables || "none"}\\n-- Total columns: ${schemaColumns.length}\\n\\nSELECT * FROM information_schema.columns WHERE table_schema = 'public';`);
            setOpenAccordions((prev) => Array.from(new Set([...prev, "query"])));
          }}
        >
          <TableIcon className="h-3.5 w-3.5" />
          Database Info
        </Button>
      </div>
      
      {/* RLS Warning Banner */}
      {policies.length > 0 && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Row Level Security Detected</div>
              <div className="text-xs text-yellow-800/90 dark:text-yellow-300 mt-1">
                {policies.length} RLS {policies.length === 1 ? 'policy' : 'policies'} active. Queries may be restricted. Review policies in the dedicated section below.
              </div>
            </div>
          </div>
        </div>
      )}

      <Accordion type="multiple" value={openAccordions} onValueChange={(v) => setOpenAccordions(v as string[])}>

        <AccordionItem value="schema">
          <AccordionTrigger className="cursor-pointer">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400"><TableIcon className="h-3.5 w-3.5"/> Schema</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 max-h-[60vh] overflow-y-auto space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="opacity-70">View:</span>
            <div className="border rounded overflow-hidden">
              <button className={`px-2 py-0.5 ${schemaView === "table" ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setSchemaView("table")}>Table</button>
              <button className={`px-2 py-0.5 ${schemaView === "cards" ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setSchemaView("cards")}>Cards</button>
              <button className={`px-2 py-0.5 ${schemaView === "tree" ? "bg-white/10" : "hover:bg-white/5"}`} onClick={() => setSchemaView("tree")}>Tree</button>
            </div>
          </div>
          {loadingSchema ? (
            <div className="text-sm text-muted-foreground">Loading schema…</div>
          ) : schemaError ? (
            <div className="text-sm text-red-600 dark:text-red-400">{schemaError}</div>
          ) : !schema ? (
            <div className="text-sm text-muted-foreground">No schema data.</div>
          ) : (
            schemaView === "table" ? (
              <div className="text-xs space-y-2">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[220px]">
                    <label className="block mb-1 opacity-70">Search</label>
                    <input className="w-full border rounded px-2 py-1 bg-transparent" value={schemaSearch} onChange={(e)=>setSchemaSearch(e.target.value)} placeholder="Find table, column, type" />
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Table</label>
                    <select className="border rounded px-2 py-1 bg-transparent" value={schemaTableFilter} onChange={(e)=>setSchemaTableFilter(e.target.value)}>
                      <option value="all">All</option>
                      {schemaTableNames.map((t:any)=> (<option key={String(t)} value={String(t)}>{String(t)}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Sort</label>
                    <div className="flex items-center gap-1">
                      <select className="border rounded px-2 py-1 bg-transparent" value={schemaSortCol} onChange={(e)=>setSchemaSortCol(e.target.value as any)}>
                        <option value="table">Table</option>
                        <option value="column">Column</option>
                        <option value="type">Type</option>
                      </select>
                      <button className="border rounded px-2 py-1" onClick={()=>setSchemaSortDir(d=> d==='asc'?'desc':'asc')}>{schemaSortDir.toUpperCase()}</button>
                    </div>
                  </div>
                </div>
                {schemaTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {schemaTypes.map((t)=>{
                      const active = schemaTypeFilters.includes(t);
                      return (
                        <button key={t} className={`text-[11px] px-2 py-0.5 rounded border ${active? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={()=>setSchemaTypeFilters((prev)=> active? prev.filter(x=>x!==t) : [...prev, t])}>
                          {t}
                        </button>
                      );
                    })}
                    {schemaTypeFilters.length>0 && (
                      <button className="text-[11px] px-2 py-0.5 rounded border hover:bg-white/5" onClick={()=>setSchemaTypeFilters([])}>Clear</button>
                    )}
                  </div>
                )}
                <div className={`rounded-xl border border-white/10 p-2 space-y-2 w-full overflow-x-auto ${density==='compact' ? '[&_td]:py-0.5 [&_th]:py-0.5 text-[11px]' : ''}`}>
                  {Object.entries(schemaRowsByTable).map(([t, cols])=>{
                    const isOpen = openTables.includes(t);
                    return (
                      <div key={t} className="rounded-lg border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-2 py-1.5 bg-white/5">
                          <button className="inline-flex items-center gap-2 font-semibold" onClick={()=> { const nextOpen = !isOpen; setOpenTables((prev)=> nextOpen ? [...prev, t] : prev.filter(x=>x!==t)); if (!isOpen) fetchRowCount(t); }}>
                            <TableIcon className="h-3.5 w-3.5" /> {t}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] opacity-70">{rowCounts[t] != null ? `${rowCounts[t]} rows` : ''}</span>
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openResultsWithTable(t)}><Play className="h-3 w-3 mr-1"/>Browse</Button>
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setInsertTable(t);
                              const defs: Record<string, any> = {};
                              (schemaRowsByTable[t]||[]).forEach((c:any)=>{
                                const typ = String(c.type||'').toLowerCase();
                                if (typ.includes('int') || typ.includes('numeric') || typ.includes('float')) defs[c.column] = 0;
                                else if (typ.includes('bool')) defs[c.column] = false;
                                else if (typ.includes('timestamp') || typ.includes('date')) defs[c.column] = new Date().toISOString();
                                else defs[c.column] = '';
                              });
                              setInsertValues(defs);
                              // initial SQL preview
                              const cols = Object.keys(defs);
                              const vals = cols.map((col)=>{
                                const v = (defs as any)[col];
                                if (v === null) return 'NULL';
                                if (typeof v === 'number') return String(v);
                                if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
                                return `'${String(v).replace(/'/g, "''")}'`;
                              });
                              setInsertSql(`INSERT INTO ${t} (${cols.join(', ')})\nVALUES (${vals.join(', ')});`);
                              setInsertOpen(true); }}><Plus className="h-3 w-3 mr-1"/>Insert</Button>
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setDdlTable(t); setNewColOpen(true); }}><Columns className="h-3 w-3 mr-1"/>New Column</Button>
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { setDdlTable(t); setDropColOpen(true); }}><Trash2 className="h-3 w-3 mr-1"/>Drop Column</Button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="overflow-auto">
                            <table className="w-full text-xs">
                              <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur">
                                <tr className="text-left border-b border-white/10">
                                  <th className="py-1 pr-4">Column</th>
                                  <th className="py-1 pr-4">Type</th>
                                  <th className="py-1 pr-4">Nullable</th>
                                  <th className="py-1 pr-4">Default</th>
                                  <th className="py-1 pr-2 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cols.map((r:any, idx:number)=> (
                                  <tr key={idx} className="group border-b border-white/5">
                                    <td className="py-1 pr-4">{r.column}</td>
                                    <td className="py-1 pr-4">{r.type}</td>
                                    <td className="py-1 pr-4">{String(r.nullable ?? "")}</td>
                                    <td className="py-1 pr-4"><pre className="whitespace-pre-wrap break-words">{String(r.default ?? "")}</pre></td>
                                    <td className="py-1 pr-2 text-right">
                                      <button
                                        type="button"
                                        title="Drop column"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity border rounded px-1 py-0.5 hover:bg-white/5 inline-flex items-center"
                                        onClick={()=>{ setDdlTable(t); setDdlColumn(r.column); setDropColOpen(true); }}
                                      >
                                        <Trash2 className="h-3 w-3"/>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : schemaView === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(schemaGroups).map(([group, items]) => (
                  <div key={group} className="rounded-md border border-white/60 dark:border-white/10">
                    <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide bg-white/50 dark:bg-white/5 glass-contrast-text">{group}</div>
                    <pre className="text-xs p-2 overflow-auto max-h-56 whitespace-pre-wrap break-words">{pretty(items)}</pre>
                  </div>
                ))}
                {Object.keys(schemaGroups).length === 0 && (
                  <pre className="text-xs p-2 overflow-auto max-h-56 whitespace-pre-wrap break-words border rounded-md">{pretty(schema)}</pre>
                )}
              </div>
            ) : (
              <div className="text-xs">
                {Object.entries(schemaGroups).map(([group, items]) => (
                  <details key={group} className="border-b border-white/10 py-2">
                    <summary className="cursor-pointer uppercase tracking-wide text-[11px] glass-contrast-text">{group}</summary>
                    <pre className="mt-1 p-2 rounded border border-white/10 overflow-auto max-h-56 whitespace-pre-wrap break-words">{pretty(items)}</pre>
                  </details>
                ))}
              </div>
            )
          )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Policies Section */}
        {policies.length > 0 && (
          <AccordionItem value="policies">
            <AccordionTrigger className="cursor-pointer">
              <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Policies</div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3">
                <div className="flex flex-wrap gap-2 items-end mb-2 text-xs">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block mb-1 opacity-70">Search</label>
                    <input
                      className="w-full border rounded px-2 py-1 bg-transparent"
                      placeholder="Search name, table, command, definition"
                      value={polSearch}
                      onChange={(e)=>setPolSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Table</label>
                    <select className="border rounded px-2 py-1 bg-transparent" value={polTable} onChange={(e)=>setPolTable(e.target.value)}>
                      <option value="all">All</option>
                      {policyTables.map((t)=> (<option key={String(t)} value={String(t)}>{String(t)}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Command</label>
                    <select className="border rounded px-2 py-1 bg-transparent" value={polCmd} onChange={(e)=>setPolCmd(e.target.value)}>
                      <option value="all">All</option>
                      {policyCmds.map((t)=> (<option key={String(t)} value={String(t)}>{String(t)}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 opacity-70">Sort</label>
                    <div className="flex items-center gap-1">
                      <select className="border rounded px-2 py-1 bg-transparent" value={polSortCol} onChange={(e)=>setPolSortCol(e.target.value as any)}>
                        <option value="name">Name</option>
                        <option value="table">Table</option>
                        <option value="command">Command</option>
                      </select>
                      <button className="border rounded px-2 py-1" onClick={()=>setPolSortDir(d=> d==='asc'?'desc':'asc')}>{polSortDir.toUpperCase()}</button>
                    </div>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto rounded-md border border-white/10">
                  <PoliciesTable policies={policiesFilteredSorted} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Query Runner */}
        <AccordionItem value="query">
          <AccordionTrigger className="cursor-pointer">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <TerminalSquare className="h-3.5 w-3.5"/> Query Runner
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              {/* Split Panel Layout: Left = Editor, Right = Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
                {/* LEFT PANEL: Query Editor */}
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sql-editor" className="text-sm font-medium flex items-center gap-2">
                      <TerminalSquare className="h-4 w-4" />
                      SQL Editor
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 gap-1"
                        onClick={() => copyToClipboard(sql)}
                        title="Copy SQL"
                      >
                        {copiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 gap-1"
                        onClick={() => setSql(formatSql(sql))}
                        title="Format SQL"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 gap-1"
                        onClick={() => setShowTemplatesDialog(true)}
                        title="SQL Templates"
                      >
                        <Database className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 gap-1"
                        onClick={() => setShowSaveQueryDialog(true)}
                        disabled={!sql.trim()}
                        title="Save query"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    id="sql-editor"
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    className="font-mono text-xs flex-1 min-h-[300px] resize-none"
                    placeholder="SELECT * FROM public.sample LIMIT 50;"
                  />
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => runSql(sql)} 
                        disabled={executing || !sql.trim()}
                        className="gap-2"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {executing ? "Running…" : "Run Query"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSql("")} disabled={!sql.trim()}>Clear</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowSettingsDialog(true)}
                        title="Query Settings"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {sql.trim() ? `${sql.length} chars` : ""}
                    </div>
                  </div>
                  
                  {/* Query History and Saved Queries - Stacked */}
                  <div className="space-y-3 pt-2">
                    {/* Query History */}
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <History className="h-3.5 w-3.5" />
                          History
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 px-1 text-[10px]"
                          onClick={() => {
                            setQueryHistory([]);
                            try { localStorage.removeItem(historyKey); } catch {}
                          }}
                          disabled={queryHistory.length === 0}
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="max-h-[120px] overflow-y-auto space-y-1">
                        {queryHistory.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground text-center py-2">No history</div>
                        ) : (
                          queryHistory.slice(0, 5).map((item) => (
                            <button
                              key={item.id}
                              className="w-full text-left p-1.5 rounded border border-white/5 hover:bg-white/5 transition-colors"
                              onClick={() => loadQuery(item.sql)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <pre className="text-[10px] font-mono flex-1 truncate">{item.sql.split('\n')[0]}</pre>
                                <div className={`text-[9px] px-1 py-0.5 rounded ${item.success ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                  {item.success ? '✓' : '✗'}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Saved Queries */}
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="flex items-center gap-2 text-xs font-medium mb-2">
                        <Save className="h-3.5 w-3.5" />
                        Saved
                      </div>
                      <div className="max-h-[120px] overflow-y-auto space-y-1">
                        {savedQueries.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground text-center py-2">No saved queries</div>
                        ) : (
                          savedQueries.slice(0, 5).map((query) => (
                            <div
                              key={query.id}
                              className="p-1.5 rounded border border-white/5 hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  className="flex-1 text-left"
                                  onClick={() => loadQuery(query.sql)}
                                >
                                  <div className="text-[10px] font-medium">{query.name}</div>
                                  <pre className="text-[9px] font-mono text-muted-foreground truncate">{query.sql.split('\n')[0]}</pre>
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={() => deleteSavedQuery(query.id)}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* RIGHT PANEL: Results */}
                <div className="flex flex-col space-y-3 border-l border-white/10 pl-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      Results
                    </Label>
                    {result && rows.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={exportCSV}>
                          <Download className="h-3 w-3 mr-1" />CSV
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={exportJSON}>
                          <Download className="h-3 w-3 mr-1" />JSON
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {execError ? (
                    <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-800 dark:text-red-200">Query Error</div>
                          <pre className="text-xs text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap break-words">{execError}</pre>
                        </div>
                      </div>
                    </div>
                  ) : result === null ? (
                    <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5">
                      <div className="text-center p-8">
                        <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">Run a query to see results</div>
                      </div>
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center rounded-lg border border-white/20 bg-white/5">
                      <div className="text-center p-8">
                        <div className="text-sm text-muted-foreground">Query executed successfully</div>
                        <div className="text-xs text-muted-foreground mt-1">No rows returned</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto rounded-lg border border-white/10">
                      <div className="text-xs text-muted-foreground px-3 py-2 border-b border-white/10 bg-white/5">
                        {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                      </div>
                      <div className="overflow-auto max-h-[500px]">
                        <table className={`w-full text-xs ${density === "compact" ? "text-[10px]" : ""}`}>
                          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                            <tr className="text-left border-b border-white/20">
                              {columns.map((c) => (
                                <th key={c} className="py-2 px-3 font-semibold">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:underline"
                                    onClick={() => {
                                      if (sortCol === c) {
                                        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                      } else {
                                        setSortCol(c);
                                        setSortDir("asc");
                                      }
                                    }}
                                  >
                                    {c}
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 border border-white/10">
                                      {columnTypes[c]}
                                    </span>
                                    {sortCol === c ? (sortDir === "asc" ? " ▲" : " ▼") : null}
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pagedRows.map((r, idx) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                {columns.map((c) => (
                                  <td key={c} className="py-1.5 px-3 align-top">
                                    {(() => {
                                      const v = r[c];
                                      const out = formatValue(v);
                                      if (typeof v === "object") {
                                        return <pre className="whitespace-pre-wrap break-words text-[10px]">{out as any}</pre>;
                                      }
                                      return out as any;
                                    })()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-white/5 text-xs">
                          <div>Page {page} / {totalPages}</div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-6" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                            <Button variant="outline" size="sm" className="h-6" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Results */}
        <AccordionItem value="result">
          <AccordionTrigger className="cursor-pointer">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400"><TableIcon className="h-3.5 w-3.5"/> Results</div>
          </AccordionTrigger>
          <AccordionContent>
            {result !== null && (
            <div className="rounded-md border border-white/60 dark:border-white/10" ref={(el)=> { resultsRef.current = el; }}>
              <div className="px-2 py-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide bg-white/50 dark:bg-white/5 glass-contrast-text">
                <div className="flex items-center gap-2">
                  <span>Result</span>
                  {lastResultTable && (
                    <>
                      <span className="opacity-70">for</span>
                      <select className="border rounded px-1 py-0.5 bg-transparent text-xs" value={lastResultTable} onChange={(e)=> openResultsWithTable(e.target.value)}>
                        {schemaTableNames.map((t)=> (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </>
                  )}
                  <span className="opacity-70">Limit</span>
                  <input type="number" className="w-16 border rounded px-1 py-0.5 bg-transparent" value={browseLimit} min={1}
                    onChange={(e)=>{ const lim = Math.max(1, Number(e.target.value)||1); setBrowseLimit(lim); if (lastResultTable) { setBrowseOffset(0); openResultsWithTable(lastResultTable); } }} />
                  <div className="flex items-center gap-1">
                    <button className="border rounded px-2 py-0.5 hover:bg-white/5" disabled={browseOffset<=0} onClick={()=>{ const next = Math.max(0, browseOffset - browseLimit); setBrowseOffset(next); if (lastResultTable) openResultsWithTable(lastResultTable); }}>Prev</button>
                    <button className="border rounded px-2 py-0.5 hover:bg-white/5" onClick={()=>{ const next = browseOffset + browseLimit; setBrowseOffset(next); if (lastResultTable) openResultsWithTable(lastResultTable); }}>Next</button>
                    <span className="opacity-70">Offset {browseOffset}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 normal-case">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={editMode} onChange={(e)=> setEditMode(e.target.checked)} disabled={!hasIdColumn} />
                    <span>Edit mode</span>
                  </label>
                  {editMode && hasIdColumn && (
                    <>
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={()=>{ const sql = buildUpdateSQL(); if (!sql) return; setConfirmSql(sql); setConfirmStage(0); setConfirmSqlOpen(true); }} disabled={!anyEdits && !anyDeletes}>Save Changes</Button>
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={()=> { setEdited({}); setDeleteRows(new Set()); }} disabled={!anyEdits && !anyDeletes}>Clear changes</Button>
                    </>
                  )}
                </div>
              </div>
              {rows.length > 0 ? (
                <div className="p-2">
                  <div className="w-full max-h-[60vh] overflow-auto">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-muted-foreground">Rows: {rows.length}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
                        <Button variant="outline" size="sm" onClick={exportJSON}>Export JSON</Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span>Columns:</span>
                        <div className="flex flex-wrap gap-1">
                          {columns.map((c) => (
                            <label key={c} className="inline-flex items-center gap-1 border rounded px-1 py-0.5">
                              <input
                                type="checkbox"
                                checked={exportCols.includes(c)}
                                onChange={(e) => setExportCols((prev) => e.target.checked ? [...prev, c] : prev.filter((x) => x !== c))}
                              />
                              <span>{c}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Limit:</span>
                        <input
                          type="number"
                          className="w-20 border rounded px-1 py-0.5 bg-transparent"
                          value={exportLimit}
                          min={1}
                          onChange={(e) => setExportLimit(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </div>
                    </div>
                    <table className={`w-full text-xs ${density === "compact" ? "[&_*]:py-0.5 text-[11px]" : ""}`}>
                      <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur">
                        <tr className="text-left border-b border-white/40 dark:border-white/10">
                          {columns.filter((c) => exportCols.includes(c)).map((c) => (
                            <th key={c} className="py-1 pr-4 font-semibold">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 hover:underline"
                                onClick={() => {
                                  if (sortCol === c) {
                                    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                  } else {
                                    setSortCol(c);
                                    setSortDir("asc");
                                  }
                                }}
                              >
                                {c}
                                <span className="ml-1 inline-block text-[10px] px-1 py-0.5 rounded bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10">
                                  {columnTypes[c]}
                                </span>
                                {sortCol === c ? (sortDir === "asc" ? " ▲" : " ▼") : null}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.slice(0, exportLimit).map((r, idx) => (
                          <tr key={idx} className={`border-b border-white/30 dark:border-white/5 ${density === "compact" ? "text-[11px]" : ""}`}>
                            {columns.filter((c) => exportCols.includes(c)).map((c) => (
                              <td key={c} className="py-1 pr-4 align-top">
                                {(() => {
                                  const v = r[c];
                                  if (editMode && hasIdColumn && typeof v !== 'object') {
                                    const rowKey = idx;
                                    const current = edited[rowKey]?.[c] ?? v;
                                    const onSet = (val:any)=> setEdited((prev)=> ({...prev, [rowKey]: {...prev[rowKey], [c]: val}}));
                                    const t = inferType(v, c);
                                    if (t === 'number') return <input className="w-full bg-transparent border rounded px-1" type="number" value={current ?? ''} onChange={(e)=> onSet(e.target.value === '' ? null : Number(e.target.value))} />;
                                    if (t === 'boolean') return <input type="checkbox" checked={Boolean(current)} onChange={(e)=> onSet(e.target.checked)} />;
                                    if (t === 'date') return <input className="w-full bg-transparent border rounded px-1" type="datetime-local" value={typeof current==='string'? current : ''} onChange={(e)=> onSet(e.target.value)} />;
                                    return <input className="w-full bg-transparent border rounded px-1" value={current ?? ''} onChange={(e)=> onSet(e.target.value)} />;
                                  }
                                  const out = formatValue(v);
                                  if (typeof v === "object") {
                                    return <pre className="whitespace-pre-wrap break-words">{out as any}</pre>;
                                  }
                                  return out as any;
                                })()}
                              </td>
                            ))}
                            {editMode && hasIdColumn && (
                              <td className="py-1 pr-2">
                                <label className="inline-flex items-center gap-1 text-[11px]"><input type="checkbox" checked={deleteRows.has(idx)} onChange={(e)=>{
                                  setDeleteRows((prev)=>{ const next = new Set(prev); if (e.target.checked) next.add(idx); else next.delete(idx); return next; });
                                }} />Delete</label>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <div>
                        Page {page} / {totalPages} · Rows {rows.length}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="text-xs p-2 overflow-auto max-h-72 whitespace-pre">{pretty(result)}</pre>
              )}
            </div>
          )}
          </AccordionContent>
        </AccordionItem>

        {/* Seed Recipes */}
        <AccordionItem value="seed">
          <AccordionTrigger className="cursor-pointer">
            <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Seed Recipes</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {seedRecipes.map((r) => (
              <Button
                key={r.title}
                variant="outline"
                className="justify-start h-auto py-2"
                onClick={() => setSeedSql(r.sql)}
                title={r.description}
              >
                {r.title}
              </Button>
            ))}
          </div>
          <Textarea
            value={seedSql}
            onChange={(e) => setSeedSql(e.target.value)}
            className="font-mono text-xs min-h-[120px]"
            placeholder="BEGIN;\n-- Your seed SQL here\nCOMMIT;"
          />
          <div className="flex items-center gap-2">
            <Button onClick={async () => {
              if (isMultiStatement(seedSql)) {
                setConfirmSeedOpen(true);
              } else {
                try {
                  setSeedBusy(true);
                  await runSql(seedSql);
                } finally {
                  setSeedBusy(false);
                }
              }
            }} disabled={seedBusy || !seedSql.trim()}>
              {seedBusy ? "Seeding…" : "Run Seed (Transactional)"}
            </Button>
            <Button variant="outline" onClick={() => setSeedSql("")}>Clear</Button>
          </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Migration Planner */}
        <AccordionItem value="migration">
          <AccordionTrigger className="cursor-pointer">
            <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Migration Planner</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 space-y-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Create a migration for detected schema changes. Output will include tool logs.</p>
          <Button
            variant="outline"
            onClick={async () => {
              setExecuting(true);
              setExecError(null);
              try {
                const res = await IpcClient.getInstance().portalMigrateCreate({ appId });
                setResult({ migrationOutput: res.output });
              } catch (e: any) {
                setExecError(e?.message || String(e));
              } finally {
                setExecuting(false);
              }
            }}
          >
            Create migration
          </Button>
          {result?.migrationOutput && (
            <div className="rounded-md border border-white/60 dark:border-white/10">
              <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide bg-white/50 dark:bg-white/5 glass-contrast-text">
                Migration Output
              </div>
              <pre className="text-xs p-2 overflow-auto max-h-72 whitespace-pre-wrap break-words">{result.migrationOutput}</pre>
            </div>
          )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* New Column Dialog */}
  <Dialog open={newColOpen} onOpenChange={setNewColOpen}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New column in {ddlTable}</DialogTitle>
      </DialogHeader>
      <div className="text-xs space-y-2">
        <label className="block">Name</label>
        <input className="w-full border rounded px-2 py-1 bg-transparent" value={ddlColumn} onChange={(e)=> setDdlColumn(e.target.value)} />
        <label className="block mt-2">Type</label>
        <select className="w-full border rounded px-2 py-1 bg-transparent" value={ddlType} onChange={(e)=> setDdlType(e.target.value)}>
          <option value="text">text</option>
          <option value="varchar(255)">varchar(255)</option>
          <option value="integer">integer</option>
          <option value="bigint">bigint</option>
          <option value="numeric">numeric</option>
          <option value="boolean">boolean</option>
          <option value="timestamp with time zone">timestamptz</option>
          <option value="date">date</option>
          <option value="jsonb">jsonb</option>
        </select>
        <label className="inline-flex items-center gap-2 mt-2"><input type="checkbox" onChange={(e)=> (e.target as any)._nullable = e.target.checked} /> Nullable</label>
        <label className="block mt-2">Default (raw SQL)</label>
        <input id="newcol-default" className="w-full border rounded px-2 py-1 bg-transparent" placeholder="NULL, now(), 0, 'text'" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={()=> setNewColOpen(false)}>Cancel</Button>
        <Button onClick={()=> { const defEl = document.getElementById('newcol-default') as HTMLInputElement | null; const defVal = defEl?.value?.trim(); const nullable = (document.querySelector('input[type=checkbox][onchange]') as any)?._nullable; const nullSql = nullable ? '' : ' NOT NULL'; const defSql = defVal ? ` DEFAULT ${defVal}` : ''; const sql = `ALTER TABLE ${ddlTable} ADD COLUMN ${ddlColumn} ${ddlType}${defSql}${nullSql};`; setConfirmSql(sql); setConfirmStage(0); setConfirmSqlOpen(true); }}>Preview SQL</Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Results Header */}
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
    </div>
    <div className="flex items-center gap-2">
      <label className="inline-flex items-center gap-1">
        <span>Limit:</span>
        <input
          type="number"
          className="w-20 border rounded px-1 py-0.5 bg-transparent"
          value={exportLimit}
          min={1}
          onChange={(e) => setExportLimit(Math.max(1, Number(e.target.value) || 1))}
        />
      </label>
    </div>
  </div>

  {/* Insert Row Dialog - Structured */}
  <Dialog open={insertOpen} onOpenChange={setInsertOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Insert into {insertTable}</DialogTitle>
        <DialogDescription className="text-xs">Fill values per column. SQL preview updates live.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {(insertTable ? (schemaRowsByTable[insertTable]||[]) : []).map((c:any)=>{
          const val = insertValues[c.column];
          const typ = String(c.type||'').toLowerCase();
          const setVal = (v:any)=> {
            const next = { ...insertValues, [c.column]: v };
            setInsertValues(next);
            const cols = Object.keys(next);
            const vals = cols.map((col)=>{
              const v2 = (next as any)[col];
              if (v2 === null) return 'NULL';
              if (typeof v2 === 'number') return String(v2);
              if (typeof v2 === 'boolean') return v2 ? 'TRUE' : 'FALSE';
              return `'${String(v2).replace(/'/g, "''")}'`;
            });
            setInsertSql(`INSERT INTO ${insertTable} (${cols.join(', ')})\nVALUES (${vals.join(', ')});`);
          };
          if (typ.includes('bool')) {
            return (
              <label key={c.column} className="flex items-center gap-2 border rounded px-2 py-1">
                <span className="min-w-[120px] font-mono">{c.column}</span>
                <input type="checkbox" checked={Boolean(val)} onChange={(e)=> setVal(e.target.checked)} />
              </label>
            );
          }
          if (typ.includes('int') || typ.includes('numeric') || typ.includes('float')) {
            return (
              <label key={c.column} className="flex items-center gap-2 border rounded px-2 py-1">
                <span className="min-w-[120px] font-mono">{c.column}</span>
                <input className="flex-1 bg-transparent outline-none" type="number" value={val ?? ''} onChange={(e)=> setVal(e.target.value === '' ? null : Number(e.target.value))} />
              </label>
            );
          }
          if (typ.includes('date') || typ.includes('time')) {
            return (
              <label key={c.column} className="flex items-center gap-2 border rounded px-2 py-1">
                <span className="min-w-[120px] font-mono">{c.column}</span>
                <input className="flex-1 bg-transparent outline-none" type="datetime-local" value={typeof val==='string'? val : ''} onChange={(e)=> setVal(e.target.value)} />
              </label>
            );
          }
          return (
            <label key={c.column} className="flex items-center gap-2 border rounded px-2 py-1">
              <span className="min-w-[120px] font-mono">{c.column}</span>
              <input className="flex-1 bg-transparent outline-none" value={val ?? ''} onChange={(e)=> setVal(e.target.value)} />
            </label>
          );
        })}
      </div>
      <Label className="text-xs mt-2">SQL Preview</Label>
      <Textarea className="font-mono text-xs min-h-[100px]" value={insertSql} onChange={(e)=> setInsertSql(e.target.value)} />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={()=> setInsertOpen(false)}>Cancel</Button>
        <Button onClick={async ()=> { await runSql(insertSql); setInsertOpen(false); setOpenAccordions((prev)=> Array.from(new Set([...prev, 'result']))); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }}>Run</Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Drop Column Dialog */}
  <DropColumnDialog
    open={dropColOpen}
    onOpenChange={setDropColOpen}
    table={ddlTable}
    columns={ddlTable ? (schemaRowsByTable[ddlTable] || []).map((c: any) => c.column) : []}
    initialColumn={ddlColumn}
    onPreviewSql={(sql) => {
      setConfirmSql(sql);
      setConfirmStage(0);
      setConfirmSqlOpen(true);
    }}
  />

  {/* Branch Creation Dialog */}
  <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Branch</DialogTitle>
        <DialogDescription className="text-xs">
          Create a new database branch for testing schema changes safely.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="branch-name" className="text-sm">Branch Name</Label>
          <input
            id="branch-name"
            className="w-full border rounded-lg px-3 py-2 bg-transparent mt-1"
            placeholder="feature/new-schema"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Branch from: <span className="font-medium">{currentBranch}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => {
          setShowBranchDialog(false);
          setNewBranchName("");
        }}>Cancel</Button>
        <Button onClick={() => {
          if (newBranchName.trim() && !branches.includes(newBranchName.trim())) {
            setBranches([...branches, newBranchName.trim()]);
            setCurrentBranch(newBranchName.trim());
          }
          setShowBranchDialog(false);
          setNewBranchName("");
        }} disabled={!newBranchName.trim() || branches.includes(newBranchName.trim())}>
          Create Branch
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Save Query Dialog */}
  <Dialog open={showSaveQueryDialog} onOpenChange={setShowSaveQueryDialog}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Save Query</DialogTitle>
        <DialogDescription className="text-xs">
          Save this query for quick access later.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="query-name" className="text-sm">Query Name</Label>
          <input
            id="query-name"
            className="w-full border rounded-lg px-3 py-2 bg-transparent mt-1"
            placeholder="My useful query"
            value={saveQueryName}
            onChange={(e) => setSaveQueryName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="query-desc" className="text-sm">Description (optional)</Label>
          <Textarea
            id="query-desc"
            className="mt-1 text-xs min-h-[60px]"
            placeholder="What does this query do?"
            value={saveQueryDesc}
            onChange={(e) => setSaveQueryDesc(e.target.value)}
          />
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-2">
          <div className="text-xs text-muted-foreground mb-1">SQL Preview:</div>
          <pre className="text-[10px] font-mono max-h-[100px] overflow-auto">{sql}</pre>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => {
          setShowSaveQueryDialog(false);
          setSaveQueryName("");
          setSaveQueryDesc("");
        }}>Cancel</Button>
        <Button onClick={saveQuery} disabled={!saveQueryName.trim()}>
          Save Query
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* SQL Confirmation Dialog */}
  <Dialog open={confirmSqlOpen} onOpenChange={setConfirmSqlOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Confirm SQL Execution</DialogTitle>
        <DialogDescription className="text-xs">
          Review the SQL statement before executing. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <Label className="text-sm mb-2 block">SQL Statement:</Label>
          <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-[300px] overflow-auto">{confirmSql}</pre>
        </div>
        {confirmStage === 0 && (
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800 dark:text-yellow-300">
                This will modify your database schema. Make sure you have a backup or are using a development branch.
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => {
          setConfirmSqlOpen(false);
          setConfirmSql("");
          setConfirmStage(0);
        }}>Cancel</Button>
        <Button onClick={async () => {
          await runSql(confirmSql);
          setConfirmSqlOpen(false);
          setConfirmSql("");
          setConfirmStage(0);
          setOpenAccordions((prev) => Array.from(new Set([...prev, 'result'])));
        }} variant="default">
          Execute SQL
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Seed Confirmation Dialog */}
  <Dialog open={confirmSeedOpen} onOpenChange={setConfirmSeedOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Confirm Seed Execution</DialogTitle>
        <DialogDescription className="text-xs">
          This will execute multiple SQL statements. Review carefully.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-[300px] overflow-auto">{seedSql}</pre>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setConfirmSeedOpen(false)}>Cancel</Button>
        <Button onClick={async () => {
          setConfirmSeedOpen(false);
          try {
            setSeedBusy(true);
            await runSql(seedSql);
          } finally {
            setSeedBusy(false);
          }
        }}>
          Execute Seed
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Query Settings Dialog */}
  <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Query Runner Settings</DialogTitle>
        <DialogDescription className="text-xs">
          Configure query execution and editor preferences.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">SQL Formatter</Label>
              <div className="text-xs text-muted-foreground">Auto-format SQL keywords</div>
            </div>
            <select 
              className="border rounded px-2 py-1 text-xs bg-transparent"
              value={sqlFormatter}
              onChange={(e) => setSqlFormatter(e.target.value as any)}
            >
              <option value="none">None</option>
              <option value="basic">Basic</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Query Timeout</Label>
              <div className="text-xs text-muted-foreground">Maximum execution time (seconds)</div>
            </div>
            <input 
              type="number" 
              className="w-20 border rounded px-2 py-1 text-xs bg-transparent"
              value={queryTimeout}
              onChange={(e) => setQueryTimeout(Number(e.target.value))}
              min={5}
              max={300}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Max Rows Display</Label>
              <div className="text-xs text-muted-foreground">Limit rows in results</div>
            </div>
            <input 
              type="number" 
              className="w-20 border rounded px-2 py-1 text-xs bg-transparent"
              value={maxRows}
              onChange={(e) => setMaxRows(Number(e.target.value))}
              min={10}
              max={10000}
            />
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <Label className="text-sm">Show Line Numbers</Label>
              <div className="text-xs text-muted-foreground">Display line numbers in editor</div>
            </div>
            <input 
              type="checkbox" 
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Enable Autocomplete</Label>
              <div className="text-xs text-muted-foreground">SQL keyword suggestions</div>
            </div>
            <input 
              type="checkbox" 
              checked={enableAutocomplete}
              onChange={(e) => setEnableAutocomplete(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-Execute on Load</Label>
              <div className="text-xs text-muted-foreground">Run query when loading from history</div>
            </div>
            <input 
              type="checkbox" 
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => {
          setSqlFormatter("basic");
          setQueryTimeout(30);
          setMaxRows(1000);
          setShowLineNumbers(true);
          setEnableAutocomplete(true);
          setAutoExecute(false);
        }}>
          Reset to Defaults
        </Button>
        <Button onClick={() => setShowSettingsDialog(false)}>
          Done
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* SQL Templates Dialog */}
  <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>SQL Templates</DialogTitle>
        <DialogDescription className="text-xs">
          Quick-start templates for common database operations.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
        {sqlTemplates.map((template) => (
          <button
            key={template.name}
            className="text-left p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors group"
            onClick={() => {
              setSql(template.sql);
              setShowTemplatesDialog(false);
              setOpenAccordions((prev) => Array.from(new Set([...prev, "query"])));
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">{template.name}</div>
                <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-words">
                  {template.sql.length > 100 ? template.sql.substring(0, 100) + "..." : template.sql}
                </pre>
              </div>
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="text-xs text-muted-foreground">
          Click a template to load it into the editor
        </div>
        <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* AI Assistant Dialog */}
  <Dialog open={showAiAssistant} onOpenChange={setShowAiAssistant}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI SQL Assistant
          </div>
          <ModelPicker />
        </DialogTitle>
        <DialogDescription className="text-xs">
          Generate, explain, optimize, or debug SQL queries using AI.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {/* Analysis Type Selector */}
        <div className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-white/5">
          {[
            { value: "generate", label: "Generate SQL", icon: <Code2 className="h-3.5 w-3.5" /> },
            { value: "explain", label: "Explain Query", icon: <FileText className="h-3.5 w-3.5" /> },
            { value: "optimize", label: "Optimize", icon: <Zap className="h-3.5 w-3.5" /> },
            { value: "debug", label: "Debug Error", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
          ].map((type) => (
            <button
              key={type.value}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                aiAnalysisType === type.value
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                  : "hover:bg-white/5"
              }`}
              onClick={() => setAiAnalysisType(type.value as any)}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>

        {/* Prompt Input */}
        {aiAnalysisType === "generate" && (
          <div>
            <Label className="text-sm mb-2 block">What do you want to query?</Label>
            <Textarea
              placeholder="e.g., Show me all users who signed up in the last 7 days"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="min-h-[100px] text-sm"
            />
          </div>
        )}

        {/* Current SQL Context (for explain/optimize/debug) */}
        {aiAnalysisType !== "generate" && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <Label className="text-xs mb-2 block">Current SQL:</Label>
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-words max-h-[100px] overflow-auto">
              {sql || "No SQL query in editor"}
            </pre>
          </div>
        )}

        {/* AI Response */}
        {(aiLoading || aiResponse) && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <Label className="text-sm font-medium">AI Response</Label>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap">{aiResponse}</div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowAiAssistant(false);
              setAiPrompt("");
              setAiResponse("");
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => generateSqlWithAI(aiPrompt, aiAnalysisType)}
            disabled={aiLoading || (aiAnalysisType === "generate" && !aiPrompt.trim())}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Sparkles className="h-4 w-4" />
            {aiLoading ? "Processing..." : aiAnalysisType === "generate" ? "Generate & Run" : "Analyze with AI"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* Create Table Dialog */}
  <Dialog open={showCreateTableDialog} onOpenChange={setShowCreateTableDialog}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Create New Table</DialogTitle>
        <DialogDescription className="text-xs">
          Design your table schema with columns and constraints.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label className="text-sm">Table Name</Label>
          <input 
            className="w-full border rounded-lg px-3 py-2 bg-transparent mt-1 text-sm"
            placeholder="users"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Columns</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setNewTableColumns([...newTableColumns, {name: "", type: "text", nullable: true}])}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Column
            </Button>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {newTableColumns.map((col, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border border-white/10">
                <input 
                  className="flex-1 border rounded px-2 py-1 text-xs bg-transparent"
                  placeholder="column_name"
                  value={col.name}
                  onChange={(e) => {
                    const updated = [...newTableColumns];
                    updated[idx].name = e.target.value;
                    setNewTableColumns(updated);
                  }}
                />
                <select 
                  className="border rounded px-2 py-1 text-xs bg-transparent"
                  value={col.type}
                  onChange={(e) => {
                    const updated = [...newTableColumns];
                    updated[idx].type = e.target.value;
                    setNewTableColumns(updated);
                  }}
                >
                  <option value="text">TEXT</option>
                  <option value="varchar(255)">VARCHAR(255)</option>
                  <option value="integer">INTEGER</option>
                  <option value="bigint">BIGINT</option>
                  <option value="bigserial">BIGSERIAL</option>
                  <option value="numeric">NUMERIC</option>
                  <option value="boolean">BOOLEAN</option>
                  <option value="timestamptz">TIMESTAMPTZ</option>
                  <option value="date">DATE</option>
                  <option value="jsonb">JSONB</option>
                  <option value="uuid">UUID</option>
                </select>
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input 
                    type="checkbox"
                    checked={col.nullable}
                    onChange={(e) => {
                      const updated = [...newTableColumns];
                      updated[idx].nullable = e.target.checked;
                      setNewTableColumns(updated);
                    }}
                  />
                  Nullable
                </label>
                {idx > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setNewTableColumns(newTableColumns.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <Label className="text-xs mb-2 block">Generated SQL:</Label>
          <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">
            {`CREATE TABLE ${newTableName || "table_name"} (\n${newTableColumns.map((col, idx) => {
              const nullable = col.nullable ? "" : " NOT NULL";
              const isPrimary = idx === 0 && col.type === "bigserial" ? " PRIMARY KEY" : "";
              return `  ${col.name || "column_name"} ${col.type.toUpperCase()}${nullable}${isPrimary}`;
            }).join(",\n")}\n);`}
          </pre>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => {
          setShowCreateTableDialog(false);
          setNewTableName("");
          setNewTableColumns([{name: "id", type: "bigserial", nullable: false}]);
        }}>Cancel</Button>
        <Button onClick={() => {
          const sql = `CREATE TABLE ${newTableName} (\n${newTableColumns.map((col, idx) => {
            const nullable = col.nullable ? "" : " NOT NULL";
            const isPrimary = idx === 0 && col.type === "bigserial" ? " PRIMARY KEY" : "";
            return `  ${col.name} ${col.type.toUpperCase()}${nullable}${isPrimary}`;
          }).join(",\n")}\n);`;
          setSql(sql);
          setShowCreateTableDialog(false);
          setNewTableName("");
          setNewTableColumns([{name: "id", type: "bigserial", nullable: false}]);
          setOpenAccordions((prev) => Array.from(new Set([...prev, "query"])));
        }} disabled={!newTableName.trim() || newTableColumns.some(c => !c.name.trim())}>
          Generate SQL
        </Button>
      </div>
    </DialogContent>
  </Dialog>
    </div>
  );
}
