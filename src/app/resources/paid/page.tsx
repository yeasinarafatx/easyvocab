"use client";
import React from "react";
import resources from "@/data/resources.json";
import { useRouter } from "next/navigation";

export default function PaidResourcesPage() {
  const paid = (resources as any[])
    .filter((r) => !r.is_free && r.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const router = useRouter();

  const handleClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    // For now redirect unpaid users to /payment. Paid flow not implemented yet.
    router.push("/payment");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-slate-100">Paid PDF / Ebooks</h1>
      <p className="mt-2 text-sm text-slate-300">Click a file title to purchase and download.</p>

      <ul className="mt-6 space-y-3">
        {paid.map((item) => (
          <li key={item.id} className="rounded-md border border-white/6 bg-white/3 p-3">
            <a href="#" onClick={(e) => handleClick(e, item)} className="text-base font-semibold text-slate-100">
              {item.title}
            </a>
            <div className="mt-1 text-xs text-slate-300">{(item.size_bytes / 1024).toFixed(1)} KB</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
