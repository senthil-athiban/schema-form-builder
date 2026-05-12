import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  Trash2,
  GripVertical,
  EyeOff,
  Mail,
  Settings2,
  Star,
} from "lucide-react";
import { useFormBuilderStore } from "../store/form-builder-store";
import type { FormQuestion } from "../../shared/types";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import TooltipWrapper from "@/shared/components/ui/tooltipwrapper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import LiveSelectField from "./preview-fields/live-select-field.component";
import { getWidthStyle } from "../utils";
import LiveRadioField from "./preview-fields/live-radio-field.component";
import LiveCheckField from "./preview-fields/live-check-field.component";
import LiveMultiSelect from "./preview-fields/live-multi-select.component";

interface CanvasFieldProps {
  question: FormQuestion;
  pageId: string;
  sectionId: string;
}


function CanvasQuestionPreview({ pageId, sectionId, question }: { pageId: string, sectionId: string, question: FormQuestion }) {
  // console.log('question:', question)
  const placeholder =
    typeof question.placeholder === "string" ? question.placeholder : "";
  const previewWrap = "";

  switch (question.type) {
    case "email":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              tabIndex={-1}
              disabled={question.disabled}
              type="email"
              placeholder={placeholder || "email@example.com"}
              className="bg-background pl-9"
              aria-hidden
            />
          </div>
        </div>
      );

    case "number":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <Input
            disabled={question.disabled}
            tabIndex={-1}
            type="number"
            placeholder={placeholder || "0"}
            className="bg-background"
          />
        </div>
      );

    case "textarea":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <Textarea
            disabled={question.disabled}
            tabIndex={-1}
            placeholder={placeholder || "Type here…"}
            className="min-h-[88px] resize-none bg-background"
          />  
        </div>
      );

    case "select":
      return <LiveSelectField pageId={pageId} sectionId={sectionId} question={question} />;

    case "radio":
      return (
        <LiveRadioField pageId={pageId} sectionId={sectionId} question={question} />
      );

    case "checkbox":
      return (
        <LiveCheckField pageId={pageId} sectionId={sectionId} question={question} />
      );

    case "multiselect":
      return (
        <LiveMultiSelect pageId={pageId} sectionId={sectionId} question={question} />
      );

    case "date":
      return (
        <div style={getWidthStyle(question.width)}>
          <Input tabIndex={-1} type="date" className="bg-background" />
        </div>
      );

    case "time":
      return (
        <div style={getWidthStyle(question.width)}>
          <Input tabIndex={-1} type="time" className="bg-background" />
        </div>
      );

    case "file":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <div className="flex h-9 items-center rounded-lg border border-dashed border-input bg-muted/30 px-3 text-xs text-muted-foreground">
            Choose file…
          </div>
        </div>
      );

    case "slider": {
      const min = question.config?.min ?? 0;
      const max = question.config?.max ?? 100;
      const step = question.config?.step ?? 1;
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            defaultValue={min}
            disabled
            className="w-full accent-primary"
          />
        </div>
      );
    }

    case "rating":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-6 fill-amber-400 text-amber-400 opacity-40"
                aria-hidden
              />
            ))}
          </div>
        </div>
      );

    case "phone":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <Input
            disabled={question.disabled}
            tabIndex={-1}
            type="tel"
            placeholder={placeholder || "(555) 000-0000"}
            className="bg-background"
          />
        </div>
      );

    case "url":
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <Input
            disabled={question.disabled}
            tabIndex={-1}
            type="url"
            placeholder={placeholder || "https://"}
            className="bg-background"
          />
        </div>
      );

    case "section":
      return (
        <div
          className={cn(
            previewWrap,
            "rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground",
          )}
          style={getWidthStyle(question.width)}
        >
          Section group (questions inside belong to this page flow)
        </div>
      );

    case "html":
      return (
        <div
          className={cn(
            previewWrap,
            "rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600",
          )}
          style={getWidthStyle(question.width)}
        >
          {question.config?.content ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: String(question.config.content),
              }}
            />
          ) : (
            <span className="italic text-muted-foreground">
              Rich text / HTML block
            </span>
          )}
        </div>
      );

    case "text":
    default:
      return (
        <div className={previewWrap} style={getWidthStyle(question.width)}>
          <Input
            disabled={question.disabled}
            tabIndex={-1}
            type="text"
            placeholder={placeholder || "Type your answer…"}
            className="bg-background"
          />
        </div>
      );
  }
}

export const CanvasField: React.FC<CanvasFieldProps> = ({
  question,
  pageId,
  sectionId,
}) => {
  const {
    selection,
    setSelection,
    deleteQuestion,
    addQuestion,
    updateQuestion,
  } = useFormBuilderStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    data: {
      kind: "question-sortable",
      pageId,
      sectionId,
      questionId: question.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected =
    selection?.type === "question" &&
    selection.pageId === pageId &&
    selection.sectionId === sectionId &&
    selection.questionId === question.id;

  const duplicateQuestion = () => {
    const section = useFormBuilderStore
      .getState()
      .currentForm.pages.find((p) => p.id === pageId)
      ?.sections.find((s) => s.id === sectionId);
    const idx = section?.questions.findIndex((q) => q.id === question.id) ?? -1;
    const rest = { ...question };
    delete rest.id;
    addQuestion(
      pageId,
      sectionId,
      {
        ...rest,
        label: `${question.label} (copy)`,
        name: `${question.name}_copy_${Math.random().toString(36).slice(2, 9)}`,
      },
      idx >= 0 ? idx + 1 : undefined,
    );
    const updated = useFormBuilderStore
      .getState()
      .currentForm.pages.find((p) => p.id === pageId)
      ?.sections.find((s) => s.id === sectionId);
    const qs = updated?.questions ?? [];
    const newQ = idx >= 0 ? qs[idx + 1] : qs[qs.length - 1];
    if (newQ) {
      setSelection({
        type: "question",
        pageId,
        sectionId,
        questionId: newQ.id,
      });
    }
  };

  const updateQuestionLabel = (label: string) => {
    console.log('label:', label)
    updateQuestion(pageId, sectionId, question.id, { label });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative cursor-pointer rounded-2xl p-4 transition-all",
        question.hidden ? "bg-slate-100/70" : "bg-white",
        isSelected
          ? "border-2 border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
          : isDragging
            ? "border border-slate-200 shadow-lg"
            : question.hidden
              ? "border border-slate-300 hover:border-slate-400"
              : "border border-slate-200 hover:border-indigo-200 hover:shadow-sm",
      )}
      onClick={() =>
        setSelection({
          type: "question",
          pageId,
          sectionId,
          questionId: question.id,
        })
      }
    >
      {question.hidden ? (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
          <EyeOff size={12} />
          Hidden
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={cn(
            "mt-1 cursor-grab rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
            question.hidden && "opacity-60",
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVertical size={20} />
        </button>

        <div className={cn("min-w-0 flex-1 space-y-2", question.hidden && "pr-20")}>
          <div className="flex items-center gap-2">
            <div className={cn("inline-flex items-center gap-1.5", question.hidden && "opacity-60")}>
            <input
              className="w-auto min-w-0 bg-transparent text-base font-medium text-slate-900 outline-none"
              value={`${question.label}${question.required ? "*" : ""}`}
              onChange={(e) => updateQuestionLabel(e.target.value)}
            />
            </div>
          </div>

          <div className={cn(question.hidden && "opacity-60")}>
            <CanvasQuestionPreview pageId={pageId} sectionId={sectionId} question={question} />
          </div>
        </div>

        <div
          className="flex shrink-0 mt-6 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <TooltipWrapper tooltip="Field settings" side="top">
            <button
              type="button"
              title="Field settings"
              className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              onClick={() =>
                setSelection({
                  type: "question",
                  pageId,
                  sectionId,
                  questionId: question.id,
                })
              }
            >
              <Settings2 size={16} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper tooltip="Duplicate field" side="top">
          <button
            type="button"
            title="Duplicate field"
            className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            onClick={duplicateQuestion}
          >
            <Copy size={16} />
          </button>
          </TooltipWrapper>
          <AlertDialog>
            <TooltipWrapper tooltip="Delete field" side="top">
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  title="Delete field"
                  className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
            </TooltipWrapper>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-red-50 text-red-500">
                  <Trash2 size={18} />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete this field?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove &quot;{question.label}&quot; from the
                  section. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => deleteQuestion(pageId, sectionId, question.id)}
                >
                  Delete field
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
