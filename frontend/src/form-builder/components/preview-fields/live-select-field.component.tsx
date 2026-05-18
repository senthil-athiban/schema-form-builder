import { useMemo } from "react";
import type { FormQuestion } from "@/shared/types";
import { getWidthStyle } from "@/form-builder/utils";
import { useMultiOptions } from "@/form-builder/hooks/use-multi-options";
import AddNewOption from "../actions/add-new-option.component";

const LiveSelectField = ({
  pageId,
  sectionId,
  question,
}: {
  pageId: string;
  sectionId: string;
  question: FormQuestion;
}) => {

  const options = useMemo(() => question.config?.options ?? [], [question.config]);

  const {
    newOptionValue,
    selectedValue,
    setSelectedValue,
    setNewOptionLabel,
    isAddingOption,
    setIsAddingOption,
    newOptionLabel,
    setNewOptionValue,
    addOption,
    resetDraft,
  } = useMultiOptions({ pageId, sectionId, question });

  return (
    <div className="space-y-2" style={getWidthStyle(question.width)}>
      <select
        className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-none outline-none"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        disabled={question.disabled}
      >
        {options.length === 0 ? (
          <option value="">Select...</option>
        ) : (
          <>
            {!question.required && (
              <option value="">
                {question.placeholder || "Select..."}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={String(opt.value)}
                value={String(opt.value)}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>

      <AddNewOption
        isAddingOption={isAddingOption}
        newOptionLabel={newOptionLabel}
        newOptionValue={newOptionValue}
        setNewOptionLabel={setNewOptionLabel}
        setNewOptionValue={setNewOptionValue}
        addOption={addOption}
        resetDraft={resetDraft}
        setIsAddingOption={setIsAddingOption}
      />
    </div>
  );
};

export default LiveSelectField;