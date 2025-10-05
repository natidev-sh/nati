import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { selectedChatIdAtom } from "@/atoms/chatAtoms";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import {
  AlertTriangle,
  XCircle,
  FileText,
  Wrench,
  RefreshCw,
  Check,
} from "lucide-react";
import { Problem, ProblemReport } from "@/ipc/ipc_types";
import { Button } from "@/components/ui/button";

import { useStreamChat } from "@/hooks/useStreamChat";
import { useCheckProblems } from "@/hooks/useCheckProblems";
import { createProblemFixPrompt } from "@/shared/problem_prompt";
import { showError } from "@/lib/toast";

interface ProblemItemProps {
  problem: Problem;
}

const ProblemItem = ({ problem }: ProblemItemProps) => {
  return (
    <div className="flex items-start gap-3 p-3 sm:p-3.5 border-b border-white/40 dark:border-white/10 glass-surface hover:glass-hover transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-6 w-6 rounded-md bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center">
          <XCircle size={14} className="text-red-500" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate glass-contrast-text">{problem.file}</span>
          <span className="text-xs text-muted-foreground">
            {problem.line}:{problem.column}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {problem.message}
        </p>
      </div>
    </div>
  );
};

interface RecheckButtonProps {
  appId: number;
  size?: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}

const RecheckButton = ({
  appId,
  size = "sm",
  variant = "outline",
  className = "h-7 px-3 text-xs glass-button glass-hover",
}: RecheckButtonProps) => {
  const { checkProblems, isChecking } = useCheckProblems(appId);
  const [showingFeedback, setShowingFeedback] = useState(false);

  const handleRecheck = async () => {
    setShowingFeedback(true);

    const res = await checkProblems();

    setShowingFeedback(false);

    if (res.error) {
      showError(res.error);
    }
  };

  const isShowingChecking = isChecking || showingFeedback;

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleRecheck}
      disabled={isShowingChecking}
      className={className}
      data-testid="recheck-button"
    >
      <RefreshCw
        size={14}
        className={`mr-1 ${isShowingChecking ? "animate-spin" : ""}`}
      />
      {isShowingChecking ? "Checking..." : "Run checks"}
    </Button>
  );
};

interface ProblemsSummaryProps {
  problemReport: ProblemReport;
  appId: number;
}

const ProblemsSummary = ({ problemReport, appId }: ProblemsSummaryProps) => {
  const { streamMessage } = useStreamChat();
  const { problems } = problemReport;
  const totalErrors = problems.length;
  const [selectedChatId] = useAtom(selectedChatIdAtom);

  const handleFixAll = () => {
    if (!selectedChatId) {
      return;
    }
    streamMessage({
      prompt: createProblemFixPrompt(problemReport),
      chatId: selectedChatId,
    });
  };

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center m-3 rounded-2xl glass-surface border">
        <div className="mt-4 w-12 h-12 rounded-xl bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center">
          <Check size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">No problems found</p>
        <div className="mt-3 mb-4">
          <RecheckButton appId={appId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-t-2xl glass-surface border-b border-white/40 dark:border-white/10">
      <div className="flex items-center gap-4">
        {totalErrors > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center">
              <XCircle size={14} className="text-red-500" />
            </div>
            <span className="text-sm font-medium glass-contrast-text">
              {totalErrors} {totalErrors === 1 ? "error" : "errors"}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <RecheckButton appId={appId} />
        <Button
          size="sm"
          variant="default"
          onClick={handleFixAll}
          className="h-7 px-3 text-xs glass-button glass-active"
          data-testid="fix-all-button"
        >
          <Wrench size={14} className="mr-1" />
          Fix All
        </Button>
      </div>
    </div>
  );
};

export function Problems() {
  return (
    <div data-testid="problems-pane">
      <_Problems />
    </div>
  );
}

export function _Problems() {
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const { problemReport } = useCheckProblems(selectedAppId);

  if (!selectedAppId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl glass-surface border flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1 glass-contrast-text">No App Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select an app to view TypeScript problems and diagnostic information.
        </p>
      </div>
    );
  }

  if (!problemReport) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl glass-surface border flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1 glass-contrast-text">No Problems Report</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Run checks to scan your app for TypeScript errors and other problems.
        </p>
        <RecheckButton appId={selectedAppId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-2xl glass-surface border overflow-hidden">
      <ProblemsSummary problemReport={problemReport} appId={selectedAppId} />
      <div className="flex-1 overflow-y-auto">
        {problemReport.problems.map((problem, index) => (
          <ProblemItem
            key={`${problem.file}-${problem.line}-${problem.column}-${index}`}
            problem={problem}
          />
        ))}
      </div>
    </div>
  );
}
