import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "nati.promptFavorites:v1";

export function usePromptFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  // load
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {}
  }, [ids]);

  const add = useCallback((id: string) => setIds((s) => (s.includes(id) ? s : [...s, id])), []);
  const remove = useCallback((id: string) => setIds((s) => s.filter((x) => x !== id)), []);
  const toggle = useCallback((id: string) => setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])), []);

  const setAll = useCallback((next: string[]) => setIds(next), []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const count = ids.length;

  return { ids, count, has, add, remove, toggle, setAll };
}
