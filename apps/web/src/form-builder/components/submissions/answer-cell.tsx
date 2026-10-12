import { AtSign, Calendar, Clock, Hash, Link2, ListChecks, Phone, SquareCheck, Type } from "lucide-react";
import { formatAnswer, isEmptyValue } from "@form-builder/shared/form-validation";
import type { FormQuestion } from "@/shared/types";
import { formatDateAnswer, formatRelativeDay } from "./submissions.utils";

const iconClass = "shrink-0 text-slate-400";

export const QuestionTypeIcon: React.FC<{ type: FormQuestion["type"] }> = ({ type }) => {
  switch (type) {
    case "number":
    case "rating":
    case "slider":
      return <Hash size={14} className={iconClass} aria-hidden />;
    case "date":
      return <Calendar size={14} className={iconClass} aria-hidden />;
    case "time":
      return <Clock size={14} className={iconClass} aria-hidden />;
    case "email":
      return <AtSign size={14} className={iconClass} aria-hidden />;
    case "phone":
      return <Phone size={14} className={iconClass} aria-hidden />;
    case "url":
      return <Link2 size={14} className={iconClass} aria-hidden />;
    case "checkbox":
      return <SquareCheck size={14} className={iconClass} aria-hidden />;
    case "select":
    case "radio":
    case "multiselect":
      return <ListChecks size={14} className={iconClass} aria-hidden />;
    default:
      return <Type size={14} className={iconClass} aria-hidden />;
  }
};

interface AnswerProps {
  question: FormQuestion;
  value: unknown;
  full?: boolean;
}

export const Answer: React.FC<AnswerProps> = ({ question, value, full }) => {
  if (isEmptyValue(value)) {
    return <span className="text-slate-400">{full ? "No answer" : "—"}</span>;
  }

  if (question.type === "date" && typeof value === "string") {
    return (
      <span>
        <span className="block text-slate-800">{formatDateAnswer(value)}</span>
        <span className="block text-xs text-slate-500">{formatRelativeDay(value)}</span>
      </span>
    );
  }

  const text = formatAnswer(question, value);
  return (
    <span
      className={`text-slate-800 ${full ? "whitespace-pre-wrap wrap-break-word" : "line-clamp-2"}`}
      title={!full && text.length > 60 ? text : undefined}
    >
      {text}
    </span>
  );
};
