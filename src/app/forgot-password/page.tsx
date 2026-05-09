"use client";

import { FormEvent, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { getFriendlyAuthError } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/site";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: absoluteUrl("/reset-password"),
      });

      if (resetError) throw resetError;

      setMessage("✓ Reset link পাঠানো হয়েছে। আপনার ইমেইল চেক করুন (spam folder ও দেখুন)।");
      setEmail("");
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Forgot Password"
      title="পাসওয়ার্ড রিসেট করুন"
      subtitle="আপনার ইমেইল দিন, আমরা একটি secure reset link পাঠাবো।"
      footerText="পাসওয়ার্ড মনে আছে?"
      footerLinkLabel="Login"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
    </AuthShell>
  );
}
