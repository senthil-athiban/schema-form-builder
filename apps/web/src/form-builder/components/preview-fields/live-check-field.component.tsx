import { useMultiOptions } from "@/form-builder/hooks/use-multi-options";
import { getWidthStyle } from "@/form-builder/utils";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import type { FormQuestion } from "@/shared/types";
import React, { useMemo } from "react";
import AddNewOption from "../actions/add-new-option.component";

const LiveCheckField = ({
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
  //   const previewWrap =
  return (
    <div className="space-y-2" style={getWidthStyle(question.width)}>
      {options.length > 0 ? (
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <div key={String(opt.value)} className="flex items-center gap-2">
              <Checkbox
                // value={selectedValue}
                // // onCheckedChange={setSelectedValue}
                disabled={question.disabled || opt.disabled}
                id={`${question.id}-cb-${opt.value}`}
              />
              <Label
                htmlFor={`${question.id}-cb-${opt.value}`}
                className="font-normal text-muted-foreground"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Checkbox checked={false} disabled id={`${question.id}-single`} />
          <Label htmlFor={`${question.id}-single`} className="font-normal">
            Checkbox
          </Label>
        </div>
      )}

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

export default LiveCheckField;
