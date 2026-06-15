export function getPublicSiteUrl() {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function buildFormLink(businessName: string) {
  const base = getPublicSiteUrl();
  if (!base || !businessName.trim()) return "";
  return `${base}/?usaha=${encodeURIComponent(businessName.trim())}`;
}
