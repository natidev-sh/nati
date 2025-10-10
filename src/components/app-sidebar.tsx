import {
  Home,
  Inbox,
  Settings,
  HelpCircle,
  Store,
  BookOpen,
  Terminal,
  Blocks,
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
  SidebarRail,
  SidebarTrigger,
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
    >
      <SidebarContent className="overflow-hidden glass-surface border-r supports-[backdrop-filter]:bg-transparent ring-1 ring-white/20 dark:ring-white/10">
        <div className="flex mt-8 px-2 gap-2">
          {/* Left Column: Menu items */}
          <div className="">
            <SidebarTrigger
              onMouseEnter={() => {
                setHoverState("clear-hover");
              }}
              // Keep the trigger minimal (no border), rely on built-in ghost variant
            />
            <AppIcons onHoverChange={setHoverState} />
          </div>
          {/* Right Column: Chat List Section */}
          <div className="w-[240px] ml-1 p-2 rounded-2xl glass-surface shadow-sm">
            <AppList show={selectedItem === "Apps"} />
            <ChatList show={selectedItem === "Chat"} />
            <SettingsList show={selectedItem === "Settings"} />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Change button to open dialog instead of linking */}
            <SidebarMenuButton
              size="sm"
              className="font-medium w-14 flex flex-col items-center gap-1 h-14 mb-2 rounded-2xl glass-surface glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 transition-colors"
              tooltip={{ children: "Help", hidden: false }}
              onClick={() => setIsHelpDialogOpen(true)} // Open dialog on click
            >
              <div className="flex flex-col items-center justify-center gap-1 h-full glass-contrast-text">
                <HelpCircle className="h-5 w-5" />
              </div>
              {/* Text label removed; tooltip communicates */}
            </SidebarMenuButton>
            <HelpDialog
              isOpen={isHelpDialogOpen}
              onClose={() => setIsHelpDialogOpen(false)}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail className="transition-all duration-300 ease-out" />
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
    // When collapsed: only show the main menu
    <SidebarGroup className="pr-0">
      {/* <SidebarGroupLabel>nati</SidebarGroupLabel> */}

      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              (item.to === "/" && pathname === "/") ||
              (item.to !== "/" && pathname.startsWith(item.to));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  className="font-medium w-14"
                  tooltip={{ children: item.title, hidden: false }}
                >
                  <Link
                    to={item.to}
                  className={`relative flex flex-col items-center justify-center gap-1 h-14 mb-2 rounded-2xl glass-surface glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none ${
                    isActive ? "glass-active ring-1 ring-white/40 dark:ring-white/15 dark:shadow-[0_0_0_3px_rgba(255,255,255,.08)]" : ""
                  }`}
                    onMouseEnter={() => {
                      if (item.title === "Apps") {
                        onHoverChange("start-hover:app");
                      } else if (item.title === "Chat") {
                        onHoverChange("start-hover:chat");
                      } else if (item.title === "Settings") {
                        // Do not auto-expand on Settings hover to avoid opening menubars
                        onHoverChange("no-hover");
                      } else if (item.title === "Library" || item.title === "Hub" || item.title === "Docs") {
                        // Do not trigger hover-based expansion for Library or Hub
                        onHoverChange("no-hover");
                      }
                    }}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full"
                        style={{ backgroundColor: "#ed3378" }}
                      />
                    )}
                    <div className="flex flex-col items-center gap-1 glass-contrast-text">
                      <item.icon className="h-14 w-5" />
                    </div>
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
