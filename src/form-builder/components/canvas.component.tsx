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
import type { FormSection } from "@/shared/types";

type CanvasModalMode = "page" | "section";

interface SectionDropZoneProps {
  pageId: string;
  section: FormSection;
  children: React.ReactNode;
}
const SectionDropZone = ({
  pageId,
  section,
  children,
}: SectionDropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-drop-${section.id}`,
    data: {
      kind: "section",
      pageId,
      sectionId: section.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mb-4 rounded-xl border p-4 transition-colors ${
        isOver
          ? "border-indigo-300 bg-indigo-50/60"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      {children}
    </div>
  );
};

const Canvas = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CanvasModalMode>("page");
  const [pageTitleInput, setPageTitleInput] = useState("");
  const [sectionTitleInput, setSectionTitleInput] = useState("");

  const { currentForm, selection, setSelection, addPage, addSection } =
    useFormBuilderStore();
  // const { setNodeRef, isOver } = useDroppable({
  //   id: "canvas-drop-zone",
  // });
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
  // const isEmpty = activeSections.every((q) => q.questions.length === 0);

  const closeModal = () => {
    setModalOpen(false);
    setPageTitleInput("");
    setSectionTitleInput("");
  };

  const openPageModal = () => {
    setModalMode("page");
    setPageTitleInput("");
    setSectionTitleInput("");
    setModalOpen(true);
  };

  const openSectionModal = () => {
    if (!activePage) return;
    setModalMode("section");
    setSectionTitleInput("");
    setModalOpen(true);
  };

  const handleSubmitModal = () => {
    if (modalMode === "page") {
      const pt = pageTitleInput.trim();
      if (!pt) {
        alert("Please enter a page name.");
        return;
      }
      addPage({ label: pt });
      const updatedPages = useFormBuilderStore.getState().currentForm.pages;
      const newlyCreatedPage = updatedPages[updatedPages.length - 1];
      if (!newlyCreatedPage) return;
      setSelection({ type: "page", pageId: newlyCreatedPage.id });
      setPageTitleInput("");
      setSectionTitleInput("");
      setModalMode("section");
      setModalOpen(true);
      return;
    }

    if (modalMode === "section") {
      if (!activePage) return;
      const st = sectionTitleInput.trim();
      if (!st) {
        alert("Please enter a section name.");
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

  const modalTitle =
    modalMode === "page" ? "Name your page" : "Name your section";

  const modalDescription =
    modalMode === "page"
      ? "Step 1 of 3: create a page. Next you will name a section, then you can add answers (fields)."
      : `Step 2 of 3: add a section to "${activePage?.label || "this page"}". After this you can drag field types from the left as answers.`;

  return (
    <>
      <main
        // ref={setNodeRef}
        className={`min-h-full flex-1 overflow-y-auto p-8 transition-colors ${"bg-white"}`}
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

          <p className="mb-4 text-xs font-medium tracking-wide text-slate-500 uppercase">
            Build order: <span className="text-slate-800">Page</span>
            <span className="mx-1.5 text-slate-400">→</span>
            <span className="text-slate-800">Section</span>
            <span className="mx-1.5 text-slate-400">→</span>
            <span className="text-slate-800">Answers (fields)</span>
          </p>

          {currentForm.pages.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {currentForm.pages.map((page, index) => (
                <button
                  key={page.id}
                  type="button"
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
                type="button"
                onClick={openPageModal}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
              >
                + Add page
              </button>
            </div>
          ) : null}

          {activePage && !hasSections ? (
            <div
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              <strong className="font-semibold">Next:</strong> name a section
              for &quot;{activePage.label || "this page"}&quot; using{" "}
              <strong>+ Add section</strong> below, or the button in the empty
              area.
            </div>
          ) : null}

          {!activePage ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
              <div className="mb-4 text-5xl">🗂️</div>
              <h3 className="mb-2 text-lg font-medium text-slate-700">
                Start with a page
              </h3>
              <p className="text-sm text-slate-500">
                Step 1: name your first page. Then you will name a section
                before adding any answers.
              </p>
              <button
                type="button"
                onClick={openPageModal}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Create first page
              </button>
            </div>
          ) : !hasSections ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">
              <div className="mb-4 text-5xl">🧱</div>
              <h3 className="mb-2 text-lg font-medium text-slate-700">
                Add a section on this page
              </h3>
              <p className="text-sm text-slate-500">
                Step 2: sections hold your questions. Use{" "}
                <strong>+ Add section</strong> in the bar above, or here.
              </p>
              <button
                type="button"
                onClick={openSectionModal}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Name first section
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSections.map((section) => (
                <SectionDropZone
                  pageId={activePage.id}
                  section={section}
                  key={section.id}
                >
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

                    {section.questions.length > 0 ? (
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
                    ) : (
                      <div className="text-sm text-slate-600">
                        Add your first question
                      </div>
                    )}
                  </div>
                </SectionDropZone>
              ))}
              {activePage ? (
                <button
                  type="button"
                  onClick={openSectionModal}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  title="Add another section on this page"
                >
                  + Add new section
                </button>
              ) : null}
            </div>
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
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {modalMode === "page" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="canvas-page-title">Page name</Label>
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
                  autoFocus
                />
              </div>
            )}
            {modalMode === "section" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="canvas-section-title">Section name</Label>
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
                  autoFocus
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitModal}>
              {modalMode === "page" ? "Continue" : "Add section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Canvas;
