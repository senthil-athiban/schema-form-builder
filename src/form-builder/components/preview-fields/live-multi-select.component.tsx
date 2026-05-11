import { useMultiOptions } from "@/form-builder/hooks/use-multi-options";
import { getWidthStyle } from "@/form-builder/utils";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import type { FormQuestion } from "@/shared/types";
import React, { useMemo } from "react";
import AddNewOption from "../actions/add-new-option.component";

const LiveMultiSelect = ({
  pageId,
  sectionId,
  question,
}: {
  pageId: string;
  sectionId: string;
  question: FormQuestion;
}) => {
  const options = useMemo(
    () => question.config?.options ?? [],
    [question.config],
  );
  const {
    newOptionValue,
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
      <div className="flex flex-col gap-2">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">No options yet</p>
        ) : (
          options.map((opt) => (
            <div key={String(opt.value)} className="flex items-center gap-2">
              <Checkbox id={`${question.id}-ms-${opt.value}`} />
              <Label
                htmlFor={`${question.id}-ms-${opt.value}`}
                className="font-normal text-muted-foreground"
              >
                {opt.label}
              </Label>
            </div>
          ))
        )}
      </div>
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

export default LiveMultiSelect;
