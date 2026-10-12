import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageNumbers } from "./submissions.utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const pageButtonClass = "flex h-9 w-9 items-center justify-center rounded-lg font-medium disabled:opacity-40";

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, disabled }) => (
  <nav className="flex items-center gap-1" aria-label="Pagination">
    <button
      type="button"
      onClick={() => onPageChange(page - 1)}
      disabled={disabled || page <= 1}
      aria-label="Previous page"
      className={`${pageButtonClass} text-slate-500 hover:bg-slate-100`}
    >
      <ChevronLeft size={16} />
    </button>
    {getPageNumbers(page, totalPages).map((item, i) =>
      item === "gap" ? (
        <span key={`gap-${i}`} className="px-1 text-slate-400">
          …
        </span>
      ) : (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          disabled={disabled}
          aria-current={item === page ? "page" : undefined}
          className={`${pageButtonClass} ${
            item === page ? "border border-indigo-200 bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {item}
        </button>
      ),
    )}
    <button
      type="button"
      onClick={() => onPageChange(page + 1)}
      disabled={disabled || page >= totalPages}
      aria-label="Next page"
      className={`${pageButtonClass} text-slate-500 hover:bg-slate-100`}
    >
      <ChevronRight size={16} />
    </button>
  </nav>
);
