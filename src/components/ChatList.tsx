import { useEffect, useState, useMemo } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { formatDistanceToNow } from "date-fns";
import { PlusCircle, MoreVertical, Trash2, Edit3, Search } from "lucide-react";
import { useAtom } from "jotai";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { dropdownOpenAtom } from "@/atoms/uiAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { showError, showSuccess } from "@/lib/toast";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChats } from "@/hooks/useChats";
import { RenameChatDialog } from "@/components/chat/RenameChatDialog";
import { DeleteChatDialog } from "@/components/chat/DeleteChatDialog";

import { ChatSearchDialog } from "./ChatSearchDialog";

export function ChatList({ show }: { show?: boolean }) {
  const navigate = useNavigate();
  const [selectedChatId, setSelectedChatId] = useAtom(selectedChatIdAtom);
  const [selectedAppId, setSelectedAppId] = useAtom(selectedAppIdAtom);
  const [, setIsDropdownOpen] = useAtom(dropdownOpenAtom);

  const { chats, loading, refreshChats } = useChats(selectedAppId);
  const routerState = useRouterState();
  const isChatRoute = routerState.location.pathname === "/chat";

  // Memoize chats with formatted dates for performance
  const chatsWithFormattedDates = useMemo(() => 
    chats.map(chat => ({
      ...chat,
      formattedDate: formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })
    })),
    [chats]
  );

  // Rename dialog state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameChatId, setRenameChatId] = useState<number | null>(null);
  const [renameChatTitle, setRenameChatTitle] = useState("");

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<number | null>(null);
  const [deleteChatTitle, setDeleteChatTitle] = useState("");

  // search dialog state
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Update selectedChatId when route changes
  useEffect(() => {
    if (isChatRoute) {
      const id = routerState.location.search.id;
      if (id) {
        console.log("Setting selected chat id to", id);
        setSelectedChatId(id);
      }
    }
  }, [isChatRoute, routerState.location.search, setSelectedChatId]);

  if (!show) {
    return;
  }

  const handleChatClick = ({
    chatId,
    appId,
  }: {
    chatId: number;
    appId: number;
  }) => {
    setSelectedChatId(chatId);
    setSelectedAppId(appId);
    setIsSearchDialogOpen(false);
    navigate({
      to: "/chat",
      search: { id: chatId },
    });
  };

  const handleNewChat = async () => {
    // Only create a new chat if an app is selected
    if (selectedAppId) {
      try {
        // Create a new chat with an empty title for now
        const chatId = await IpcClient.getInstance().createChat(selectedAppId);

        // Navigate to the new chat
        setSelectedChatId(chatId);
        navigate({
          to: "/chat",
          search: { id: chatId },
        });

        // Refresh the chat list
        await refreshChats();
      } catch (error) {
        // DO A TOAST
        showError(`Failed to create new chat: ${(error as any).toString()}`);
      }
    } else {
      // If no app is selected, navigate to home page
      navigate({ to: "/" });
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await IpcClient.getInstance().deleteChat(chatId);
      showSuccess("Chat deleted successfully");

      // If the deleted chat was selected, navigate to home
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        navigate({ to: "/chat" });
      }

      // Refresh the chat list
      await refreshChats();
    } catch (error) {
      showError(`Failed to delete chat: ${(error as any).toString()}`);
    }
  };

  const handleDeleteChatClick = (chatId: number, chatTitle: string) => {
    setDeleteChatId(chatId);
    setDeleteChatTitle(chatTitle);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteChatId !== null) {
      await handleDeleteChat(deleteChatId);
      setIsDeleteDialogOpen(false);
      setDeleteChatId(null);
      setDeleteChatTitle("");
    }
  };

  const handleRenameChat = (chatId: number, currentTitle: string) => {
    setRenameChatId(chatId);
    setRenameChatTitle(currentTitle);
    setIsRenameDialogOpen(true);
  };

  const handleRenameDialogClose = (open: boolean) => {
    setIsRenameDialogOpen(open);
    if (!open) {
      setRenameChatId(null);
      setRenameChatTitle("");
    }
  };

  return (
    <>
      <SidebarGroup
        className="overflow-y-auto h-[calc(100vh-112px)] select-none"
        data-testid="chat-list-container"
      >
        <SidebarGroupLabel className="px-3 py-2 text-sidebar-foreground/60 text-[11px] uppercase tracking-wide font-medium">
          Recent Chats
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="flex items-center justify-start gap-2 mx-2 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <PlusCircle size={16} />
              <span>New Chat</span>
            </Button>
            <Button
              onClick={() => setIsSearchDialogOpen(!isSearchDialogOpen)}
              variant="outline"
              className="flex items-center justify-start gap-2 mx-2 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              data-testid="search-chats-button"
            >
              <Search size={16} />
              <span>Search chats</span>
            </Button>

            {loading ? (
              <div className="mx-2 mt-1 p-3 text-sm rounded-lg bg-sidebar-accent/30 text-sidebar-foreground/60">
                Loading chats...
              </div>
            ) : chats.length === 0 ? (
              <div className="mx-2 mt-1 p-3 text-sm rounded-lg bg-sidebar-accent/30 text-sidebar-foreground/60">
                No chats found
              </div>
            ) : (
              <SidebarMenu className="space-y-1">
                {chatsWithFormattedDates.map((chat) => (
                  <SidebarMenuItem key={chat.id} className="mb-1">
                    <div className="flex w-full items-center overflow-hidden">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          handleChatClick({
                            chatId: chat.id,
                            appId: chat.appId,
                          })
                        }
                        className={`justify-start w-full text-left py-2.5 px-3 pr-1 rounded-lg transition-all duration-200 min-h-[40px] will-change-transform overflow-hidden ${
                          selectedChatId === chat.id
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg scale-[1.02]"
                            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:scale-[1.01]"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                          <span className="truncate text-[13px] font-medium">
                            {chat.title || "New Chat"}
                          </span>
                          <span className="text-[10px] opacity-60 truncate">
                            {chat.formattedDate}
                          </span>
                        </div>
                      </Button>

                      {selectedChatId === chat.id && (
                        <DropdownMenu
                          modal={false}
                          onOpenChange={(open) => setIsDropdownOpen(open)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 w-8 h-8 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-sidebar-accent/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="space-y-1 p-2 bg-sidebar-accent border-sidebar-border"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                handleRenameChat(chat.id, chat.title || "")
                              }
                              className="px-3 py-2 transition-colors duration-150 hover:bg-sidebar-accent/80 focus:bg-sidebar-accent/80"
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              <span>Rename Chat</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteChatClick(
                                  chat.id,
                                  chat.title || "New Chat",
                                )
                              }
                              className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 focus:bg-red-50 dark:focus:bg-red-950/50 transition-colors duration-150"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Chat</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Rename Chat Dialog */}
      {renameChatId !== null && (
        <RenameChatDialog
          chatId={renameChatId}
          currentTitle={renameChatTitle}
          isOpen={isRenameDialogOpen}
          onOpenChange={handleRenameDialogClose}
          onRename={refreshChats}
        />
      )}

      {/* Delete Chat Dialog */}
      <DeleteChatDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={handleConfirmDelete}
        chatTitle={deleteChatTitle}
      />

      {/* Chat Search Dialog */}
      <ChatSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSelectChat={handleChatClick}
        appId={selectedAppId}
        allChats={chatsWithFormattedDates}
      />
    </>
  );
}
