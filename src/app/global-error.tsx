"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f1a] text-slate-100">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
          <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-red-500/30 bg-red-500/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">Global Error</p>
            <h1 className="mt-2 text-3xl font-extrabold text-red-100">অ্যাপে একটি সমস্যা হয়েছে</h1>
            <p className="mt-3 text-sm leading-6 text-red-100/80">
              পেজটি ঠিকমতো লোড হয়নি। আপনি আবার চেষ্টা করতে পারেন বা হোম পেজে ফিরে যেতে পারেন।
            </p>

            {process.env.NODE_ENV === "development" && (
              <pre className="mt-5 overflow-auto rounded-2xl bg-black/50 p-4 text-xs text-red-100">
                {error.message}
              </pre>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={reset}
                className="flex-1 rounded-xl bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
              >
                আবার চেষ্টা করুন
              </button>
              <Link
                href="/"
                className="flex-1 rounded-xl bg-slate-500/20 px-4 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-slate-500/30"
              >
                Home এ যান
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}