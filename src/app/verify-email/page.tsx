"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getFriendlyAuthError } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("আগে valid email দিন।");
      return;
    }

    if (!code.trim()) {
      setError("৬ সংখ্যার verification code দিন।");
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "signup",
      });

      if (verifyError) throw verifyError;

      if (data.session) {
        setMessage("✓ Email verified! আপনাকে dashboard-এ নেওয়া হচ্ছে...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 900);
        return;
      }

      setMessage("✓ Email verified. এখন login করুন।");
      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendCooldown > 0) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });

      if (resendError) throw resendError;

      setMessage("নতুন verification code পাঠানো হয়েছে।");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Verify Email"
      title="Verification Code দিন"
      subtitle="ইমেইলে পাওয়া 6-digit code দিন। verified হলে account access চালু হবে।"
      footerText="Already verified?"
      footerLinkLabel="Login"
      footerLinkHref="/login"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="verify-email" className="mb-1 block text-sm font-semibold text-slate-200">
            Email
          </label>
          <input
            id="verify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-semibold text-slate-200">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm tracking-[0.3em] text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
            placeholder="123456"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={loading || resendCooldown > 0}
        className="mt-4 w-full rounded-xl border border-cyan-200/30 bg-cyan-200/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20 disabled:opacity-50"
      >
        {resendCooldown > 0
          ? `নতুন code আবার পাঠানো যাবে ${resendCooldown}s পরে`
          : "Code আবার পাঠান"}
      </button>

      <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-cyan-200 hover:text-cyan-100">
        Back to Login
      </Link>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
    </AuthShell>
  );
}
