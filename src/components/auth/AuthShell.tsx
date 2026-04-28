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
            <div className="flex items-center justify-center rounded-[20px] bg-white p-4 sm:p-6 lg:p-8 shadow-lg">
              <picture>
                <source media="(min-width: 1024px)" srcSet="/logos/easy-vocab-auth-desktop.png 1x, /logos/easy-vocab-auth-desktop@2x.png 2x" />
                <source media="(min-width: 640px)" srcSet="/logos/easy-vocab-auth-tablet.png 1x, /logos/easy-vocab-auth-tablet@2x.png 2x" />
                <img
                  src="/logos/easy-vocab-auth-mobile.png"
                  srcSet="/logos/easy-vocab-auth-mobile@2x.png 2x"
                  alt="Easy Vocab"
                  className="h-auto w-24 sm:w-32 lg:w-40"
                />
              </picture>
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
