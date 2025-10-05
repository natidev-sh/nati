import React from "react";
import { usePrompts } from "@/hooks/usePrompts";
import {
  CreatePromptDialog,
  CreateOrEditPromptDialog,
} from "@/components/CreatePromptDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { BookOpen, FileText, PlusCircle } from "lucide-react";

export default function LibraryPage() {
  const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt } =
    usePrompts();

  return (
    <div className="min-h-screen px-6 md:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl glass-surface glass-hover p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#ed3378] to-[#c81e5d] text-white flex items-center justify-center shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold glass-contrast-text">Library</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage reusable building blocks for your apps. Create and organize prompts you can reuse across projects.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <CreatePromptDialog onCreatePrompt={createPrompt} />
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="rounded-2xl glass-surface p-6 text-sm text-gray-500 dark:text-gray-400">Loading prompts…</div>
        ) : prompts.length === 0 ? (
          <div className="rounded-2xl glass-surface glass-hover p-8 flex flex-col items-center justify-center text-center border">
            <div className="h-14 w-14 rounded-full bg-white dark:bg-white/90 ring-1 ring-black/5 flex items-center justify-center shadow-sm mb-3">
              <PlusCircle className="h-7 w-7 text-pink-600" />
            </div>
            <h2 className="text-lg font-semibold glass-contrast-text">No prompts yet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mt-1">
              Prompts let you save and reuse instructions, boilerplate messages, and system prompts. Create your first prompt to get started.
            </p>
            <div className="mt-4">
              <CreatePromptDialog onCreatePrompt={createPrompt} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {prompts.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onUpdate={updatePrompt}
                onDelete={deletePrompt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  onUpdate,
  onDelete,
}: {
  prompt: {
    id: number;
    title: string;
    description: string | null;
    content: string;
  };
  onUpdate: (p: {
    id: number;
    title: string;
    description?: string;
    content: string;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <div
      data-testid="prompt-card"
      className="p-4 rounded-2xl glass-surface shadow-sm glass-hover border"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-md bg-white dark:bg-white ring-1 ring-black/5 flex items-center justify-center shadow-sm">
              <FileText className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold glass-contrast-text">{prompt.title}</h3>
              {prompt.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {prompt.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <CreateOrEditPromptDialog
              mode="edit"
              prompt={prompt}
              onUpdatePrompt={onUpdate}
            />
            <DeleteConfirmationDialog
              itemName={prompt.title}
              itemType="Prompt"
              onDelete={() => onDelete(prompt.id)}
            />
          </div>
        </div>
        <pre className="text-sm whitespace-pre-wrap bg-transparent border rounded-xl p-3 max-h-48 overflow-auto">
          {prompt.content}
        </pre>
      </div>
    </div>
  );
}
