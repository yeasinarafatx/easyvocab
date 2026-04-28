import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
};

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <Link href="/" className="mx-auto mb-6 flex w-fit justify-center">
            <div className="flex items-center justify-center rounded-[20px] border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/55 to-cyan-400/10 px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-4 sm:py-3">
              <img
                src="/og/og-image.png"
                alt="Easy Vocab"
                className="h-auto w-[180px] max-w-none sm:w-[210px] lg:w-[240px]"
              />
            </div>
          </Link>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-100">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <p className="mt-6 text-sm text-slate-300">
            {footerText}{" "}
            <Link href={footerLinkHref} className="font-semibold text-cyan-200 hover:text-cyan-100">
              {footerLinkLabel}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
