export const siteConfig = {
  name: "Vocab Speak",
  shortName: "Vocab Speak",
  description:
    "Learn English vocabulary fast with interactive spelling, voice pronunciation, flashcards, and exam-focused practice for IELTS, GRE, SAT, BCS, and Admission.",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://www.vocabspeak.me"),
  locale: "en_US",
  defaultImage: "/og/og-image.png",
};

function normalizeSiteUrl(value: string) {
  const trimmed = value.replace(/\/$/, "");

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname === "vocabspeak.me") {
      parsed.hostname = "www.vocabspeak.me";
      return parsed.toString().replace(/\/$/, "");
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export function getSiteUrl() {
  return siteConfig.url.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
