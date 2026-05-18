import React, { useRef, useState } from "react";
import {
  CopyPlus,
  GitBranch,
  GripVertical,
  Plus,
  Trash2,
  Zap,
  EllipsisVertical,
} from "lucide-react";
import { useFormBuilderStore } from "../store/form-builder-store";
import type {
  Action,
  ActionType,
  Condition,
  ConditionalRule,
  FormQuestion,
  LogicOperator,
  Operator,
} from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/shared/components/ui/native-select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import TooltipWrapper from "@/shared/components/ui/tooltipwrapper";
import { v4 as uuidv4 } from "uuid";

const LOGIC_SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg bg-white text-sm cursor-pointer hover:bg-slate-100/40";

const LOGIC_ROW_MENU_CLASS =
  "flex size-9 shrink-0 items-center justify-center cursor-pointer rounded-lg border border-transparent text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600 data-[state=open]:border-slate-200 data-[state=open]:bg-slate-50";

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  show: "Show blocks",
  hide: "Hide blocks",
  enable: "Enable field",
  disable: "Disable field",
  setValue: "Set value",
};

export type QuestionOption = {
  id: string;
  label: string;
  pageLabel: string;
  sectionLabel: string;
};

function LogicRowMenu({
  onAdd,
  onRemove,
  onDuplicate,
  addLabel,
  canRemove,
}: {
  onAdd: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  addLabel: string;
  canRemove: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={LOGIC_ROW_MENU_CLASS}
          aria-label="Row options"
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onSelect={onAdd}>
          <Plus size={14} />
          {addLabel}
        </DropdownMenuItem>
        {canRemove ? (
          <DropdownMenuItem variant="destructive" onSelect={onRemove}>
            <Trash2 size={14} />
            Remove
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={onDuplicate}>
          <CopyPlus size={14} />
          Duplicate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TargetFieldsPicker({
  selectedIds,
  options,
  placeholder,
  onChange,
}: {
  selectedIds: string[];
  options: QuestionOption[];
  placeholder: string;
  onChange: (ids: string[]) => void;
}) {
  const label =
    selectedIds
      .map((id) => options.find((q) => q.id === id)?.label)
      .filter(Boolean)
      .join(", ") || placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={`${LOGIC_SELECT_CLASS} border border-slate`}>
        <button
          type="button"
          className={cn(
            LOGIC_SELECT_CLASS,
            "flex items-center justify-between px-3 text-left font-normal",
            !selectedIds.length && "text-slate-400",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-56 w-56 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {options.length === 0 ? (
          <DropdownMenuItem disabled>No other fields</DropdownMenuItem>
        ) : (
          options.map((question) => (
            <DropdownMenuCheckboxItem
              key={question.id}
              checked={selectedIds.includes(question.id)}
              onCheckedChange={(checked) => {
                const next = checked
                  ? [...selectedIds, question.id]
                  : selectedIds.filter((id) => id !== question.id);
                onChange(next);
              }}
            >
              {question.label}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InlineQuestionLogicScaffold({
  field,
  questions,
  logic,
}: {
  field: FormQuestion;
  questions: QuestionOption[];
  logic: ConditionalRule;
}) {
  const targetQuestions = questions.filter((q) => q.id !== field.id);
  const defaultTargetId = targetQuestions[0]?.id ?? "";

  const { updateConditionalRule, deleteConditionalRule, addConditionalRule } = useFormBuilderStore();

  const [conditions, setConditions] = useState<Condition[]>(
    logic.conditions?.length
      ? logic.conditions
      : [{ fieldId: field.id, operator: "equals", value: "" }],
  );
  const [actions, setActions] = useState<Action[]>(
    logic.actions?.length
      ? logic.actions
      : [{ type: "show", targetFieldId: defaultTargetId }],
  );

  const conditionsRef = useRef(conditions);
  const actionsRef = useRef(actions);
  conditionsRef.current = conditions;
  actionsRef.current = actions;

  const persist = (newConditions: Condition[], newActions: Action[]) => {
    updateConditionalRule(logic.id, {
      ...logic,
      conditions: newConditions,
      actions: newActions,
    });
  };

  const patchConditions = (cb: (prev: Condition[]) => Condition[]) => {
    setConditions((prev) => {
      const next = cb(prev);
      persist(next, actionsRef.current);
      return next;
    });
  };

  const patchActions = (cb: (prev: Action[]) => Action[]) => {
    setActions((prev) => {
      const next = cb(prev);
      persist(conditionsRef.current, next);
      return next;
    });
  };

  const handleDeleteLogic = () => deleteConditionalRule(logic.id);

  const addConditionRow = () =>
    patchConditions((prev) => [
      ...prev,
      { fieldId: field.id, operator: "equals", value: "", logic: "AND" },
    ]);

  const addActionRow = () =>
    patchActions((prev) => [
      ...prev,
      { type: "show", targetFieldId: defaultTargetId },
    ]);

  const getActionTargetIds = (action: Action) =>
    action.targetFieldId
      ? action.targetFieldId.split(",").filter(Boolean)
      : [];

  const setActionTargetIds = (idx: number, ids: string[]) => {
    patchActions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], targetFieldId: ids.join(",") };
      return next;
    });
  };
  
  const addNewRule = () => {
    addConditionalRule({
      id: uuidv4(),
      sourceFieldId: field.id,
      conditions: [{ fieldId: field.id, operator: "equals", value: "" }],
      actions: [{ type: "show", targetFieldId: defaultTargetId }],
    });
  }

  return (
    <div
      className="mt-4 flex gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        <TooltipWrapper tooltip="Delete logic" side="right">
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
            onClick={handleDeleteLogic}
            aria-label="Delete logic"
          >
            <Trash2 size={16} />
          </button>
        </TooltipWrapper>
        <TooltipWrapper tooltip="Add condition" side="right">
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={addNewRule}
            aria-label="Add new logic"
          >
            <Plus size={16} />
          </button>
        </TooltipWrapper>
        <span className="cursor-grab rounded-md p-1.5 text-slate-300" aria-hidden>
          <GripVertical size={16} />
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-3 border-l-2 border-slate-200 bg-white p-3 shadow-sm-l">
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div
              key={`condition-${index}`}
              className="grid grid-cols-[72px_minmax(120px,1.4fr)_88px_minmax(96px,1fr)_32px] items-center gap-2"
            >
              {index === 0 ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <GitBranch size={15} className="shrink-0 text-slate-500" />
                  <span>When</span>
                </div>
              ) : (
                <NativeSelect
                  className={cn(LOGIC_SELECT_CLASS, "text-xs")}
                  value={condition.logic ?? "AND"}
                  aria-label="Condition logic"
                  onChange={(e) =>
                    patchConditions((prev) => {
                      const next = [...prev];
                      next[index] = {
                        ...next[index],
                        logic: e.target.value as LogicOperator,
                      };
                      return next;
                    })
                  }
                >
                  <NativeSelectOption value="AND">And</NativeSelectOption>
                  <NativeSelectOption value="OR">Or</NativeSelectOption>
                </NativeSelect>
              )}

              <NativeSelect
                className={LOGIC_SELECT_CLASS}
                value={condition.fieldId}
                aria-label="Condition field"
                onChange={(e) =>
                  patchConditions((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], fieldId: e.target.value };
                    return next;
                  })
                }
              >
                {questions.map((q) => (
                  <NativeSelectOption key={q.id} value={q.id}>
                    {q.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>

              <NativeSelect
                className={LOGIC_SELECT_CLASS}
                value={condition.operator}
                aria-label="Condition operator"
                onChange={(e) =>
                  patchConditions((prev) => {
                    const next = [...prev];
                    next[index] = {
                      ...next[index],
                      operator: e.target.value as Operator,
                    };
                    return next;
                  })
                }
              >
                <NativeSelectOption value="equals">Is</NativeSelectOption>
                <NativeSelectOption value="notEquals">Is not</NativeSelectOption>
                <NativeSelectOption value="contains">Contains</NativeSelectOption>
                <NativeSelectOption value="greaterThan">&gt;</NativeSelectOption>
                <NativeSelectOption value="lessThan">&lt;</NativeSelectOption>
                <NativeSelectOption value="isEmpty">Is empty</NativeSelectOption>
                <NativeSelectOption value="isNotEmpty">Is not empty</NativeSelectOption>
              </NativeSelect>

              <Input
                className={cn(LOGIC_SELECT_CLASS, "px-3")}
                value={condition.value == null ? "" : String(condition.value)}
                onChange={(e) =>
                  patchConditions((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], value: e.target.value };
                    return next;
                  })
                }
                placeholder="Value"
                aria-label="Condition value"
              />

              <LogicRowMenu
                addLabel="Add condition"
                canRemove={conditions.length > 1}
                onAdd={addConditionRow}
                onRemove={() =>
                  patchConditions((prev) => prev.filter((_, i) => i !== index))
                }
                onDuplicate={() =>
                  patchConditions((prev) => {
                    const next = [...prev];
                    next.splice(index + 1, 0, { ...prev[index] });
                    return next;
                  })
                }
              />
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3">
          {actions.map((action, idx) => {
            const isVisibilityAction =
              action.type === "show" || action.type === "hide";
            const targetIds = getActionTargetIds(action);

            return (
              <div
                key={`action-${idx}`}
                className={cn(
                  "grid items-center gap-2",
                  action.type === "setValue"
                    ? "grid-cols-[72px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(96px,1fr)_32px]"
                    : "grid-cols-[72px_minmax(120px,1.1fr)_minmax(140px,1.5fr)_32px]",
                )}
              >
                {idx === 0 ? (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Zap size={15} className="shrink-0 text-amber-500" />
                    <span>Then</span>
                  </div>
                ) : (
                  <span className="pl-1 text-sm font-medium text-slate-600">
                    And
                  </span>
                )}

                <NativeSelect
                  className={LOGIC_SELECT_CLASS}
                  value={action.type}
                  aria-label="Action type"
                  onChange={(e) =>
                    patchActions((prev) => {
                      const next = [...prev];
                      next[idx] = {
                        ...next[idx],
                        type: e.target.value as ActionType,
                      };
                      return next;
                    })
                  }
                >
                  {(Object.keys(ACTION_TYPE_LABELS) as ActionType[]).map(
                    (type) => (
                      <NativeSelectOption key={type} value={type}>
                        {ACTION_TYPE_LABELS[type]}
                      </NativeSelectOption>
                    ),
                  )}
                </NativeSelect>

                {isVisibilityAction ? (
                  <TargetFieldsPicker
                    selectedIds={targetIds}
                    options={targetQuestions}
                    placeholder="Select fields"
                    onChange={(ids) => setActionTargetIds(idx, ids)}
                  />
                ) : action.type === "setValue" ? (
                  <>
                    <NativeSelect
                      className={LOGIC_SELECT_CLASS}
                      value={action.targetFieldId || defaultTargetId}
                      aria-label="Set value target"
                      onChange={(e) =>
                        patchActions((prev) => {
                          const next = [...prev];
                          next[idx] = {
                            ...next[idx],
                            targetFieldId: e.target.value,
                          };
                          return next;
                        })
                      }
                    >
                      {targetQuestions.map((q) => (
                        <NativeSelectOption key={q.id} value={q.id}>
                          {q.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <Input
                      className={cn(LOGIC_SELECT_CLASS, "px-3")}
                      value={action.value == null ? "" : String(action.value)}
                      onChange={(e) =>
                        patchActions((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], value: e.target.value };
                          return next;
                        })
                      }
                      placeholder="Value"
                      aria-label="Set value"
                    />
                  </>
                ) : (
                  <NativeSelect
                    className={LOGIC_SELECT_CLASS}
                    value={action.targetFieldId || defaultTargetId}
                    aria-label="Action target field"
                    onChange={(e) =>
                      patchActions((prev) => {
                        const next = [...prev];
                        next[idx] = {
                          ...next[idx],
                          targetFieldId: e.target.value,
                        };
                        return next;
                      })
                    }
                  >
                    {targetQuestions.map((q) => (
                      <NativeSelectOption key={q.id} value={q.id}>
                        {q.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}

                <LogicRowMenu
                  addLabel="Add action"
                  canRemove={actions.length > 1}
                  onAdd={addActionRow}
                  onRemove={() =>
                    patchActions((prev) => prev.filter((_, i) => i !== idx))
                  }
                  onDuplicate={() =>
                    patchActions((prev) => {
                      const next = [...prev];
                      next.splice(idx + 1, 0, { ...prev[idx] });
                      return next;
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
