import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeleteConfirmationDialogProps {
  itemName: string;
  itemType?: string;
  onDelete: () => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function DeleteConfirmationDialog({
  itemName,
  itemType = "item",
  onDelete,
  trigger,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                data-testid="delete-prompt-button"
                className="rounded-xl glass-button glass-hover glass-active outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-500/90"
                aria-label={`Delete ${itemType.toLowerCase()}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete {itemType.toLowerCase()}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <AlertDialogContent className="rounded-2xl glass-surface border shadow-sm backdrop-blur-md select-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete {itemType}
          </AlertDialogTitle>
          <AlertDialogDescription className="glass-contrast-text">
            Are you sure you want to delete "{itemName}"? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl glass-button glass-hover outline-none focus-visible:ring-2 ring-white/40 dark:ring-white/15">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
