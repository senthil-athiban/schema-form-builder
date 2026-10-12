import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { SubmissionListItem } from "@/shared/api/types";
import type { FormQuestion } from "@/shared/types";
import { copyToClipboard } from "@/shared/lib/clipboard";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Answer, QuestionTypeIcon } from "./answer-cell";
import { formatDateTime, formatRelativeTime } from "./submissions.utils";

interface SubmissionDetailSheetProps {
  submission: SubmissionListItem | null;
  number: number | null;
  questions: FormQuestion[];
  onClose: () => void;
}

export const SubmissionDetailSheet: React.FC<SubmissionDetailSheetProps> = ({
  submission,
  number,
  questions,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // Answers to questions no longer in the form (edited after this response came in)
  const knownIds = new Set(questions.map((q) => q.id));
  const otherAnswers = submission
    ? Object.entries(submission.responseData).filter(([id]) => !knownIds.has(id))
    : [];

  return (
    <Sheet open={Boolean(submission)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-lg">
        {submission && (
          <>
            <SheetHeader className="border-b border-slate-200 p-6">
              <SheetTitle className="text-lg">Submission #{number}</SheetTitle>
              <SheetDescription>
                {formatDateTime(submission.submittedAt)} · {formatRelativeTime(submission.submittedAt)}
              </SheetDescription>
              <button
                type="button"
                onClick={() => void copyToClipboard(submission.id).then((ok) => ok && setCopied(true))}
                className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 hover:bg-slate-200"
                title="Copy submission ID"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {submission.id}
              </button>
            </SheetHeader>

            <dl className="space-y-5 px-6 pb-8">
              {questions.map((question) => (
                <div key={question.id}>
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <QuestionTypeIcon type={question.type} />
                    {question.label}
                  </dt>
                  <dd className="mt-1 text-sm">
                    <Answer question={question} value={submission.responseData[question.id]} full />
                  </dd>
                </div>
              ))}

              {otherAnswers.length > 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-3">
                  <p className="text-xs font-medium text-slate-500">Answers to questions removed from the form</p>
                  <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
                    {JSON.stringify(Object.fromEntries(otherAnswers), null, 2)}
                  </pre>
                </div>
              )}
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
