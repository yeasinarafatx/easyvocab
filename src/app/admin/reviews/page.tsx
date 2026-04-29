"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PaymentMethod = "bkash" | "nagad";
type RequestStatus = "pending" | "approved" | "rejected";

type ReviewItem = {
  id: number;
  user_id: string;
  method: PaymentMethod;
  sender_mobile: string;
  trx_id: string;
  amount: number;
  status: RequestStatus;
  review_note: string | null;
  created_at: string;
};

export default function AdminReviewsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<ReviewItem[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [noteMap, setNoteMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pendingRows = useMemo(
    () => rows.filter((item) => item.status === "pending"),
    [rows],
  );

  const loadRows = async () => {
    setLoadingRows(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("payment_requests")
      .select("id, user_id, method, sender_mobile, trx_id, amount, status, review_note, created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    setLoadingRows(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setRows((data as ReviewItem[]) ?? []);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!mounted) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (!adminRow?.user_id) {
        setIsAdmin(false);
        setReady(true);
        return;
      }

      setIsAdmin(true);
      setReady(true);
      await loadRows();
    };

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!ready || !isAdmin) return;

    const timer = window.setInterval(() => {
      void loadRows();
    }, 12000);

    return () => window.clearInterval(timer);
  }, [ready, isAdmin]);

  const review = async (requestId: number, decision: "approved" | "rejected") => {
    setBusyId(requestId);
    setError(null);
    setNotice(null);

    const note = noteMap[requestId]?.trim() || null;

    const { error: rpcError } = await supabase.rpc("review_payment_request", {
      p_request_id: requestId,
      p_decision: decision,
      p_review_note: note,
    });

    setBusyId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setNotice(`Request #${requestId} ${decision} করা হয়েছে।`);
    await loadRows();
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
        <p className="text-sm">Loading admin panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 sm:px-6">
          <section className="w-full rounded-3xl border border-amber-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 text-center shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-extrabold">Admin Access Required</h1>
            <p className="mt-3 text-sm text-slate-300">এই পেজটি শুধু admin user এর জন্য।</p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-extrabold text-[#0f0f1a]">
              Dashboard
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-amber-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Admin Panel</p>
              <h1 className="mt-2 text-3xl font-extrabold">Payment Review Queue</h1>
              <p className="mt-2 text-sm text-slate-300">Pending request verify করে approved/rejected দিন।</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadRows}
                className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
              >
                Refresh
              </button>
              <Link href="/dashboard" className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-100">
            Pending: <span className="font-bold text-amber-200">{pendingRows.length}</span>
            {loadingRows ? <span className="ml-2 text-slate-400">Refreshing...</span> : null}
          </div>

          {notice ? <p className="mt-4 text-sm text-emerald-200">{notice}</p> : null}
          {error ? (
            <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {pendingRows.length === 0 ? (
              <p className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-300">
                এখন কোনো pending request নেই।
              </p>
            ) : (
              pendingRows.map((row) => (
                <article key={row.id} className="rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-300/12 to-slate-900/75 p-4 shadow-lg shadow-black/20">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>ID: <span className="font-semibold">#{row.id}</span></p>
                    <p>User: <span className="font-semibold break-all">{row.user_id}</span></p>
                    <p>Method: <span className="font-semibold uppercase">{row.method}</span></p>
                    <p>Mobile: <span className="font-semibold">{row.sender_mobile}</span></p>
                    <p>TRX: <span className="font-semibold">{row.trx_id}</span></p>
                    <p>Amount: <span className="font-semibold">৳{row.amount}</span></p>
                  </div>

                  <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Review Note</label>
                  <input
                    value={noteMap[row.id] ?? ""}
                    onChange={(e) => setNoteMap((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="Verified / TRX mismatch / other note"
                    className="mt-2 w-full rounded-xl border border-white/25 bg-[#111a2e] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-200/60"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => review(row.id, "approved")}
                      className="rounded-lg border border-emerald-300/45 bg-emerald-300/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/22 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === row.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => review(row.id, "rejected")}
                      className="rounded-lg border border-rose-300/45 bg-rose-300/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/22 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === row.id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
