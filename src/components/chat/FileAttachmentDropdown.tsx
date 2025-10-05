import { Paperclip, MessageSquare, Upload, Clipboard, FolderPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface FileAttachmentDropdownProps {
  onFileSelect: (
    files: FileList,
    type: "chat-context" | "upload-to-codebase",
  ) => void;
  disabled?: boolean;
  className?: string;
}

export function FileAttachmentDropdown({
  onFileSelect,
  disabled,
  className,
}: FileAttachmentDropdownProps) {
  const chatContextFileInputRef = useRef<HTMLInputElement>(null);
  const uploadToCodebaseFileInputRef = useRef<HTMLInputElement>(null);
  const uploadFolderInputRef = useRef<HTMLInputElement>(null);

  // Set non-standard folder selection attributes at runtime to avoid TS errors
  useEffect(() => {
    if (uploadFolderInputRef.current) {
      try {
        uploadFolderInputRef.current.setAttribute("webkitdirectory", "");
        uploadFolderInputRef.current.setAttribute("directory", "");
        uploadFolderInputRef.current.setAttribute("multiple", "");
      } catch {}
    }
  }, []);

  const handleChatContextClick = () => {
    chatContextFileInputRef.current?.click();
  };

  const handleUploadToCodebaseClick = () => {
    uploadToCodebaseFileInputRef.current?.click();
  };

  const handleUploadFolderToCodebaseClick = () => {
    uploadFolderInputRef.current?.click();
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !('read' in navigator.clipboard)) {
        // Fallback: focus hidden input to allow Ctrl+V (not ideal)
        chatContextFileInputRef.current?.focus();
        return;
      }
      // @ts-ignore - clipboard.read is not yet in TS DOM for all targets
      const items = await navigator.clipboard.read();
      for (const item of items) {
        // Prefer images, then text
        if (item.types?.includes('image/png')) {
          const blob = await item.getType('image/png');
          const file = new File([blob], `clipboard-${Date.now()}.png`, { type: 'image/png' });
          const dt = new DataTransfer();
          dt.items.add(file);
          onFileSelect(dt.files, 'chat-context');
          return;
        }
        if (item.types?.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const file = new File([blob], `clipboard-${Date.now()}.txt`, { type: 'text/plain' });
          const dt = new DataTransfer();
          dt.items.add(file);
          onFileSelect(dt.files, 'chat-context');
          return;
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed', e);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "chat-context" | "upload-to-codebase",
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files, type);
      // Clear the input value so the same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  title="Attach files"
                  className={className}
                >
                  <Paperclip size={20} />
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-2xl glass-surface ring-1 ring-white/30 dark:ring-white/10 border border-white/10 select-none">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={handleChatContextClick}
                      className="py-3 px-4 rounded-xl glass-hover"
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Attach file as chat context
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Example use case: screenshot of the app to point out a UI
                    issue
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={handleUploadToCodebaseClick}
                      className="py-3 px-4 rounded-xl glass-hover"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload file to codebase
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Example use case: add an image to use for your app
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenuItem onClick={handlePasteFromClipboard} className="py-3 px-4 rounded-xl glass-hover">
                <Clipboard size={16} className="mr-2" />
                Paste from clipboard
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleUploadFolderToCodebaseClick} className="py-3 px-4 rounded-xl glass-hover">
                <FolderPlus size={16} className="mr-2" />
                Upload folder to codebase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>Attach files</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Hidden file inputs */}
      <input
        type="file"
        data-testid="chat-context-file-input"
        ref={chatContextFileInputRef}
        onChange={(e) => handleFileChange(e, "chat-context")}
        className="hidden"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.txt,.md,.js,.ts,.html,.css,.json,.csv"
      />
      <input
        type="file"
        data-testid="upload-to-codebase-file-input"
        ref={uploadToCodebaseFileInputRef}
        onChange={(e) => handleFileChange(e, "upload-to-codebase")}
        className="hidden"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.txt,.md,.js,.ts,.html,.css,.json,.csv"
      />
      <input
        type="file"
        data-testid="upload-folder-to-codebase-input"
        ref={uploadFolderInputRef}
        onChange={(e) => handleFileChange(e, "upload-to-codebase")}
        className="hidden"
      />
    </>
  );
}
