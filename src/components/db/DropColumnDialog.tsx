import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  table: string | null;
  columns: string[];
  initialColumn?: string;
  onPreviewSql: (sql: string) => void;
}

export function DropColumnDialog({ open, onOpenChange, table, columns, initialColumn, onPreviewSql }: Props) {
  const [col, setCol] = React.useState<string>(initialColumn || (columns[0] || ""));
  React.useEffect(()=>{
    setCol(initialColumn || (columns[0] || ""));
  }, [initialColumn, columns.join(","), table]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Drop column {col ? `from ${table}` : ""}</DialogTitle>
          <DialogDescription className="text-xs">Dangerous action. This cannot be undone automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-xs">
          <label className="block">Column</label>
          <select className="w-full border rounded px-2 py-1 bg-transparent" value={col} onChange={(e)=> setCol(e.target.value)}>
            {columns.map((c)=> (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={()=> onOpenChange(false)}>Cancel</Button>
          <Button onClick={()=> { if (!table || !col) return; onPreviewSql(`ALTER TABLE ${table} DROP COLUMN ${col};`); onOpenChange(false); }}>Preview SQL</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
