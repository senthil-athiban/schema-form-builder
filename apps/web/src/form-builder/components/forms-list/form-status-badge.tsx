import type { FormListItem } from "@/shared/api/types";
import { FORM_STATE_STYLES, getFormState } from "./forms-list.utils";

export const FormStatusBadge: React.FC<{ form: FormListItem }> = ({ form }) => {
  const style = FORM_STATE_STYLES[getFormState(form)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};
