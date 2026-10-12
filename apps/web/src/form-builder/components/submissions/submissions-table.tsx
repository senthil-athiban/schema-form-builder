import { Calendar, ChevronsUpDown, Copy, Ellipsis, Eye } from "lucide-react";
import type { SubmissionListItem } from "@/shared/api/types";
import type { FormQuestion } from "@/shared/types";
import { copyToClipboard } from "@/shared/lib/clipboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Answer, QuestionTypeIcon } from "./answer-cell";
import { formatDateTime, formatRelativeTime } from "./submissions.utils";

interface SubmissionsTableProps {
  rows: SubmissionListItem[];
  offset: number;
  questions: FormQuestion[];
  sort: "asc" | "desc";
  onToggleSort: () => void;
  onOpen: (row: SubmissionListItem, number: number) => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  rows,
  offset,
  questions,
  sort,
  onToggleSort,
  onOpen,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-max text-left text-sm">
      <thead className="border-y border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-600">
        <tr>
          <th className="w-14 py-3 pl-5 pr-2 text-center">#</th>
          <th className="whitespace-nowrap px-4 py-3">
            <button
              type="button"
              onClick={onToggleSort}
              className="inline-flex items-center gap-1.5 hover:text-slate-900"
              title={sort === "desc" ? "Newest first" : "Oldest first"}
            >
              <Calendar size={14} className="text-slate-400" aria-hidden />
              Submitted
              <ChevronsUpDown size={13} />
            </button>
          </th>
          {questions.map((question) => (
            <th key={question.id} className="min-w-40 max-w-[18rem] px-4 py-3" title={question.label}>
              <span className="inline-flex items-center gap-1.5">
                <QuestionTypeIcon type={question.type} />
                <span className="line-clamp-1">{question.label}</span>
              </span>
            </th>
          ))}
          <th className="w-16 py-3 pl-2 pr-5">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => {
          const number = offset + index + 1;
          return (
            <tr
              key={row.id}
              onClick={() => onOpen(row, number)}
              className="cursor-pointer transition hover:bg-slate-50/80"
            >
              <td className="py-4 pl-5 pr-2 text-center text-slate-500">{number}</td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="block text-slate-800">{formatDateTime(row.submittedAt)}</span>
                <span className="block text-xs text-slate-500">{formatRelativeTime(row.submittedAt)}</span>
              </td>
              {questions.map((question) => (
                <td key={question.id} className="max-w-[18rem] px-4 py-4 align-middle">
                  <Answer question={question} value={row.responseData[question.id]} />
                </td>
              ))}
              {/* Clicks inside the menu must not also open the row */}
              <td className="py-4 pl-2 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions for submission ${number}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    >
                      <Ellipsis size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => onOpen(row, number)}>
                      <Eye />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void copyToClipboard(row.id)}>
                      <Copy />
                      Copy submission ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
