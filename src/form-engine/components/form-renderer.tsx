import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import type { FormSchema } from "../../shared/types";
import { createZodSchema } from "../utils/schemaToZod";
import { useConditionalLogic } from "../hooks/useConditionalLogic";
import { getFieldComponent } from "../utils/fieldRegistry";
import { FieldWrapper } from "./fields/field-wrapper.component";
import { buildDefaultValues, flattenQuestions } from "../utils/helpers";

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  initialData?: Record<string, unknown>;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  onSubmit,
  initialData = {},
}) => {
  const questions = useMemo(() => flattenQuestions(schema), [schema]);
  const defaultValues = useMemo(() => ({ ...initialData, ...buildDefaultValues(schema, initialData) }), [initialData, schema]);

  const sortedPages = useMemo(
    () =>
      [...schema.pages]
        .filter((page) => !page.hidden)
        .sort((a, b) => a.order - b.order),
    [schema.pages],
  );

  const [activePageId, setActivePageId] = useState<string | undefined>(
    sortedPages[0]?.id,
  );

  // Initialize with all fields visible (we'll filter in render)
  const initialVisibleFields = useMemo(() => {
    return new Set(questions.filter((f) => !f.hidden).map((f) => f.id));
  }, [questions]);

  console.log('questions:', questions);

  const initialZodSchema = useMemo(() => {
    return createZodSchema(questions, initialVisibleFields);
  }, [questions, initialVisibleFields]);

  const formMethods = useForm({
    defaultValues,
    resolver: zodResolver(initialZodSchema),
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
    clearErrors,
  } = formMethods;

  // Watch all form values for conditional logic
  const formData = watch();

  // Handle conditional logic
  const { visibleFields, enabledFields } = useConditionalLogic({
    schema,
    questions,
    formData,
  });

  // Update Zod schema when visible fields change
  const currentZodSchema = useMemo(() => {
    return createZodSchema(questions, visibleFields);
  }, [questions, visibleFields]);

  useEffect(() => {
    if (!sortedPages.length) {
      setActivePageId(undefined);
      return;
    }

    if (!activePageId || !sortedPages.some((page) => page.id === activePageId)) {
      setActivePageId(sortedPages[0].id);
    }
  }, [activePageId, sortedPages]);

  const activePage = useMemo(
    () => sortedPages.find((page) => page.id === activePageId) ?? sortedPages[0],
    [activePageId, sortedPages],
  );

  const activePageIndex = activePage
    ? sortedPages.findIndex((page) => page.id === activePage.id)
    : -1;

  const activeSections = useMemo(
    () =>
      activePage
        ? [...activePage.sections]
            .filter((section) => !section.hidden)
            .sort((a, b) => a.order - b.order)
        : [],
    [activePage],
  );

  const activePageVisibleQuestionCount = useMemo(
    () =>
      activeSections.reduce(
        (count, section) =>
          count +
          section.questions.filter((question) => visibleFields.has(question.id))
            .length,
        0,
      ),
    [activeSections, visibleFields],
  );

  useEffect(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (!firstErrorKey) return;

    const questionWithError = questions.find(
      (question) =>
        question.id === firstErrorKey,
    );

    if (
      questionWithError &&
      questionWithError.pageId !== activePageId &&
      sortedPages.some((page) => page.id === questionWithError.pageId)
    ) {
      setActivePageId(questionWithError.pageId);
    }
  }, [activePageId, errors, questions, sortedPages]);

  console.log('watch', formData);

  useEffect(() => {
    schema.conditionalLogic?.forEach((rule) => {
      const conditionsMet = rule.conditions.every((condition) => {
        const field = questions.find((f) => f.id === condition.fieldId);
        if (!field) return false;

        const fieldValue = formData[field.id];

        switch (condition.operator) {
          case "equals":
            return fieldValue === condition.value;
          case "notEquals":
            return fieldValue !== condition.value;
          case "contains":
            return String(fieldValue || "").includes(String(condition.value));
          case "greaterThan":
            return Number(fieldValue) > Number(condition.value);
          case "lessThan":
            return Number(fieldValue) < Number(condition.value);
          case "isEmpty":
            return !fieldValue || fieldValue === "";
          case "isNotEmpty":
            return !!fieldValue && fieldValue !== "";
          default:
            return false;
        }
      });
      console.log('conditionsMet:', conditionsMet)

      if (conditionsMet) {
        rule.actions.forEach((action) => {
          if (action.type === "setValue") {
            const targetField = questions.find(
              (f) => f.id === action.targetFieldId,
            );
            if (targetField) {
              setValue(targetField.id, action.value);
            }
          }
        });
      }
    });
  }, [formData, questions, schema, setValue]);

  // Clear errors for hidden fields
  useEffect(() => {
    questions.forEach((field) => {
      if (
        !visibleFields.has(field.id) &&
        errors[field.id]
      ) {
        clearErrors(field.id);
      }
    });
  }, [visibleFields, errors, clearErrors, questions]);

  const onFormSubmit = async (data: Record<string, unknown>) => {
    try {
      // Validate with current Zod schema (for visible fields only)
      const validatedData = currentZodSchema.parse(data);

      await onSubmit(validatedData);

      if (schema.settings.notifications?.success) {
        console.log(schema.settings.notifications.success);
      }
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Set Zod validation errors
        error.errors.forEach((err) => {
          const fieldName = String(err.path[0]);
          formMethods.setError(fieldName, {
            type: "manual",
            message: String(err.message),
          });
        });
      }

      if (schema.settings.notifications?.error) {
        console.error(schema.settings.notifications.error);
      }
    }
  };

  const onError = (errors: unknown) => {
    console.error(errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit, onError)}
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
      noValidate
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <p className="mb-2 text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
              Form Preview
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {schema.metadata.title}
            </h2>
            {schema.metadata.description && (
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                {schema.metadata.description}
              </p>
            )}
          </div>

          {sortedPages.length > 1 ? (
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {sortedPages.map((page, index) => {
                  const isActive = page.id === activePage?.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setActivePageId(page.id)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {page.label || `Page ${index + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="px-6 py-6 sm:px-8">
            {activePage ? (
              <>
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
                      Page {activePageIndex + 1} of {sortedPages.length}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">
                      {activePage.label || `Page ${activePageIndex + 1}`}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {activePageVisibleQuestionCount} visible question
                    {activePageVisibleQuestionCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-5">
                  {activeSections.map((section, sectionIndex) => (
                    <section
                      key={section.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6"
                    >
                      <div className="mb-5 border-b border-slate-200 pb-3">
                        <p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
                          Section {sectionIndex + 1}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-900">
                          {section.label}
                        </h4>
                      </div>

                      <div className="space-y-1">
                        {[...section.questions]
                          .sort((a, b) => a.order - b.order)
                          .map((question) => {
                            if (!visibleFields.has(question.id)) return null;

                            const FieldComponent = getFieldComponent(question.type);
                            const isDisabled =
                              question.disabled || !enabledFields.has(question.id);
                            const fieldError =
                              errors[question.id]?.message as string | undefined;

                            return (
                              <FieldWrapper
                                key={question.id}
                                label={question.label}
                                required={question.required}
                                error={fieldError}
                                width={question.width}
                                styles={question.styles}
                              >
                                <FieldComponent
                                  field={question}
                                  register={register}
                                  control={control}
                                  disabled={isDisabled}
                                  error={!!fieldError}
                                />
                              </FieldWrapper>
                            );
                          })}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                No visible pages are available in this form.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {sortedPages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    activePageIndex > 0 &&
                    setActivePageId(sortedPages[activePageIndex - 1]?.id)
                  }
                  disabled={activePageIndex <= 0}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous page
                </button>
                <button
                  type="button"
                  onClick={() =>
                    activePageIndex < sortedPages.length - 1 &&
                    setActivePageId(sortedPages[activePageIndex + 1]?.id)
                  }
                  disabled={activePageIndex === -1 || activePageIndex >= sortedPages.length - 1}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next page
                </button>
              </>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Submitting..."
              : schema?.settings?.submitButton?.label || "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
};
