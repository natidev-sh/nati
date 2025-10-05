import { useEffect, useMemo, useState } from "react";
import { Database, Shield, Play, Table as TableIcon, Plus, Pencil, Trash2, Columns, AlertTriangle, TerminalSquare } from "lucide-react";
import { DropColumnDialog } from "@/components/db/DropColumnDialog";
import { IpcClient } from "@/ipc/ipc_client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props {
  appId: number;
}

export function SupabaseDbBrowser({ appId }: Props) {
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
    try {
      const res = await IpcClient.getInstance().executeSupabaseSql(appId, text);
      if (res?.error) {
        setExecError(String(res.error));
      } else {
        setResult(res?.result ?? res);
      }
    } catch (e: any) {
      setExecError(e?.message || String(e));
    } finally {
      setExecuting(false);
    }
    // naive parse for SELECT ... FROM <table>
    const m = /select\s+[\s\S]*?from\s+([a-zA-Z0-9_."]+)/i.exec(text);
    if (m && m[1]) setLastResultTable(m[1].replace(/\"/g, ""));
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
    return inner.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((x) => x.replace(/^\"|\"$/g, ""));
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
    <div className="w-full min-w-0 px-3 sm:px-4 py-3 space-y-4">
      {policies.length > 0 && (
        <div className="rounded-md border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 p-3">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">RLS/Policies detected</div>
          <div className="text-xs text-yellow-800/90 dark:text-yellow-300 mt-1">
            Queries may be restricted by Row Level Security policies. Review policies below.
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold glass-contrast-text">Database Browser</h3>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center text-xs border rounded-md overflow-hidden">
            <button
              type="button"
              className={`px-2 py-1 transition-colors ${density === "comfortable" ? "bg-white/10" : "hover:bg-white/5"}`}
              onClick={() => setDensity("comfortable")}
              title="Comfortable row height"
            >Comfort</button>
            <button
              type="button"
              className={`px-2 py-1 transition-colors ${density === "compact" ? "bg-white/10" : "hover:bg-white/5"}`}
              onClick={() => setDensity("compact")}
              title="Compact row height"
            >Compact</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">View schema and run SQL queries against the linked Supabase project.</p>

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
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400"><TerminalSquare className="h-3.5 w-3.5"/> Query Runner</div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 space-y-2">
          <div>
            <Label htmlFor="sql-editor" className="text-xs">SQL</Label>
            <Textarea
              id="sql-editor"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="mt-1 font-mono text-xs min-h-[100px]"
              placeholder="SELECT * FROM public.sample LIMIT 50;"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => runSql(sql)} disabled={executing}>
              {executing ? "Running…" : "Run"}
            </Button>
            <Button variant="outline" onClick={() => setSql("")}>Clear</Button>
          </div>
          {execError && (
            <div className="text-sm text-red-700 dark:text-red-400">{execError}</div>
          )}
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
                                    const onSet = (val:any)=> setEdited((prev)=> ({...prev, [rowKey]: {...(prev[rowKey]||{}), [c]: val}}));
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
    </div>
  );
}
