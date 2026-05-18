import type {
  ConditionalRule,
  FormPage,
  FormQuestion,
  FormSchema,
  FormSection,
} from "../../shared/types";
import { devtools } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

type SelectedNode = 
    | { type: "page", pageId: string }
    | { type: "section", pageId: string, sectionId: string }
    | { type: "question", pageId: string, sectionId: string, questionId: string }
    | null;

interface FormBuilderState {
  currentForm: FormSchema;
  selection: SelectedNode | null;
  history: {
    past: FormSchema[];
    present: FormSchema;
    future: FormSchema[];
  };
  mode: "edit" | "preview";
  isDragging: boolean;
}

interface FormBuilderActions {
  // Form operations
  setForm: (form: FormSchema) => void;
  updateFormMetadata: (metadata: Partial<FormSchema["metadata"]>) => void;
  updateFormSettings: (settings: Partial<FormSchema["settings"]>) => void;

  // page operations
  addPage: (page: Partial<FormPage>, index?: number) => void;
  updatePage: (id: string, updates: Partial<FormPage>) => void;
  deletePage: (id: string) => void;
  reorderPages: (startIndex: number, endIndex: number) => void;

  // section operations
  addSection: (
    pageId: string,
    section: Partial<FormSection>,
    index?: number,
  ) => void;
  updateSection: (
    pageId: string,
    id: string,
    updates: Partial<FormSection>,
  ) => void;
  deleteSection: (pageId: string, id: string) => void;
  reorderSections: (
    pageId: string,
    startIndex: number,
    endIndex: number,
  ) => void;

  // Question operations
  addQuestion: (
    pageId: string,
    sectionId: string,
    question: Partial<FormQuestion>,
    index?: number,
  ) => void;
  updateQuestion: (
    pageId: string,
    sectionId: string,
    questionId: string,
    updatedQuestion: Partial<FormQuestion>,
  ) => void;
  deleteQuestion: (
    pageId: string,
    sectionId: string,
    questionId: string,
  ) => void;
  reorderQuestions: (
    pageId: string,
    sectionId: string,
    startIndex: number,
    endIndex: number,
  ) => void;

  // Selection
  setSelection: (selection: SelectedNode) => void;

  // Conditional logic
  addConditionalRule: (rule: ConditionalRule) => void;
  updateConditionalRule: (
    id: string,
    updates: Partial<ConditionalRule>,
  ) => void;
  deleteConditionalRule: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // UI
  setMode: (mode: "edit" | "preview") => void;
  setIsDragging: (isDragging: boolean) => void;

  // Reset
  resetForm: () => void;

  // Export
  exportSchema: () => FormSchema;
}

const createEmptyForm = (): FormSchema => ({
  id: uuidv4(),
  version: "1.0.0",
  metadata: {
    title: "Untitled Form",
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: "",
  },
  settings: {
    theme: "modern",
    submitButton: {
      label: "Submit",
      position: "center",
    },
    notifications: {
      success: "Form submitted successfully!",
      error: "Something went wrong. Please try again.",
    },
  },
  pages: [],
  validation: [],
  conditionalLogic: [],
});

const newIso = new Date().toISOString();

const withUpdatedAt = (form: FormSchema): FormSchema => ({
  ...form,
  metadata: {
    ...form.metadata,
    updatedAt: newIso,
  },
});

const reindexPages = (pages: FormPage[]): FormPage[] =>
  pages.map((page, i) => ({ ...page, order: i }));

const reindexSections = (sections: FormSection[]): FormSection[] =>
  sections.map((section, i) => ({ ...section, order: i }));

const reindexQuestions = (questions: FormQuestion[]): FormQuestion[] =>
  questions.map((q, i) => ({ ...q, order: i }));

const moveItem = <T>(arr: T[], from: number, to: number) => {
  const items = [...arr];
  const [removed] = items.splice(from, 1);
  items.splice(to, 0, removed);
  return items;
};

type FormBuilderStore = FormBuilderState & FormBuilderActions
export const useFormBuilderStore = create<FormBuilderStore>()(
  devtools<FormBuilderStore>(
    (set, get) => ({
      currentForm: createEmptyForm(),
      selection: null,
      history: {
        past: [],
        present: createEmptyForm(),
        future: [],
      },
      mode: "edit",
      isDragging: false,

      // page operations
      addPage: (page, index) =>
        set((state) => {
          const pages = [...state.currentForm.pages];
          const newPage: FormPage = {
            id: uuidv4(),
            label: page.label || "New Page",
            sections: [],
            order: index ?? state.currentForm.pages.length,
            hidden: page.hidden ?? false,
          };

          if (index !== undefined && index >= 0 && index < pages.length) {
            pages.splice(index, 0, newPage);
          } else {
            pages.push(newPage);
          }

          const updatedForm = withUpdatedAt({
            ...state.currentForm,
            pages: reindexPages(pages),
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      updatePage: (id: string, updates: Partial<FormPage>) =>
        set((state) => {
          const updatedPages = state.currentForm.pages.map((page) =>
            page.id === id ? { ...page, ...updates } : page,
          );
          const updatedForm = withUpdatedAt({
            ...state.currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      deletePage: (id: string) =>
        set((state) => {
          const pages = state.currentForm.pages.filter(
            (page) => page.id !== id,
          );
          const updatedForm = withUpdatedAt({
            ...state.currentForm,
            pages: reindexPages(pages),
          });
          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      reorderPages: (startIndex: number, endIndex: number) =>
        set((state) => {
          const pages = [...state.currentForm.pages];

          const isValidRange = startIndex >= 0 && endIndex < pages.length;
          if (!isValidRange) return state;

          const reorderedPages = moveItem(pages, startIndex, endIndex);
          const updatedForm = withUpdatedAt({
            ...state.currentForm,
            pages: reindexPages(reorderedPages),
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      // section operations
      addSection: (
        pageId: string,
        section: Partial<FormSection>,
        index?: number,
      ) =>
        set((state) => {
          const updatedPages = state.currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;

            const sections = [...page.sections];
            const newSection: FormSection = {
              id: uuidv4(),
              questions: [],
              hidden: section.hidden ?? false,
              label: section.label ?? "New Section",
              order: index ?? sections.length,
              ...section,
            };

            if (index !== undefined && index >= 0 && index < sections.length) {
              sections.splice(index, 0, newSection);
            } else {
              sections.push(newSection);
            }

            return {
              ...page,
              sections: reindexSections(sections),
            };
          });

          const updatedForm = withUpdatedAt({
            ...state.currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      updateSection: (
        pageId: string,
        sectionId: string,
        updates: Partial<FormSection>,
      ) =>
        set((state) => {
          const updatedPages = state.currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;
            const sections = [...page.sections];
            const updatedSections = sections.map((section) => {
              if (section.id !== sectionId) return section;
              return {
                ...section,
                ...updates,
                id: section.id,
              };
            });
            return {
              ...page,
              sections: reindexSections(updatedSections),
            };
          });
          const updatedForm = withUpdatedAt({
            ...state.currentForm,
            pages: updatedPages,
          });
          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      deleteSection: (pageId: string, sectionId: string) =>
        set((state) => {
          const currentForm = state.currentForm;
          const updatedPages = currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;
            const updatedSections = page.sections.filter(
              (section) => section.id !== sectionId,
            );
            return {
              ...page,
              sections: reindexSections(updatedSections),
            };
          });
          const updatedForm = withUpdatedAt({
            ...currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      reorderSections: (pageId: string, startIndex: number, endIndex: number) =>
        set((state) => {
          let didReorder = false;
          const currentForm = state.currentForm;

          const updatedPages = currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;

            const sections = [...page.sections];
            if (
              startIndex < 0 ||
              endIndex < 0 ||
              startIndex >= sections.length ||
              endIndex >= sections.length ||
              startIndex === endIndex
            ) {
              return page;
            }

            didReorder = true;
            const reorderedSections = moveItem(sections, startIndex, endIndex);
            return {
              ...page,
              sections: reindexSections(reorderedSections),
            };
          });

          if (!didReorder) return state;

          const updatedForm = withUpdatedAt({
            ...currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      // question operations
      addQuestion: (
        pageId: string,
        sectionId: string,
        question: Partial<FormQuestion>,
        index?: number,
      ) =>
        set((state) => {
          let didAdd = false;
          const currentForm = state.currentForm;

          const updatedPages = currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;

            const sections = [...page.sections];

            const updatedSections = sections.map((section) => {
              if (section.id !== sectionId) return section;
              const questions = [...section.questions];
              const newQuestion: FormQuestion = {
                id: uuidv4(),
                type: question.type ?? "text",
                label: question.label ?? "New Question",
                name: question.name ?? `question_${uuidv4().slice(0, 8)}`,
                required: question.required ?? false,
                order: index ?? questions.length,
                width: question.width ?? "100%",
                placeholder: question.placeholder ?? "",
                defaultValue: question.defaultValue ?? "",
                disabled: question.disabled ?? false,
                hidden: question.hidden ?? false,
                config: question.config ?? {},
                validation: question.validation ?? { rules: [] },
                styles: question.styles ?? {},
                ...question,
              };

              if (
                index !== undefined &&
                index >= 0 &&
                index < questions.length
              ) {
                questions.splice(index, 0, newQuestion);
              } else {
                questions.push(newQuestion);
              }

              didAdd = true;
              return {
                ...section,
                questions: reindexQuestions(questions),
              };
            });

            return {
              ...page,
              sections: updatedSections,
            };
          });

          if (!didAdd) return state;

          const updatedForm = withUpdatedAt({
            ...currentForm,
            pages: updatedPages,
          });
          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      updateQuestion: (
        pageId: string,
        sectionId: string,
        questionId: string,
        updatedQuestion: Partial<FormQuestion>,
      ) =>
        set((state) => {
          let didUpdate = false;
          const currentForm = state.currentForm;

          const updatedPages = currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;

            const sections = [...page.sections];

            const updatedSections = sections.map((section) => {
              if (section.id !== sectionId) return section;
              const questions = [...section.questions];

              const updatedQuestions = questions.map((q) => {
                if (q.id !== questionId) return q;

                didUpdate = true;
                return {
                  ...q,
                  ...updatedQuestion,
                  id: q.id,
                  config: updatedQuestion.config
                    ? { ...q.config, ...updatedQuestion.config }
                    : q.config,
                  validation: updatedQuestion.validation
                    ? { ...q.validation, ...updatedQuestion.validation }
                    : q.validation,
                  styles: updatedQuestion.styles
                    ? { ...q.styles, ...updatedQuestion.styles }
                    : q.styles,
                };
              });
              return {
                ...section,
                questions: updatedQuestions,
              };
            });
            return {
              ...page,
              sections: updatedSections,
            };
          });

          if (!didUpdate) return state;

          const updatedForm = withUpdatedAt({
            ...currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      deleteQuestion: (pageId: string, sectionId: string, questionId: string) =>
        set((state) => {
          let didDelete = false;
          const currentForm = state.currentForm;

          const updatedPages = currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;
            const sections = [...page.sections];

            const updatedSections = sections.map((section) => {
              if (section.id !== sectionId) return section;
              const questions = [...section.questions];
              const updatedQuestions = questions.filter(
                (q) => q.id !== questionId,
              );
              const before = section.questions.length;
              if (before !== updatedQuestions.length) {
                didDelete = true;
              }

              return {
                ...section,
                questions: reindexQuestions(updatedQuestions),
              };
            });

            return {
              ...page,
              sections: updatedSections,
            };
          });

          if (!didDelete) return state;

          const updatedForm = withUpdatedAt({
            ...currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      reorderQuestions: (
        pageId: string,
        sectionId: string,
        startIndex: number,
        endIndex: number,
      ) =>
        set((state) => {
          let didReorder = false;
          const currentForm = state.currentForm;

          const updatedPages = currentForm.pages.map((page) => {
            if (page.id !== pageId) return page;
            const sections = [...page.sections];

            const updatedSections = sections.map((section) => {
              if (section.id !== sectionId) return section;
              const questions = [...section.questions];
              if (startIndex < 0 || endIndex < 0 || startIndex >= questions.length || endIndex >= questions.length || startIndex === endIndex) {
                return section;
              }

              didReorder = true;
              const updatedQuestions = moveItem(
                questions,
                startIndex,
                endIndex,
              );
              return {
                ...section,
                questions: reindexQuestions(updatedQuestions),
              };
            });

            return {
              ...page,
              sections: updatedSections,
            };
          });

          if (!didReorder) return state;

          const updatedForm = withUpdatedAt({
            ...currentForm,
            pages: updatedPages,
          });

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      // Form operations
      setForm: (form) =>
        set({
          currentForm: form,
          history: { past: [], present: form, future: [] },
        }),

      updateFormMetadata: (metadata) =>
        set((state) => {
          const updatedForm = {
            ...state.currentForm,
            metadata: {
              ...state.currentForm.metadata,
              ...metadata,
              updatedAt: new Date().toISOString(),
            },
          };
          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      updateFormSettings: (settings) =>
        set((state) => {
          const updatedForm: FormSchema = {
            ...state.currentForm,
            settings: {
              ...state.currentForm.settings,
              ...settings,
            },
            metadata: {
              ...state.currentForm.metadata,
              updatedAt: new Date().toISOString(),
            },
          };

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      setSelection: (selection: SelectedNode) => set({ selection }),

      addConditionalRule: (rule) =>
        set((state) => {
          const updatedForm: FormSchema = {
            ...state.currentForm,
            conditionalLogic: [
              ...(state.currentForm.conditionalLogic || []),
              rule,
            ],
            metadata: {
              ...state.currentForm.metadata,
              updatedAt: new Date().toISOString(),
            },
          };

          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      updateConditionalRule: (id, updates) =>
        set((state) => {
          const conditionalLogic = state.currentForm.conditionalLogic?.map(
            (rule) => (rule.id === id ? { ...rule, ...updates } : rule),
          );
          const updatedForm: FormSchema = {
            ...state.currentForm,
            conditionalLogic,
            metadata: {
              ...state.currentForm.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      deleteConditionalRule: (id) =>
        set((state) => {
          const conditionalLogic = state.currentForm.conditionalLogic?.filter(
            (rule) => rule.id !== id,
          );
          const updatedForm: FormSchema = {
            ...state.currentForm,
            conditionalLogic,
            metadata: {
              ...state.currentForm.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
          return {
            currentForm: updatedForm,
            history: {
              past: [...state.history.past, state.history.present],
              present: updatedForm,
              future: [],
            },
          };
        }),

      undo: () =>
        set((state) => {
          if (state.history.past.length === 0) return state;
          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);
          return {
            currentForm: previous,
            history: {
              past: newPast,
              present: previous,
              future: [state.history.present, ...state.history.future],
            },
          };
        }),

      redo: () =>
        set((state) => {
          if (state.history.future.length === 0) return state;
          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);
          return {
            currentForm: next,
            history: {
              past: [...state.history.past, state.history.present],
              present: next,
              future: newFuture,
            },
          };
        }),

      // UI
      setMode: (mode) => set({ mode }),
      setIsDragging: (isDragging) => set({ isDragging }),

      // Reset
      resetForm: () => {
        const emptyForm = createEmptyForm();
        set({
          currentForm: emptyForm,
          selection: null,
          history: {
            past: [],
            present: emptyForm,
            future: [],
          },
        });
      },

      // Export
      exportSchema: () => get().currentForm,
    }),
    { name: "form-builder-store" },
  ),
);
