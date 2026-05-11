import { useMultiOptions } from "@/form-builder/hooks/use-multi-options";
import { getWidthStyle } from "@/form-builder/utils";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import type { FormQuestion } from "@/shared/types";
import { useMemo } from "react";
import AddNewOption from "../actions/add-new-option.component";

const LiveRadioField = ({
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
      <RadioGroup
        value={selectedValue}
        onValueChange={setSelectedValue}
        className="gap-3"
        disabled={question.disabled}
      >
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">No options yet</p>
        ) : (
          options.map((opt) => (
            <div key={String(opt.value)} className="flex items-center gap-2">
              <RadioGroupItem
                value={String(opt.value)}
                id={`${question.id}-${opt.value}`}
                disabled={question.disabled || opt.disabled}
              />
              <Label
                htmlFor={`${question.id}-${opt.value}`}
                className={`font-normal text-muted-foreground ${
                  question.disabled || opt.disabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                {opt.label}
              </Label>
            </div>
          ))
        )}
      </RadioGroup>
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

export default LiveRadioField;
