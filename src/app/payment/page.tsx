"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PaymentMethod = "bkash" | "nagad";
type RequestStatus = "pending" | "approved" | "rejected";

type LatestRequest = {
  id: number;
  method: PaymentMethod;
  sender_mobile: string;
  trx_id: string;
  amount: number;
  status: RequestStatus;
  review_note: string | null;
  created_at: string;
};

const paymentLogoMap: Record<
  PaymentMethod,
  {
    alt: string;
    main: string;
    main2x: string;
    compact: string;
    compact2x: string;
  }
> = {
  bkash: {
    alt: "bKash",
    main: "/logos/payments/bkash-logo.png",
    main2x: "/logos/payments/bkash-logo@2x.png",
    compact: "/logos/payments/bkash-logo-compact.png",
    compact2x: "/logos/payments/bkash-logo-compact@2x.png",
  },
  nagad: {
    alt: "Nagad",
    main: "/logos/payments/nagad-logo.png",
    main2x: "/logos/payments/nagad-logo@2x.png",
    compact: "/logos/payments/nagad-logo-compact.png",
    compact2x: "/logos/payments/nagad-logo-compact@2x.png",
  },
};

export default function PaymentPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [senderMobile, setSenderMobile] = useState("");
  const [trxId, setTrxId] = useState("");
  const [amount] = useState(399);
  const [latestRequest, setLatestRequest] = useState<LatestRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoUnavailable, setLogoUnavailable] = useState<Record<PaymentMethod, boolean>>({
    bkash: false,
    nagad: false,
  });

  const loadLatestRequest = async (currentUserId: string) => {
    const { data: req } = await supabase
      .from("payment_requests")
      .select("id, method, sender_mobile, trx_id, amount, status, review_note, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestRequest((req as LatestRequest | null) ?? null);
  };

  const hasPending = latestRequest?.status === "pending";

  const statusBadge = useMemo(() => {
    if (!latestRequest) return null;
    if (latestRequest.status === "pending") return "Processing";
    if (latestRequest.status === "approved") return "Approved";
    return "Rejected";
  }, [latestRequest]);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const user = data.session?.user;
      setHasSession(Boolean(user));
      setUserId(user?.id ?? null);
      setSessionReady(true);

      if (!user) return;

      if (mounted) {
        await loadLatestRequest(user.id);
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const timer = window.setInterval(() => {
      void loadLatestRequest(userId);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setError(null);

    if (!userId) {
      setError("আগে login করুন।");
      return;
    }

    if (!senderMobile.trim() || !trxId.trim()) {
      setError("Mobile number এবং TRX ID দিন।");
      return;
    }

    if (hasPending) {
      setError("আপনার একটি request already processing এ আছে।");
      return;
    }

    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from("payment_requests")
      .insert({
        user_id: userId,
        method,
        sender_mobile: senderMobile.trim(),
        trx_id: trxId.trim(),
        amount,
        status: "pending",
      })
      .select("id, method, sender_mobile, trx_id, amount, status, review_note, created_at")
      .single();

    setSubmitting(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Duplicate TRX ID বা pending request আছে। নতুন তথ্য দিন।");
        return;
      }
      setError(insertError.message);
      return;
    }

    setLatestRequest(data as LatestRequest);
    setSenderMobile("");
    setTrxId("");
    setNotice("Request submitted. Status: Processing");
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-200">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 sm:px-6">
          <section className="w-full rounded-3xl border border-cyan-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 text-center shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-extrabold">Payment Request এর জন্য Login করুন</h1>
            <p className="mt-3 text-sm text-slate-300">Level 2+ unlock করতে আগে account এ login করতে হবে।</p>
            <Link href="/login" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-extrabold text-[#0f0f1a]">
              Login
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Premium Unlock</p>
              <h1 className="mt-2 text-3xl font-extrabold">Manual Payment (bKash / Nagad)</h1>
              <p className="mt-2 text-sm text-slate-300">Level 1 free. Level 2+ unlock করতে payment request submit করুন।</p>
            </div>
            <Link href="/dashboard" className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20">
              Dashboard
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 to-[#2f3a44]/92 p-5">
              <p className="text-sm font-semibold text-slate-200">Payment Amount: <span className="text-emerald-300">৳{amount}</span></p>

              <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3">
                <p className="mb-3 text-sm font-bold text-slate-100">নির্বাচন করুন</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("bkash")}
                    className={`relative rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      method === "bkash"
                        ? "border-cyan-300 bg-slate-100 shadow-[0_0_0_2px_rgba(34,211,238,0.5)]"
                        : "border-white/35 bg-white"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {logoUnavailable.bkash ? (
                        <span className="text-sm font-bold">bKash</span>
                      ) : (
                        <img
                          src={paymentLogoMap.bkash.compact}
                          alt={paymentLogoMap.bkash.alt}
                          srcSet={`${paymentLogoMap.bkash.compact} 1x, ${paymentLogoMap.bkash.compact2x} 2x`}
                          sizes="(max-width: 640px) 80px, 96px"
                          className="h-6 w-auto max-w-[100px] object-contain sm:h-7 sm:max-w-[120px]"
                          onError={() => setLogoUnavailable((prev) => ({ ...prev, bkash: true }))}
                        />
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("nagad")}
                    className={`relative rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      method === "nagad"
                        ? "border-emerald-300 bg-slate-100 shadow-[0_0_0_2px_rgba(110,231,183,0.5)]"
                        : "border-white/35 bg-white"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {logoUnavailable.nagad ? (
                        <span className="text-sm font-bold">Nagad</span>
                      ) : (
                        <img
                          src={paymentLogoMap.nagad.compact}
                          alt={paymentLogoMap.nagad.alt}
                          srcSet={`${paymentLogoMap.nagad.compact} 1x, ${paymentLogoMap.nagad.compact2x} 2x`}
                          sizes="(max-width: 640px) 80px, 96px"
                          className="h-6 w-auto max-w-[100px] object-contain sm:h-7 sm:max-w-[120px]"
                          onError={() => setLogoUnavailable((prev) => ({ ...prev, nagad: true }))}
                        />
                      )}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/20 bg-[#0f1730]/65 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">How To Pay</p>
                {method === "bkash" ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-200 sm:text-sm">
                    <li>1. bKash app এ Merchant Pay খুলুন।</li>
                    <li>2. আমাদের bKash merchant number এ ৳{amount} পাঠান।</li>
                    <li>3. সফল payment এর TRX ID কপি করে এখানে দিন।</li>
                  </ul>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-slate-200 sm:text-sm">
                    <li>1. Nagad app এ Merchant Pay খুলুন।</li>
                    <li>2. আমাদের Nagad merchant number এ ৳{amount} পাঠান।</li>
                    <li>3. সফল payment এর TRX ID কপি করে এখানে দিন।</li>
                  </ul>
                )}
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Sender Mobile</label>
              <input
                value={senderMobile}
                onChange={(e) => setSenderMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-2 w-full rounded-xl border border-white/25 bg-[#111a2e] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60"
              />

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Transaction ID</label>
              <input
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="TRX123ABC"
                className="mt-2 w-full rounded-xl border border-white/25 bg-[#111a2e] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-200/60"
              />

              <button
                type="submit"
                disabled={submitting || hasPending}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : hasPending ? "Already Processing" : "Submit Payment Request"}
              </button>

              {notice ? <p className="mt-3 text-sm text-emerald-200">{notice}</p> : null}
              {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            </form>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <h2 className="text-lg font-extrabold">Latest Request</h2>
              {!latestRequest ? (
                <p className="mt-3 text-sm text-slate-300">এখনও কোনো request submit হয়নি।</p>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  <p>Method: <span className="font-semibold uppercase">{latestRequest.method}</span></p>
                  <p>TRX ID: <span className="font-semibold">{latestRequest.trx_id}</span></p>
                  <p>Amount: <span className="font-semibold">৳{latestRequest.amount}</span></p>
                  <p>Status: <span className={`font-semibold ${latestRequest.status === "approved" ? "text-emerald-300" : latestRequest.status === "rejected" ? "text-rose-300" : "text-amber-300"}`}>{statusBadge}</span></p>
                  {latestRequest.review_note ? <p>Note: {latestRequest.review_note}</p> : null}
                </div>
              )}

              <p className="mt-5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300">
                Payment send করার পর ১৫-৩০ মিনিটের মধ্যে admin review করা হবে।
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
