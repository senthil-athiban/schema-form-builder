import { useFormBuilderStore } from "../store/form-builder-store";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CanvasField } from "./canvas-field.component";

const Canvas = () => {
  const { currentForm, selection } = useFormBuilderStore();
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });
  const selectedPageId = selection.type === "page" ? selection.pageId : currentForm.pages[0].id;
  const activePage = currentForm.pages.find(
    (page) => page.id === selectedPageId,
  );
  const activeSections = activePage.sections ?? [];
  const isEmpty = activeSections.every((q) => q.questions.length === 0);

  return (
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

        {isEmpty ? (
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
            <SortableContext
              items={section.questions.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {section.questions
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <CanvasField key={field.id} question={field} pageId={activePage.id} sectionId={section.id} />
                  ))}
              </div>
            </SortableContext>
          ))
        )}
      </div>
    </main>
  );
};

export default Canvas;
