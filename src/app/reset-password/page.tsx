"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getFriendlyAuthError } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirm: "",
  });

  useEffect(() => {
    let mounted = true;

    const initializeRecovery = async () => {
      let token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // Fallback: some email clients strip query params — check both `token` and URL hash
      if (!token_hash) token_hash = searchParams.get("token");
      if (!token_hash) {
        try {
          const hash = window.location.hash?.replace(/^#/, "");
          if (hash) {
            // allow formats like token_hash=... or just the token
            const params = new URLSearchParams(hash);
            token_hash = params.get("token_hash") || params.get("token") || decodeURIComponent(hash || "");
          }
        } catch (e) {
          // ignore — we'll handle verify failure below
        }
      }

      if (token_hash && type === "recovery") {
        try {
          const decoded = decodeURIComponent(token_hash);
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: decoded,
          });

          if (!mounted) return;

          if (!verifyError) {
            setIsRecoveryReady(true);
            setError("");
            return;
          }
        } catch (err) {
          // verification attempt failed — fall through to session check
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        setIsRecoveryReady(true);
      } else {
        setError("ইমেইলের reset link থেকে এই page ওপেন করুন।");
      }
    };

    initializeRecovery();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsRecoveryReady(true);
        setError("");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (formData.password !== formData.confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) throw updateError;

      setMessage("✓ Password updated! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Reset Password"
      title="নতুন পাসওয়ার্ড সেট করুন"
      subtitle="নিরাপদ একটি নতুন পাসওয়ার্ড দিন এবং আবার login করুন।"
      footerText="লগইন পেইজে ফিরুন"
      footerLinkLabel="Login"
      footerLinkHref="/login"
    >
      {!isRecoveryReady ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error || "Reset link verify হচ্ছে..."}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-100">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={loading || !isRecoveryReady}
              className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-semibold text-slate-100">
              Confirm New Password
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={formData.confirm}
              onChange={handleChange}
              disabled={loading || !isRecoveryReady}
              className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isRecoveryReady}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}

      {isRecoveryReady && error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
    </AuthShell>
  );
}
