import { Plus, X } from "lucide-react";

interface AddNewOptionProps {
  isAddingOption: boolean;
  newOptionLabel: string;
  newOptionValue: string;
  setNewOptionLabel: (value: string) => void;
  setNewOptionValue: (value: string) => void;
  addOption: () => void;
  resetDraft: () => void;
  setIsAddingOption: (value: boolean) => void;
}
const AddNewOption = ({
  isAddingOption,
  newOptionLabel,
  newOptionValue,
  setNewOptionLabel,
  setNewOptionValue,
  addOption,
  resetDraft,
  setIsAddingOption,
}: AddNewOptionProps) => {
  return isAddingOption ? (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={newOptionLabel}
          onChange={(e) => setNewOptionLabel(e.target.value)}
          placeholder="Option label"
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
            if (e.key === "Escape") {
              resetDraft();
            }
          }}
          autoFocus
        />
        <input
          type="text"
          value={newOptionValue}
          onChange={(e) => setNewOptionValue(e.target.value)}
          placeholder="Value (optional)"
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs outline-none ring-indigo-100 transition focus:border-indigo-400 focus:ring-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
            if (e.key === "Escape") {
              resetDraft();
            }
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={14} />
            Save option
          </button>
          <button
            type="button"
            onClick={resetDraft}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setIsAddingOption(true)}
      className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-indigo-600 hover:text-indigo-700"
    >
      <Plus size={14} />
      Add option
    </button>
  );
};

export default AddNewOption;
