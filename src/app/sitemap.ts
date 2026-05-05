import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages = [
    "/",
    "/core",
    "/demo",
    "/resources/free",
    "/stage/beginner",
    "/stage/intermediate",
    "/stage/advanced",
    "/stage/exam",
    "/stage/spoken",
    "/learn/demo-1",
    "/flashcard/demo-1",
    "/speak/demo-1",
  ];

  return pages.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
