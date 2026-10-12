import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { submissionsApi } from "@/shared/api/submissions.api";
import type { SubmissionFilters } from "@/shared/api/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { toFileName } from "./submissions.utils";

interface ExportMenuProps {
  formId: string;
  formName: string;
  filters: SubmissionFilters;
  disabled?: boolean;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ formId, formName, filters, disabled }) => {
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(format);
    try {
      const blob = await submissionsApi.export(formId, format, filters);
      saveBlob(blob, toFileName(formName, format));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || exporting !== null}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-slate-500">Matches current filters</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => void handleExport("csv")}>
          <FileSpreadsheet />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleExport("json")}>
          <FileText />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
