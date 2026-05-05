"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getFriendlyAuthError } from "@/lib/authErrors";
import { trackMetaEvent } from "@/lib/metaPixel";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/dashboard");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect") ?? "";
    if (redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      setRedirectPath(redirectParam);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        // Supabase may return user with no session when email confirmation is required.
        if (!data.session) {
          setMessage("✓ অ্যাকাউন্ট তৈরি হয়েছে। এখন verification code দিন।");
          setTimeout(() => {
            trackMetaEvent("CompleteRegistration", { method: "email" });
            const email = encodeURIComponent(formData.email.trim().toLowerCase());
            const redirect = encodeURIComponent(redirectPath);
            router.push(`/verify-email?email=${email}&redirect=${redirect}`);
          }, 700);
          return;
        }

        setMessage("✓ Account created successfully! আপনাকে পরের পেজে নেওয়া হচ্ছে...");
        setTimeout(() => {
          trackMetaEvent("CompleteRegistration", { method: "email" });
          router.push(redirectPath);
        }, 1000);
      }
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create Account"
      title="নতুন অ্যাকাউন্ট তৈরি করুন"
      subtitle="একটি অ্যাকাউন্ট খুলে আপনার learning progress save করুন এবং premium access নিন।"
      footerText="অ্যাকাউন্ট আছে?"
      footerLinkLabel="Login"
      footerLinkHref={`/login?redirect=${encodeURIComponent(redirectPath)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-100">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60 disabled:opacity-50"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-100">
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
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-100">
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
            placeholder="Minimum 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
    </AuthShell>
  );
}
