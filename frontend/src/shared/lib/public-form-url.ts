export function getPublicFormPath(token: string): string {
  return `/f/${token}`;
}

export function getPublicFormUrl(token: string): string {
  const base =
    import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ??
    window.location.origin;
  return `${base}${getPublicFormPath(token)}`;
}
