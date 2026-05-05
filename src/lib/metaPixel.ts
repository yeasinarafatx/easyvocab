const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "980999427776233";

type MetaPixelParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function getMetaPixelId() {
  return META_PIXEL_ID;
}

export function isMetaPixelEnabled() {
  return Boolean(META_PIXEL_ID);
}

export function trackMetaEvent(eventName: string, params: MetaPixelParams = {}) {
  if (typeof window === "undefined") return;

  const fbq = window.fbq;
  if (typeof fbq !== "function") return;

  fbq("track", eventName, params);
}
