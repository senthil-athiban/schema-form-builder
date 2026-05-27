import React, { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Eye,
  Settings,
  Download,
  Upload,
  Undo,
  Redo,
  Trash2,
  Save,
  FolderOpen,
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useFormBuilderStore } from "../store/form-builder-store";
import { FieldsPalette } from "./fields-palette.component";
import Canvas from "./canvas.component";
import { PropertyPanel } from "./property-panel.component";
import { FormSettings } from "./form-settings.component";
import { FormRenderer } from "../../form-engine/components/form-renderer";
import type { BuilderDragData, FormSchema } from "@/shared/types";
import { ApiError, formsApi, getWorkspaceId } from "@/shared/api";
import { FormsList } from "./forms-list.component";
import { Link, useParams } from "react-router-dom";

export const FormBuilderEditor: React.FC = () => {
  const {
    currentForm,
    addQuestion,
    reorderQuestions,
    deleteQuestion,
    mode,
    setMode,
    undo,
    redo,
    history,
    resetForm,
    exportSchema,
    selection,
    persistedFormId,
    setPersistedFormId,
    openEditorWithForm,
    startNewFormInEditor,
  } = useFormBuilderStore();

  const { formId: routeFormId } = useParams<{ formId?: string }>();

  const [loadFormIdInput, setLoadFormIdInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  const selectedPageId =
    selection?.type === "page" ||
    selection?.type === "section" ||
    selection?.type === "question"
      ? selection.pageId
      : undefined;

  const activePage =
    currentForm.pages.find((p) => p.id === selectedPageId) ??
    currentForm.pages[0];

  const selectedSectionId =
    selection?.type === "section" || selection?.type === "question"
      ? selection.sectionId
      : undefined;

  const activeSection =
    activePage?.sections.find((s) => s.id === selectedSectionId) ??
    activePage?.sections[0];

  // const totalQuestions = currentForm.pages.reduce(
  //   (pageAcc, page) =>
  //     pageAcc +
  //     page.sections.reduce(
  //       (sectionAcc, section) => sectionAcc + section.questions.length,
  //       0,
  //     ),
  //   0,
  // );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const getSection = (pageId: string, sectionId: string) => {
    return currentForm.pages
      .find((p) => p.id === pageId)
      ?.sections.find((s) => s.id === sectionId);
  };

  const getQuestion = (pageId: string, sectionId: string, questionId: string) => {
    return currentForm.pages
      .find((p) => p.id === pageId)
      ?.sections.find((s) => s.id === sectionId)
      ?.questions.find((q) => q.id === questionId);
  };

  const getDropTarget = (over: DragEndEvent["over"]) => {
    const overData = over?.data.current as BuilderDragData;

    if (!overData) return null;
    if (overData.kind === "section" && overData.pageId && overData.sectionId) {
      return {
        pageId: overData.pageId,
        sectionId: overData.sectionId,
        questionId: null,
      };
    }

    if (
      overData.kind === "question-sortable" &&
      overData.pageId &&
      overData.sectionId &&
      overData.questionId
    ) {
      return {
        pageId: overData.pageId,
        sectionId: overData.sectionId,
        questionId: overData.questionId,
      };
    }

    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // console.log("active", active);
    // console.log("over", over);
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current as BuilderDragData;
    const dropTarget = getDropTarget(over);

    if (!activeData || !dropTarget) return;

    if (activeData.kind === "palette-field") {
      if (!dropTarget.pageId || !dropTarget.sectionId) {
        return;
      }

      const targetSection = getSection(dropTarget.pageId, dropTarget.sectionId);
      if (!targetSection) {
        return;
      }

      const insertIndex = dropTarget.questionId
        ? targetSection.questions.findIndex(
            (q) => q.id === dropTarget.questionId,
          ) + 1
        : targetSection.questions.length;
      addQuestion(
        dropTarget.pageId,
        dropTarget.sectionId,
        {
          type: activeData.field.type,
          label: activeData.field.label,
          name: `${activeData.field.type}_${Date.now()}`,
          config: activeData.field.defaultConfig,
        },
        insertIndex >= 0 ? insertIndex : undefined,
      );
    }

    if (activeData.kind === "question-sortable") {
      if (!dropTarget) return;

      // handle swap of questions between sections
      if (activeData.sectionId !== dropTarget.sectionId) {
        // const activeSection = getSection(activeData.pageId, activeData.sectionId);
        const dropTargetSection = getSection(dropTarget.pageId, dropTarget.sectionId);
        const insertIndex = dropTargetSection.questions.length > 0 ? dropTargetSection.questions.length - 1 : 0;
        const questionToSwap = getQuestion(activeData.pageId, activeData.sectionId, activeData.questionId);
        if (!questionToSwap) return;
        
        deleteQuestion(activeData.pageId, activeData.sectionId, activeData.questionId);
        addQuestion(dropTarget.pageId, dropTarget.sectionId, {
          type: questionToSwap.type,
          label: questionToSwap.label,
          name: questionToSwap.name,
          config: questionToSwap.config,
        }, insertIndex);
        return;
      }

      // handle reordering of questions within a section
      const targetSection = getSection(dropTarget.pageId, dropTarget.sectionId);
      
      if (!targetSection) {
        return;
      }

      const oldIndex = targetSection.questions.findIndex(
        (q) => q.id === activeData.questionId,
      );
      const newIndex =
        dropTarget.questionId == null
          ? targetSection.questions.length - 1
          : targetSection.questions.findIndex(
              (question) => question.id === dropTarget.questionId,
            );


      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }
      reorderQuestions(
        dropTarget.pageId,
        dropTarget.sectionId,
        oldIndex,
        newIndex,
      );
    }
  };

  const handleExport = () => {
    const schema = exportSchema();
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema.metadata.title.replace(/\s+/g, "_").toLowerCase()}_schema.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const schema = JSON.parse(event.target?.result as string);
            useFormBuilderStore.getState().setForm(schema);
          } catch {
            alert("Invalid JSON file");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const buildSchemaForSave = (): FormSchema => {
    const schema = exportSchema();
    return {
      ...schema,
      metadata: {
        ...schema.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
  };

  const loadFormById = useCallback(
    async (formId: string) => {
      setIsLoadingForm(true);
      try {
        const { data } = await formsApi.getById(formId);
        openEditorWithForm(data.form.id, data.schema);
        setLoadFormIdInput(data.form.id);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Failed to load form";
        alert(message);
      } finally {
        setIsLoadingForm(false);
      }
    },
    [openEditorWithForm],
  );

  useEffect(() => {
    if (!routeFormId) {
      startNewFormInEditor();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadFormIdInput("");
      return;
    }

    void loadFormById(routeFormId);
  }, [routeFormId, loadFormById, startNewFormInEditor]);

  const handleLoadForm = async () => {
    const formId = loadFormIdInput.trim();
    if (!formId) {
      alert("Enter a form ID to load");
      return;
    }
    await loadFormById(formId);
  };

  const handleNewForm = () => {
    if (
      !window.confirm(
        "Start a new form? Unsaved changes to the current draft will be lost.",
      )
    ) {
      return;
    }
    startNewFormInEditor();
    setLoadFormIdInput("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const schema = buildSchemaForSave();
      const workspaceId = getWorkspaceId();
      const payload = { workspaceId, schema };

      if (persistedFormId) {
        const { data } = await formsApi.update(persistedFormId, payload);
        const versionMsg = data.versionCreated
          ? ` (version ${data.formVersion.version})`
          : "";
        alert(`Form updated successfully${versionMsg}`);
      } else {
        const { data } = await formsApi.create(payload);
        setPersistedFormId(data.form.id);
        setLoadFormIdInput(data.form.id);

        const url = new URL(window.location.href);
        url.searchParams.set("formId", data.form.id);
        window.history.replaceState({}, "", url);

        alert("Form created successfully!");
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to save form";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (
      !window.confirm(
        "Are you sure you want to clear the form? This cannot be undone.",
      )
    ) {
      return;
    }
    resetForm();
    setLoadFormIdInput("");
    const url = new URL(window.location.href);
    url.searchParams.delete("formId");
    window.history.replaceState({}, "", url);
  };

  const iconButtonClass =
    "flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";
  const toolButtonClass =
    "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex h-screen flex-col bg-slate-50 my-2">
      {/* Top Bar */}
      <div className="flex min-h-[64px] items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm py-2">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/forms">
          <button
            type="button"
            title="All forms"
            className={toolButtonClass}
          >
            <ArrowLeft size={16} />
            All forms
          </button>
          </Link>
          {/* <h1 className="text-xl font-bold text-slate-900">📋 Form Builder</h1> */}
          {/* <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {totalQuestions} questions
          </span> */}
          {persistedFormId ? (
            <span
              className="max-w-[200px] truncate rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              title={persistedFormId}
            >
              ID: {persistedFormId}
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
              Unsaved new form
            </span>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={loadFormIdInput}
              onChange={(e) => setLoadFormIdInput(e.target.value)}
              placeholder="Form ID to load"
              className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => void handleLoadForm()}
              disabled={isLoadingForm}
              title="Load form"
              className={toolButtonClass}
            >
              {isLoadingForm ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FolderOpen size={16} />
              )}
              Load
            </button>
            <button
              type="button"
              onClick={handleNewForm}
              title="New form"
              className={toolButtonClass}
            >
              <Plus size={16} />
              New
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setMode("edit")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === "edit"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === "preview"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={undo}
            disabled={history.past.length === 0}
            title="Undo"
            className={iconButtonClass}
          >
            <Undo size={16} />
          </button>

          <button
            onClick={redo}
            disabled={history.future.length === 0}
            title="Redo"
            className={iconButtonClass}
          >
            <Redo size={16} />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Form Settings"
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              showSettings
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={handleImport}
            title="Import JSON"
            className={toolButtonClass}
          >
            <Upload size={16} />
            Import
          </button>

          <button
            onClick={handleExport}
            title="Export JSON"
            className={toolButtonClass}
          >
            <Download size={16} />
            Export
          </button>

          <button
            onClick={handleClear}
            title="Clear Form"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {persistedFormId ? "Update Form" : "Save Form"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {mode === "edit" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Left: Fields Palette */}
            <FieldsPalette fieldsEnabled={Boolean(activeSection)} />

            {/* Center: Canvas */}
            <Canvas />

            {/* Right: Property Panel or Settings */}
            {showSettings ? (
              <div className="h-full w-[350px] overflow-y-auto border-l border-slate-200 bg-slate-50">
                <div className="border-b border-slate-200 bg-white px-6 py-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Form Settings
                  </h3>
                </div>
                <FormSettings />
              </div>
            ) : (
              <PropertyPanel />
            )}

            <DragOverlay>
              {activeId ? (
                <div className="rounded-xl border-2 border-indigo-500 bg-white px-4 py-3 text-sm font-medium text-indigo-700 shadow-xl opacity-90">
                  Dragging...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          // Preview Mode
          <div className="flex-1 overflow-y-auto bg-white p-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  📋 <strong>Preview Mode:</strong> This is how your form will
                  look to users. Switch to Edit mode to make changes.
                </p>
              </div>

              <FormRenderer
                schema={currentForm}
                onSubmit={(data) => {
                  console.log("Form submitted:", data);
                  alert("Form submitted! Check console for data.");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const FormBuilder: React.FC = () => {
  const activeView = useFormBuilderStore((state) => state.activeView);
  const openEditorWithForm = useFormBuilderStore(
    (state) => state.openEditorWithForm,
  );
  // const params = useParam

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("formId");
    if (!fromUrl) return;

    let cancelled = false;
    void formsApi
      .getById(fromUrl)
      .then(({ data }) => {
        if (cancelled) return;
        openEditorWithForm(data.form.id, data.schema);
      })
      .catch(() => {
        if (cancelled) return;
        const url = new URL(window.location.href);
        url.searchParams.delete("formId");
        window.history.replaceState({}, "", url);
      });

    return () => {
      cancelled = true;
    };
  }, [openEditorWithForm]);

  if (activeView === "list") {
    return <FormsList />;
  }

  return <FormBuilderEditor />;
};
