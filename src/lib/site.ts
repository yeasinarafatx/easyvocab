export const siteConfig = {
  name: "Vocab Speak",
  shortName: "Vocab Speak",
  description:
    "Learn English vocabulary fast with interactive spelling, voice pronunciation, flashcards, and exam-focused practice for IELTS, GRE, SAT, BCS, and Admission.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://easyvocab.com",
  locale: "en_US",
  defaultImage: "/og/og-image.png",
};

export function getSiteUrl() {
  return siteConfig.url.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
