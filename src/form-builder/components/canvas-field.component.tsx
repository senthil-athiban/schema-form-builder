import React, { useMemo, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  EllipsisVertical,
  GitBranch,
  Trash2,
  GripVertical,
  EyeOff,
  Mail,
  Settings2,
  Star,
  Zap,
  Plus,
  Trash,
} from "lucide-react";
import { useFormBuilderStore } from "../store/form-builder-store";
import type {
  Action,
  ActionType,
  Condition,
  ConditionalRule,
  FormQuestion,
  Operator,
} from "../../shared/types";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/shared/components/ui/native-select";
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
import { v4 as uuidv4 } from "uuid";
interface CanvasFieldProps {
  question: FormQuestion;
  pageId: string;
  sectionId: string;
}

function InlineQuestionLogicScaffold({
  field,
  questions,
  logic,
}: {
  field: FormQuestion;
  questions: Array<{
    id: string;
    label: string;
    pageLabel: string;
    sectionLabel: string;
  }>;
  logic: ConditionalRule;
}) {
  const targetQuestions = questions.filter(
    (question) => question.id !== field.id,
  );
  const defaultTargetQuestion = targetQuestions[0];
  const {
    addConditionalRule,
    updateConditionalRule,
    currentForm,
    deleteConditionalRule,
  } = useFormBuilderStore();

  const [conditions, setConditions] = useState<Condition[]>(
    logic.conditions || [{ fieldId: field.id, operator: "equals", value: "" }],
  );
  const [actions, setActions] = useState<Action[]>(
    logic.actions || [{ type: "show", targetFieldId: "" }],
  );

  const conditionsRef = useRef<Condition[]>(conditions);
  const actionsRef = useRef<Action[]>(actions);

  const persist = (newConditions: Condition[], newActions: Action[]) => {
    updateConditionalRule(logic.id, {
      ...logic,
      conditions: newConditions,
      actions: newActions,
    });
  }

  const patchConditions = (cb: (conditions: Condition[]) => Condition[]) => {
    setConditions((prev) => {
      const next = cb(prev);
      persist(next, actionsRef.current);
      return next;
    })
  }

  const patchActions = (cb: (actions: Action[]) => Action[]) => {
    setActions((prev) => {
      const next = cb(prev);
      persist(conditionsRef.current, next);
      return next;
    })
  };

  // console.log("currentForm:", currentForm);
  // console.log("actions:", actions);
  // console.log("conditions:", conditions);

  const handleAddCondition = () => {
    addConditionalRule({
      id: uuidv4(),
      sourceFieldId: field.id,
      conditions: [],
      actions: [],
    });
  };

  const handleDeleteLogic = () => {
    deleteConditionalRule(logic.id);
  };

  // const updateCondition = () => {
  //   updateConditionalRule(logic.id, {
  //     ...logic,
  //     conditions: conditions,
  //     actions: actions,
  //   });
  // };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <GitBranch size={16} className="text-slate-500" />
              <span>When</span>
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Condition row menu"
            >
              <EllipsisVertical size={16} />
            </button>
          </div>
          {conditions.map((condition, index) => (
            <div className="mt-3 gap-2 flex">
              <NativeSelect
                className="w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm"
                defaultValue={condition.fieldId}
                value={condition.fieldId}
                aria-label="Condition source field"
                onChange={(e) =>
                  setConditions((prev) => {
                    const newConditions = [...prev];
                    newConditions[index] = {
                      ...newConditions[index],
                      fieldId: e.target.value,
                    };
                    return newConditions;
                  })
                }
              >
                {questions.map((question) => (
                  <NativeSelectOption key={question.id} value={question.id}>
                    {question.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>

              <NativeSelect
                className="w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm"
                defaultValue={"equals"}
                value={condition.operator}
                aria-label="Condition operator"
                onChange={(e) =>
                  setConditions((prev) => {
                    const newConditions = [...prev];
                    newConditions[index] = {
                      ...newConditions[index],
                      operator: e.target.value as Operator,
                    };
                    return newConditions;
                  })
                }
              >
                <NativeSelectOption value="equals">Is</NativeSelectOption>
                <NativeSelectOption value="notEquals">
                  Is not
                </NativeSelectOption>
                <NativeSelectOption value="contains">
                  Contains
                </NativeSelectOption>
                <NativeSelectOption value="greaterThan">
                  {">"}
                </NativeSelectOption>
                <NativeSelectOption value="lessThan">{"<"}</NativeSelectOption>
                <NativeSelectOption value="isEmpty">
                  Is empty
                </NativeSelectOption>
                <NativeSelectOption value="isNotEmpty">
                  Is not empty
                </NativeSelectOption>
              </NativeSelect>

              <Input
                className="h-8 rounded-xl border-slate-200 bg-white text-sm shadow-sm"
                defaultValue={
                  condition.value == null ? "" : String(condition.value)
                  // field.defaultValue == null ? "" : String(field.defaultValue)
                }
                onChange={(e) => {
                  patchConditions((prev) => {
                    const newConditions = [...prev];
                    newConditions[index] = {
                      ...newConditions[index],
                      value: e.target.value,
                    };
                    return newConditions;
                  });
                }}
                placeholder="Value"
                aria-label="Condition value"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-600"
                  onClick={() =>
                    patchConditions((prev) => {
                      const newConditions = [...prev];
                      newConditions.push({
                        fieldId: field.id,
                        operator: "equals",
                        value: "",
                      });
                      return newConditions;
                    })
                  }
                >
                  <Plus size={16} />
                </button>
                {conditions.length > 1 && (
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-red-600 transition hover:bg-slate-100 hover:text-slate-600"
                    onClick={() =>
                      patchConditions((prev) => {
                        const newConditions = [...prev];
                        newConditions.splice(index, 1);
                        return newConditions;
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Zap size={16} className="text-amber-500" />
              <span>Then</span>
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Action row menu"
            >
              <EllipsisVertical size={16} />
            </button>
          </div>

          {actions.map((action, idx) => (
            <div className="mt-3 gap-2 flex">
              <NativeSelect
                className="w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm"
                defaultValue="show"
                value={action.type}
                aria-label="Action type"
                onChange={(e) =>
                  setActions((prev) => {
                    const newActions = [...prev];
                    newActions[idx] = {
                      ...newActions[idx],
                      type: e.target.value as ActionType,
                    };
                    return newActions;
                  })
                }
              >
                <NativeSelectOption value="show">Show field</NativeSelectOption>
                <NativeSelectOption value="hide">Hide field</NativeSelectOption>
                <NativeSelectOption value="enable">
                  Enable field
                </NativeSelectOption>
                <NativeSelectOption value="disable">
                  Disable field
                </NativeSelectOption>
                <NativeSelectOption value="setValue">
                  Set value
                </NativeSelectOption>
              </NativeSelect>

              <NativeSelect
                className="w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm"
                defaultValue={defaultTargetQuestion?.id}
                value={action.targetFieldId}
                aria-label="Action target field"
                onChange={(e) =>
                  setActions((prev) => {
                    const newActions = [...prev];
                    newActions[idx] = {
                      ...newActions[idx],
                      targetFieldId: e.target.value,
                    };
                    return newActions;
                  })
                }
              >
                {targetQuestions.length > 0 ? (
                  targetQuestions.map((question) => (
                    <NativeSelectOption key={question.id} value={question.id}>
                      {question.label}
                    </NativeSelectOption>
                  ))
                ) : (
                  <NativeSelectOption value={field.id}>
                    No other field available
                  </NativeSelectOption>
                )}
              </NativeSelect>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-600"
                  onClick={() =>
                    patchActions((prev) => {
                      const newActions = [...prev];
                      newActions.push({
                        type: "show",
                        targetFieldId: defaultTargetQuestion?.id,
                      });
                      return newActions;
                    })
                  }
                >
                  <Plus size={16} />
                </button>
                {actions.length > 1 && (
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-red-600 transition hover:bg-slate-100 hover:text-slate-600"
                    onClick={() =>
                      patchActions((prev) => {
                        const newActions = [...prev];
                        newActions.splice(idx, 1);
                        return newActions;
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            className="rounded-md px-1.5 py-1 font-medium text-slate-600 transition hover:bg-white"
            onClick={handleAddCondition}
          >
            + Add new logic
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 gap-x-2 font-medium text-red-600 transition hover:bg-white flex cursor-pointer"
            onClick={handleDeleteLogic}
          >
            <Trash size={14} />
            Delete logic
          </button>
        </div>
        {/* 
        <Button type="button" size="sm">
          Done
        </Button> */}
      </div>
    </div>
  );
}

function CanvasQuestionPreview({
  pageId,
  sectionId,
  question,
}: {
  pageId: string;
  sectionId: string;
  question: FormQuestion;
}) {
  // console.log('question:', question)
  const placeholder =
    typeof question.placeholder === "string" ? question.placeholder : "";
  
  const previewWrap = "";
  

  switch (question.type) {
    case "email":
      return (
        <div style={getWidthStyle(question.width)}>
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
      return (
        <LiveSelectField
          pageId={pageId}
          sectionId={sectionId}
          question={question}
        />
      );

    case "radio":
      return (
        <LiveRadioField
          pageId={pageId}
          sectionId={sectionId}
          question={question}
        />
      );

    case "checkbox":
      return (
        <LiveCheckField
          pageId={pageId}
          sectionId={sectionId}
          question={question}
        />
      );

    case "multiselect":
      return (
        <LiveMultiSelect
          pageId={pageId}
          sectionId={sectionId}
          question={question}
        />
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
    currentForm,
    selection,
    setSelection,
    deleteQuestion,
    addQuestion,
    updateQuestion,
    addConditionalRule,
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

  const allQuestions = useMemo(
    () =>
      currentForm.pages.flatMap((page) =>
        page.sections.flatMap((section) =>
          section.questions.map((canvasQuestion) => ({
            id: canvasQuestion.id,
            label: canvasQuestion.label || canvasQuestion.type,
            pageLabel: page.label,
            sectionLabel: section.label,
          })),
        ),
      ),
    [currentForm.pages],
  );

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
    updateQuestion(pageId, sectionId, question.id, { label });
  };

  const logics = currentForm.conditionalLogic.filter(
    (logic) => logic.sourceFieldId === question.id,
  );
  
  const targetQuestions = allQuestions.filter(
    (q) => q?.id !== question?.id,
  );
  const defaultTargetQuestion = targetQuestions?.[0];

  const handleAddLogic = () => {
    addConditionalRule({
      id: uuidv4(),
      sourceFieldId: question.id,
      conditions: [{ fieldId: question.id, operator: "equals", value: "" }],
      actions: [{ type: "show", targetFieldId: defaultTargetQuestion?.id }],
    });
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

      <div className="flex items-start gap-3">
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

        <div
          className={cn("min-w-0 flex-1 space-y-2", question.hidden && "pr-20")}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5",
                question.hidden && "opacity-60",
              )}
            >
              <input
                className="w-auto min-w-0 bg-transparent text-base font-medium text-slate-900 outline-none"
                value={`${question.label}${question.required ? "*" : ""}`}
                onChange={(e) => updateQuestionLabel(e.target.value)}
              />
            </div>
          </div>

          <div className={cn(question.hidden && "opacity-60")}>
            <CanvasQuestionPreview
              pageId={pageId}
              sectionId={sectionId}
              question={question}
            />
          </div>

          {isSelected ? (
            logics.length > 0 ? (
              logics.map((logic) => (
                <InlineQuestionLogicScaffold
                  key={logic.id}
                  field={question}
                  questions={allQuestions}
                  logic={logic}
                />
              ))
            ) : (
              <button
                type="button"
                className="rounded-md px-1.5 py-1 text-xs text-slate-600 transition hover:bg-white hover:text-slate-800 cursor-pointer"
                onClick={handleAddLogic}
              >
                + Add logic
              </button>
            )
          ) : null}
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
                  This will permanently remove &quot;{question.label}&quot; from
                  the section. This action cannot be undone.
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
