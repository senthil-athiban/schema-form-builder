import type { FormQuestion } from "@/shared/types";
import { useCallback, useState } from "react";
import { useFormBuilderStore } from "../store/form-builder-store";

export const useMultiOptions = ({pageId, sectionId, question}: {pageId: string, sectionId: string, question: FormQuestion}) => {
    const { updateQuestion } = useFormBuilderStore();
    const options = question.config?.options ?? [];
    const [selectedValue, setSelectedValue] = useState<string>(
        question.defaultValue !== undefined
          ? String(question.defaultValue)
          : options[0]?.value !== undefined
            ? String(options[0].value)
            : "",
      );

  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");

  const updateCurrentQuestion = useCallback(
    (updates: Partial<FormQuestion>) => {
      updateQuestion(pageId, sectionId, question.id, updates);
    },
    [pageId, sectionId, question.id, updateQuestion],
  );

  const resetDraft = () => {
    setNewOptionLabel("");
    setNewOptionValue("");
    setIsAddingOption(false);
  };

  const addOption = () => {
    const label = newOptionLabel.trim();
    if (!label) return;

    const value =
      newOptionValue.trim() ||
      label
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");

    const hasDuplicateValue = options.some(
      (option) => String(option.value) === value,
    );

    if (hasDuplicateValue) {
      return;
    }

    const nextOptions = [
      ...options,
      {
        label,
        value,
        disabled: false,
      },
    ];

    updateCurrentQuestion({
      config: {
        ...question.config,
        options: nextOptions,
      },
    });

    setSelectedValue(String(value));
    setNewOptionLabel("");
    setNewOptionValue("");
    setIsAddingOption(false);
  };

  return {
    newOptionValue,
    newOptionLabel,
    selectedValue,
    isAddingOption,
    setNewOptionValue,
    setNewOptionLabel,
    setSelectedValue,
    setIsAddingOption,
    addOption,
    resetDraft,
  };
};
