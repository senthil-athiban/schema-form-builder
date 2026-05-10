import { useFormBuilderStore } from "../store/form-builder-store";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CanvasField } from "./canvas-field.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";

type CanvasModalMode = "setup" | "page" | "section";

const Canvas = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CanvasModalMode>("setup");
  const [pageTitleInput, setPageTitleInput] = useState("");
  const [sectionTitleInput, setSectionTitleInput] = useState("");

  const { currentForm, selection, setSelection, addPage, addSection } =
    useFormBuilderStore();
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });
  const selectedPageId =
    selection?.type === "page" ||
    selection?.type === "section" ||
    selection?.type === "question"
      ? selection.pageId
      : undefined;

  const activePage =
    currentForm.pages.find((page) => page.id === selectedPageId) ??
    currentForm.pages[0];

  const activeSections = activePage?.sections ?? [];
  const hasSections = activeSections.length > 0;
  const isEmpty = activeSections.every((q) => q.questions.length === 0);

  const closeModal = () => {
    setModalOpen(false);
    setPageTitleInput("");
    setSectionTitleInput("");
  };

  const openSetupModal = () => {
    setModalMode("setup");
    setPageTitleInput("");
    setSectionTitleInput("");
    setModalOpen(true);
  };

  const openPageModal = () => {
    setModalMode("page");
    setPageTitleInput("");
    setModalOpen(true);
  };

  const openSectionModal = () => {
    if (!activePage) return;
    setModalMode("section");
    setSectionTitleInput("");
    setModalOpen(true);
  };

  const handleSubmitModal = () => {
    if (modalMode === "setup") {
      const pt = pageTitleInput.trim();
      const st = sectionTitleInput.trim();
      if (!pt || !st) {
        alert("Please enter both a page title and a section title.");
        return;
      }
      addPage({ label: pt });
      const updatedPages = useFormBuilderStore.getState().currentForm.pages;
      const newPage = updatedPages[updatedPages.length - 1];
      if (!newPage) return;
      addSection(newPage.id, { label: st });
      const pageAfter = useFormBuilderStore
        .getState()
        .currentForm.pages.find((p) => p.id === newPage.id);
      const newSection =
        pageAfter?.sections[pageAfter.sections.length - 1];
      if (newSection) {
        setSelection({
          type: "section",
          pageId: newPage.id,
          sectionId: newSection.id,
        });
      }
      closeModal();
      return;
    }

    if (modalMode === "page") {
      const pt = pageTitleInput.trim();
      if (!pt) {
        alert("Please enter a page title.");
        return;
      }
      addPage({ label: pt });
      const updatedPages = useFormBuilderStore.getState().currentForm.pages;
      const newlyCreatedPage = updatedPages[updatedPages.length - 1];
      if (newlyCreatedPage) {
        setSelection({ type: "page", pageId: newlyCreatedPage.id });
      }
      closeModal();
      return;
    }

    if (modalMode === "section") {
      if (!activePage) return;
      const st = sectionTitleInput.trim();
      if (!st) {
        alert("Please enter a section title.");
        return;
      }
      addSection(activePage.id, { label: st });
      const updatedPage = useFormBuilderStore
        .getState()
        .currentForm.pages.find((page) => page.id === activePage.id);
      const newlyCreatedSection =
        updatedPage?.sections[updatedPage.sections.length - 1];
      if (newlyCreatedSection) {
        setSelection({
          type: "section",
          pageId: activePage.id,
          sectionId: newlyCreatedSection.id,
        });
      }
      closeModal();
    }
  };

  const modalCopy =
    modalMode === "setup"
      ? {
          title: "Create your first page",
          description:
            "Enter a page title and a section title before you add fields.",
        }
      : modalMode === "page"
        ? {
            title: "Add page",
            description: "Enter a title for the new page.",
          }
        : {
            title: "Add section",
            description: "Enter a title for the new section.",
          };

  return (
    <>
      <main
        ref={setNodeRef}
        className={`min-h-full flex-1 overflow-y-auto p-8 transition-colors ${
          isOver ? "bg-slate-100" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 border-b-2 border-slate-200 pb-4">
            <h2 className="mb-1 text-2xl font-semibold text-slate-900">
              {currentForm.metadata.title}
            </h2>
            {currentForm.metadata.description && (
              <p className="text-sm text-slate-500">
                {currentForm.metadata.description}
              </p>
            )}
          </div>

          {currentForm.pages.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {currentForm.pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() =>
                    setSelection({ type: "page", pageId: page.id })
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    activePage?.id === page.id
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {page.label || `Page ${index + 1}`}
                </button>
              ))}
              <button
                onClick={openPageModal}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
              >
                + Add Page
              </button>
              {activePage ? (
                <button
                  onClick={openSectionModal}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  + Add Section
                </button>
              ) : null}
            </div>
          ) : null}

          {!activePage ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
              <div className="mb-4 text-5xl">🗂️</div>
              <h3 className="mb-2 text-lg font-medium text-slate-700">
                No pages created yet
              </h3>
              <p className="text-sm text-slate-500">
                Create a page and section first to start building your form.
              </p>
              <button
                onClick={openSetupModal}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Create first page & section
              </button>
            </div>
          ) : !hasSections ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
              <div className="mb-4 text-5xl">🧱</div>
              <h3 className="mb-2 text-lg font-medium text-slate-700">
                No sections in this page
              </h3>
              <p className="text-sm text-slate-500">
                Add a section (with a title) before you drop fields.
              </p>
              <button
                onClick={openSectionModal}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Add first section
              </button>
            </div>
          ) : isEmpty ? (
            <div
              className={`rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all ${
                isOver
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <div className="mb-4 text-5xl">📋</div>
              <h3 className="mb-2 text-lg font-medium text-slate-700">
                Drop fields here to start building
              </h3>
              <p className="text-sm text-slate-500">
                Drag field types from the left panel to create your form
              </p>
            </div>
          ) : (
            activeSections.map((section) => (
              <div
                key={section.id}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="mb-3 border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {section.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {section.questions.length} question
                    {section.questions.length === 1 ? "" : "s"}
                  </p>
                </div>

                <SortableContext
                  items={section.questions.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-4">
                    {section.questions
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <CanvasField
                          key={field.id}
                          question={field}
                          pageId={activePage.id}
                          sectionId={section.id}
                        />
                      ))}
                  </div>
                </SortableContext>
              </div>
            ))
          )}
        </div>
      </main>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalCopy.title}</DialogTitle>
            <DialogDescription>{modalCopy.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {(modalMode === "setup" || modalMode === "page") && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="canvas-page-title">Page title</Label>
                <Input
                  id="canvas-page-title"
                  type="text"
                  value={pageTitleInput}
                  placeholder="e.g. Contact details"
                  onChange={(e) => setPageTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitModal();
                    }
                  }}
                />
              </div>
            )}
            {(modalMode === "setup" || modalMode === "section") && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="canvas-section-title">Section title</Label>
                <Input
                  id="canvas-section-title"
                  type="text"
                  value={sectionTitleInput}
                  placeholder="e.g. Personal information"
                  onChange={(e) => setSectionTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitModal();
                    }
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitModal}>
              {modalMode === "setup"
                ? "Create page & section"
                : modalMode === "page"
                  ? "Add page"
                  : "Add section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Canvas;
