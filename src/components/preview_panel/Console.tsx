import { appOutputAtom } from "@/atoms/appAtoms";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";

// Console component
export const Console = () => {
  const appOutput = useAtomValue(appOutputAtom);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { settings } = useSettings();

  const styleVars = useMemo(() => {
    const theme = settings?.console?.theme || {};
    const fontSize = settings?.console?.fontSize ?? 12;
    return {
      background: theme.background ?? "#0b0b0c",
      foreground: theme.foreground ?? "#e6e7e8",
      fontSize: `${fontSize}px`,
    } as const;
  }, [settings]);

  useEffect(() => {
    if (!containerRef.current) return;
    const auto = settings?.console?.autoScroll ?? true;
    if (!auto) return;
    // Scroll smoothly to bottom when new output arrives
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [appOutput.length, settings?.console?.autoScroll]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto px-4 py-2 rounded-b-2xl border-t font-mono"
      style={{ background: styleVars.background, color: styleVars.foreground, fontSize: styleVars.fontSize }}
    >
      {appOutput.map((output, index) => (
        <div key={index} className="whitespace-pre leading-snug">
          {output.message}
        </div>
      ))}
    </div>
  );
};
