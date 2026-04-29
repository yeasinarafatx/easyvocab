import React from "react";
import resources from "@/data/resources.json";

export default function FreeResourcesPage() {
  const free = (resources as any[])
    .filter((r) => r.is_free && r.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-slate-100">Free PDF / Ebooks</h1>
      <p className="mt-2 text-sm text-slate-300">Click a file title to download.</p>

      <ul className="mt-6 space-y-3">
        {free.map((item) => (
          <li key={item.id} className="rounded-md border border-white/6 bg-white/3 p-3">
            <a href={item.file} className="text-base font-semibold text-slate-100" download>
              {item.title}
            </a>
            <div className="mt-1 text-xs text-slate-300">{(item.size_bytes / 1024).toFixed(1)} KB</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
