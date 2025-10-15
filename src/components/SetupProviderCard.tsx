import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SetupProviderVariant = "google" | "openrouter" | "dyad";

export function SetupProviderCard({
  variant,
  title,
  subtitle,
  leadingIcon,
  onClick,
  tabIndex = 0,
  className,
}: {
  variant: SetupProviderVariant;
  title: string;
  subtitle?: ReactNode;
  leadingIcon: ReactNode;
  onClick: () => void;
  tabIndex?: number;
  className?: string;
}) {
  const styles = getVariantStyles(variant);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "backdrop-blur-sm",
        styles.container,
        className,
      )}
      onClick={onClick}
      role="button"
      tabIndex={tabIndex}
    >
      {/* Animated gradient background on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        styles.gradientOverlay
      )} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="relative p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon with glow effect */}
            <div className={cn(
              "relative flex-shrink-0 p-2.5 rounded-xl transition-all duration-300",
              "group-hover:scale-110 group-hover:rotate-3",
              styles.iconWrapper
            )}>
              <div className={cn("absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300", styles.iconGlow)} />
              <div className="relative">
                {leadingIcon}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-semibold text-base mb-0.5 transition-colors duration-200",
                styles.titleColor
              )}>
                {title}
              </h4>
              {subtitle && (
                <div className={cn(
                  "text-xs flex items-center gap-1.5 font-medium",
                  styles.subtitleColor
                )}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          
          {/* Animated chevron */}
          <div className={cn(
            "flex-shrink-0 p-2 rounded-lg transition-all duration-300",
            "group-hover:translate-x-1 group-hover:bg-white/20 dark:group-hover:bg-black/20",
            styles.chevronWrapper
          )}>
            <ChevronRight className={cn("w-5 h-5 transition-colors", styles.chevronColor)} />
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left",
        styles.accentLine
      )} />
    </div>
  );
}

function getVariantStyles(variant: SetupProviderVariant) {
  switch (variant) {
    case "google":
      return {
        container:
          "bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border-blue-200/60 dark:border-blue-800/40 hover:border-blue-300 dark:hover:border-blue-700",
        gradientOverlay: "bg-gradient-to-br from-blue-100/50 to-indigo-100/30 dark:from-blue-900/30 dark:to-indigo-900/20",
        iconWrapper: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/80 dark:to-indigo-900/60 shadow-sm",
        iconGlow: "bg-blue-400",
        titleColor: "text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-200",
        subtitleColor: "text-blue-700 dark:text-blue-300",
        chevronColor: "text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300",
        chevronWrapper: "",
        accentLine: "bg-gradient-to-r from-blue-500 to-indigo-500",
      } as const;
    case "openrouter":
      return {
        container:
          "bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border-teal-200/60 dark:border-teal-800/40 hover:border-teal-300 dark:hover:border-teal-700",
        gradientOverlay: "bg-gradient-to-br from-teal-100/50 to-emerald-100/30 dark:from-teal-900/30 dark:to-emerald-900/20",
        iconWrapper: "bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/80 dark:to-emerald-900/60 shadow-sm",
        iconGlow: "bg-teal-400",
        titleColor: "text-teal-900 dark:text-teal-100 group-hover:text-teal-700 dark:group-hover:text-teal-200",
        subtitleColor: "text-teal-700 dark:text-teal-300",
        chevronColor: "text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300",
        chevronWrapper: "",
        accentLine: "bg-gradient-to-r from-teal-500 to-emerald-500",
      } as const;
    case "dyad":
      return {
        container:
          "bg-gradient-to-br from-violet-50 to-purple-50/50 dark:from-violet-950/40 dark:to-purple-950/20 border-violet-200/60 dark:border-violet-800/40 hover:border-violet-300 dark:hover:border-violet-700",
        gradientOverlay: "bg-gradient-to-br from-violet-100/50 to-purple-100/30 dark:from-violet-900/30 dark:to-purple-900/20",
        iconWrapper: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/80 dark:to-purple-900/60 shadow-sm",
        iconGlow: "bg-violet-400",
        titleColor: "text-violet-900 dark:text-violet-100 group-hover:text-violet-700 dark:group-hover:text-violet-200",
        subtitleColor: "text-violet-700 dark:text-violet-300",
        chevronColor: "text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300",
        chevronWrapper: "",
        accentLine: "bg-gradient-to-r from-violet-500 to-purple-500",
      } as const;
  }
}

export default SetupProviderCard;
