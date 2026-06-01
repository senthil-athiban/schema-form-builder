import type { FormQuestion } from "@/shared/types";

export function getWidthStyle(width: FormQuestion["width"]): React.CSSProperties {
  if (!width || width === "100%") return { width: "100%" };
  return { width, maxWidth: "100%" };
}
