"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getFriendlyAuthError, isEmailNotConfirmedError } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setShowResendVerification(false);
    setLoading(true);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

      if (signInError) throw signInError;

      if (data?.user) {
        setMessage("✓ Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (err: unknown) {
      const isUnverified = isEmailNotConfirmedError(err);
      setShowResendVerification(isUnverified);
      setError(getFriendlyAuthError(err));

      if (isUnverified) {
        const email = encodeURIComponent(formData.email.trim().toLowerCase());
        setMessage("Verification code page-এ নিয়ে যাওয়া হচ্ছে...");
        setTimeout(() => {
          router.push(`/verify-email?email=${email}`);
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email || resendCooldown > 0) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: formData.email.trim().toLowerCase(),
      });

      if (resendError) throw resendError;

      setMessage("Verification email আবার পাঠানো হয়েছে। inbox/spam চেক করুন।");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Login"
      title="আপনার অ্যাকাউন্টে লগইন করুন"
      subtitle="অ্যাকাউন্টে ঢুকে আপনার progress, stages এবং premium access দেখুন।"
      footerText="নতুন ব্যবহারকারী?"
      footerLinkLabel="Create Account"
      footerLinkHref="/signup"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
            placeholder="********"
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login করুন"}
        </button>
      </form>

      {showResendVerification ? (
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={loading || resendCooldown > 0}
          className="mt-4 w-full rounded-xl border border-cyan-200/30 bg-cyan-200/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20 disabled:opacity-50"
        >
          {resendCooldown > 0
            ? `Verification আবার পাঠানো যাবে ${resendCooldown}s পরে`
            : "Verification Email আবার পাঠান"}
        </button>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
    </AuthShell>
  );
}
