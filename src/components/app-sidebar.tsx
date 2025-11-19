import {
  Home,
  Inbox,
  Settings,
  HelpCircle,
  Store,
  BookOpen,
  Terminal,
  Blocks,
  Users,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useSidebar } from "@/components/ui/sidebar"; // import useSidebar hook
import { useEffect, useState, useRef } from "react";
import { useAtom } from "jotai";
import { dropdownOpenAtom } from "@/atoms/uiAtoms";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChatList } from "./ChatList";
import { AppList } from "./AppList";
import { HelpDialog } from "./HelpDialog"; // Import the new dialog
import { SettingsList } from "./SettingsList";

// Menu items.
const items = [
  {
    title: "Apps",
    to: "/",
    icon: Home,
  },
  {
    title: "Chat",
    to: "/chat",
    icon: Inbox,
  },
  {
    title: "Teams",
    to: "/teams",
    icon: Users,
  },
  {
    title: "Prompt Library",
    to: "/library",
    icon: Terminal,
  },
  {
    title: "Docs",
    to: "/docs",
    icon: BookOpen,
  },
  {
    title: "Templates & Plugins",
    to: "/hub",
    icon: Blocks,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

// Hover state types
type HoverState =
  | "start-hover:app"
  | "start-hover:chat"
  | "start-hover:settings"
  | "start-hover:library"
  | "clear-hover"
  | "no-hover";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar(); // retrieve current sidebar state
  const [hoverState, setHoverState] = useState<HoverState>("no-hover");
  const expandedByHover = useRef(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false); // State for dialog
  const [isDropdownOpen] = useAtom(dropdownOpenAtom);

  useEffect(() => {
    if (hoverState.startsWith("start-hover") && state === "collapsed") {
      expandedByHover.current = true;
      toggleSidebar();
    }
    if (
      hoverState === "clear-hover" &&
      state === "expanded" &&
      expandedByHover.current &&
      !isDropdownOpen
    ) {
      toggleSidebar();
      expandedByHover.current = false;
      setHoverState("no-hover");
    }
  }, [hoverState, toggleSidebar, state, setHoverState, isDropdownOpen]);

  const routerState = useRouterState();
  const isAppRoute =
    routerState.location.pathname === "/" ||
    routerState.location.pathname.startsWith("/app-details");
  const isChatRoute = routerState.location.pathname === "/chat";
  const isTeamsRoute = routerState.location.pathname === "/teams";
  const isSettingsRoute = routerState.location.pathname.startsWith("/settings");

  let selectedItem: string | null = null;
  if (hoverState === "start-hover:app") {
    selectedItem = "Apps";
  } else if (hoverState === "start-hover:chat") {
    selectedItem = "Chat";
  } else if (hoverState === "start-hover:settings") {
    selectedItem = "Settings";
  } else if (hoverState === "start-hover:library") {
    selectedItem = "Library";
  } else if (state === "expanded") {
    if (isAppRoute) {
      selectedItem = "Apps";
    } else if (isChatRoute) {
      selectedItem = "Chat";
    } else if (isTeamsRoute) {
      selectedItem = "Teams";
    } else if (isSettingsRoute) {
      selectedItem = "Settings";
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      onMouseLeave={() => {
        if (!isDropdownOpen) {
          setHoverState("clear-hover");
        }
      }}
      className="group/sidebar top-11"
    >
      <SidebarContent className="overflow-hidden bg-(--sidebar) border-r border-sidebar-border">
        <div className="flex h-full">
          {/* Left Column: Menu items - Always visible */}
          <div className="w-16 flex flex-col items-center py-4 px-2 border-r border-sidebar-border">
            <AppIcons onHoverChange={setHoverState} />
          </div>
          
          {/* Right Column: Expandable content - Shows on hover/active */}
          <div className={`
            w-[260px] overflow-hidden transition-all duration-300 ease-out
            ${state === "expanded" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}
          `}>
            <div className="p-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
              <AppList show={selectedItem === "Apps"} />
              <ChatList show={selectedItem === "Chat"} />
              <SettingsList show={selectedItem === "Settings"} />
            </div>
          </div>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border bg-(--sidebar)">
        <div className="w-16 flex flex-col items-center py-2 px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                className="h-10 w-10 p-0 hover:bg-sidebar-accent rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                tooltip={{ children: "Help", hidden: false }}
                onClick={() => setIsHelpDialogOpen(true)}
              >
                <HelpCircle className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" />
              </SidebarMenuButton>
              <HelpDialog
                isOpen={isHelpDialogOpen}
                onClose={() => setIsHelpDialogOpen(false)}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>

      {/** SidebarRail removed: open/close is hover-only, no manual toggle rail */}
    </Sidebar>
  );
}

function AppIcons({
  onHoverChange,
}: {
  onHoverChange: (state: HoverState) => void;
}) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <SidebarGroup className="pr-0 flex-1">
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isActive =
              (item.to === "/" && pathname === "/") ||
              (item.to !== "/" && pathname.startsWith(item.to));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  className="h-10 w-10 p-0"
                  tooltip={{ children: item.title, hidden: false }}
                >
                  <Link
                    to={item.to}
                    className={`
                      relative flex items-center justify-center h-10 w-10 rounded-lg
                      transition-all duration-200 ease-out
                      ${isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg" 
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }
                      hover:scale-105 active:scale-95
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring
                    `}
                    onMouseEnter={() => {
                      if (item.title === "Apps") {
                        onHoverChange("start-hover:app");
                      } else if (item.title === "Chat") {
                        onHoverChange("start-hover:chat");
                      } else if (item.title === "Settings") {
                        onHoverChange("no-hover");
                      } else if (item.title === "Teams" || item.title === "Prompt Library" || item.title === "Templates & Plugins" || item.title === "Docs") {
                        onHoverChange("no-hover");
                      }
                    }}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#ed3378]"
                      />
                    )}
                    <item.icon className="h-5 w-5" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
