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
            <img
              src="/logos/easy-vocab-auth-desktop.png"
              alt="Vocab Speak"
              className="h-auto w-20 sm:w-14 md:w-16 lg:w-20"
              style={{ filter: 'drop-shadow(0 0 14px rgba(99, 179, 237, 0.25))' }}
            />
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
