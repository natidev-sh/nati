import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Pencil, Trash2, Folder, Eye } from "lucide-react";
import { ReactNode } from "react";

interface ContextMenuItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface RightClickContextProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function RightClickContext({
  isOpen,
  position,
  items,
  onClose,
}: RightClickContextProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Context Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-50 min-w-[200px] rounded-2xl glass-surface backdrop-blur-2xl border border-white/30 dark:border-white/15 shadow-2xl overflow-hidden"
            style={{ left: position.x, top: position.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

            <div className="relative py-2">
              {items.map((item, index) => (
                <div key={index}>
                  {index > 0 && index === items.length - 1 && (
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent my-1.5 mx-2" />
                  )}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all group ${
                      item.variant === "danger"
                        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        : "glass-contrast-text hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center transition-transform group-hover:scale-110 ${
                        item.variant === "danger"
                          ? "text-red-500"
                          : "text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Preset context menu configurations
export const AppContextMenuItems = {
  openInChat: (onClick: () => void) => ({
    icon: <MessageCircle className="h-4 w-4" />,
    label: "Open in Chat",
    onClick,
  }),
  viewDetails: (onClick: () => void) => ({
    icon: <Eye className="h-4 w-4" />,
    label: "View Details",
    onClick,
  }),
  showInFolder: (onClick: () => void) => ({
    icon: <Folder className="h-4 w-4" />,
    label: "Show in Folder",
    onClick,
  }),
  rename: (onClick: () => void) => ({
    icon: <Pencil className="h-4 w-4" />,
    label: "Rename",
    onClick,
  }),
  delete: (onClick: () => void) => ({
    icon: <Trash2 className="h-4 w-4" />,
    label: "Delete",
    onClick,
    variant: "danger" as const,
  }),
};
