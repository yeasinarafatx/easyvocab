"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PeriodType = "weekly" | "monthly";

type ReferralCreator = {
  id: string;
  creator_name: string;
  phone_number: string;
  total_sales_count: number;
  total_sales_amount: number;
  total_commission_amount: number;
  created_at: string;
  updated_at: string;
};

type ReferralCode = {
  id: string;
  creator_id: string;
  code: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ReferralSale = {
  id: number;
  payment_request_id: number;
  creator_id: string;
  referral_code_id: string;
  payment_amount: number;
  commission_amount: number;
  status: "unpaid" | "paid";
  paid_at: string | null;
  created_at: string;
};

type UnpaidBatch = {
  key: string;
  creator_id: string;
  creator_name: string;
  referral_code: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  sales_count: number;
  payment_amount_total: number;
  commission_amount_total: number;
};

type CreatorFormState = {
  creator_name: string;
  phone_number: string;
  referral_code: string;
  is_active: boolean;
};

const emptyForm: CreatorFormState = {
  creator_name: "",
  phone_number: "",
  referral_code: "",
  is_active: true,
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getPeriodRange(input: string, periodType: PeriodType) {
  const date = new Date(input);

  if (periodType === "weekly") {
    const day = date.getDay();
    const diffFromMonday = day === 0 ? 6 : day - 1;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diffFromMonday);
    const endExclusive = addDays(start, 7);
    const endInclusive = addDays(endExclusive, -1);

    return {
      start: toDateKey(start),
      end: toDateKey(endInclusive),
      endExclusive: toDateKey(endExclusive),
      label: `${toDateKey(start)} → ${toDateKey(endInclusive)}`,
    };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const endExclusive = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const endInclusive = addDays(endExclusive, -1);

  return {
    start: toDateKey(start),
    end: toDateKey(endInclusive),
    endExclusive: toDateKey(endExclusive),
    label: `${toDateKey(start)} → ${toDateKey(endInclusive)}`,
  };
}

function buildUnpaidBatches(
  sales: ReferralSale[],
  creatorsById: Map<string, ReferralCreator>,
  codesById: Map<string, ReferralCode>,
  periodType: PeriodType,
) {
  const groups = new Map<string, UnpaidBatch>();

  sales
    .filter((sale) => sale.status === "unpaid")
    .forEach((sale) => {
      const range = getPeriodRange(sale.created_at, periodType);
      const key = `${sale.creator_id}:${periodType}:${range.start}:${range.end}`;
      const creator = creatorsById.get(sale.creator_id);
      const code = codesById.get(sale.referral_code_id);

      const current = groups.get(key);
      if (current) {
        current.sales_count += 1;
        current.payment_amount_total += Number(sale.payment_amount);
        current.commission_amount_total += Number(sale.commission_amount);
        return;
      }

      groups.set(key, {
        key,
        creator_id: sale.creator_id,
        creator_name: creator?.creator_name ?? "Unknown creator",
        referral_code: code?.code ?? "-",
        period_type: periodType,
        period_start: range.start,
        period_end: range.end,
        sales_count: 1,
        payment_amount_total: Number(sale.payment_amount),
        commission_amount_total: Number(sale.commission_amount),
      });
    });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.period_start === b.period_start) {
      return a.creator_name.localeCompare(b.creator_name);
    }

    return a.period_start < b.period_start ? 1 : -1;
  });
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<ReferralCreator[]>([]);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [sales, setSales] = useState<ReferralSale[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [form, setForm] = useState<CreatorFormState>(emptyForm);
  const [editingCreatorId, setEditingCreatorId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const creatorsById = useMemo(
    () => new Map(creators.map((creator) => [creator.id, creator] as const)),
    [creators],
  );

  const codesByCreatorId = useMemo(
    () => new Map(codes.map((code) => [code.creator_id, code] as const)),
    [codes],
  );

  const codesById = useMemo(
    () => new Map(codes.map((code) => [code.id, code] as const)),
    [codes],
  );

  const unpaidBatches = useMemo(
    () => buildUnpaidBatches(sales, creatorsById, codesById, periodType),
    [sales, creatorsById, codesById, periodType],
  );

  const totals = useMemo(() => {
    const activeCreators = creators.filter((creator) => codesByCreatorId.get(creator.id)?.is_active).length;
    const unpaidCommission = sales
      .filter((sale) => sale.status === "unpaid")
      .reduce((sum, sale) => sum + Number(sale.commission_amount), 0);
    const paidCommission = sales
      .filter((sale) => sale.status === "paid")
      .reduce((sum, sale) => sum + Number(sale.commission_amount), 0);

    return {
      creators: creators.length,
      activeCreators,
      totalSales: sales.length,
      unpaidCommission,
      paidCommission,
    };
  }, [codesByCreatorId, creators, sales]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminRow?.user_id) {
        setIsAdmin(false);
        setReady(true);
        return;
      }

      const [creatorsResult, codesResult, salesResult] = await Promise.all([
        supabase
          .from("referral_creators")
          .select("id, creator_name, phone_number, total_sales_count, total_sales_amount, total_commission_amount, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("referral_codes")
          .select("id, creator_id, code, commission_rate, is_active, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("referral_sales")
          .select("id, payment_request_id, creator_id, referral_code_id, payment_amount, commission_amount, status, paid_at, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (creatorsResult.error) {
        setError(creatorsResult.error.message);
      }

      if (codesResult.error) {
        setError(codesResult.error.message);
      }

      if (salesResult.error) {
        setError(salesResult.error.message);
      }

      setCreators((creatorsResult.data as ReferralCreator[]) ?? []);
      setCodes((codesResult.data as ReferralCode[]) ?? []);
      setSales((salesResult.data as ReferralSale[]) ?? []);
      setIsAdmin(true);
      setReady(true);
    } catch (loadError: any) {
      setError(loadError.message || "Failed to load referral monitor");
      setReady(true);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCreatorId(null);
  };

  const handleSaveCreator = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setError(null);

    const creatorName = form.creator_name.trim();
    const phoneNumber = form.phone_number.trim();
    const referralCode = form.referral_code.trim();

    if (!creatorName || !phoneNumber || !referralCode) {
      setError("Creator name, phone number, এবং referral code সবগুলো দিন।");
      return;
    }

    setBusyKey("creator-save");

    try {
      if (editingCreatorId) {
        const { error: creatorError } = await supabase
          .from("referral_creators")
          .update({ creator_name: creatorName, phone_number: phoneNumber })
          .eq("id", editingCreatorId);

        if (creatorError) throw creatorError;

        const existingCode = codesByCreatorId.get(editingCreatorId);
        if (existingCode) {
          const { error: codeError } = await supabase
            .from("referral_codes")
            .update({ code: referralCode, is_active: form.is_active })
            .eq("creator_id", editingCreatorId);

          if (codeError) throw codeError;
        } else {
          const { error: codeError } = await supabase.from("referral_codes").insert({
            creator_id: editingCreatorId,
            code: referralCode,
            commission_rate: 10,
            is_active: form.is_active,
          });

          if (codeError) throw codeError;
        }
      } else {
        const { data: creatorRow, error: creatorError } = await supabase
          .from("referral_creators")
          .insert({ creator_name: creatorName, phone_number: phoneNumber })
          .select("id")
          .single();

        if (creatorError) throw creatorError;

        const { error: codeError } = await supabase.from("referral_codes").insert({
          creator_id: creatorRow.id,
          code: referralCode,
          commission_rate: 10,
          is_active: form.is_active,
        });

        if (codeError) throw codeError;
      }

      setNotice("Referral creator saved successfully.");
      resetForm();
      await loadData();
    } catch (saveError: any) {
      setError(saveError.message || "Failed to save creator");
    } finally {
      setBusyKey(null);
    }
  };

  const handleEditCreator = (creatorId: string) => {
    const creator = creatorsById.get(creatorId);
    const code = codesByCreatorId.get(creatorId);

    if (!creator || !code) {
      setError("Creator data not found.");
      return;
    }

    setEditingCreatorId(creatorId);
    setForm({
      creator_name: creator.creator_name,
      phone_number: creator.phone_number,
      referral_code: code.code,
      is_active: code.is_active,
    });
  };

  const handleToggleActive = async (creatorId: string) => {
    const code = codesByCreatorId.get(creatorId);
    if (!code) {
      setError("Referral code not found for this creator.");
      return;
    }

    setBusyKey(`toggle:${creatorId}`);
    setError(null);
    setNotice(null);

    try {
      const { error: updateError } = await supabase
        .from("referral_codes")
        .update({ is_active: !code.is_active })
        .eq("creator_id", creatorId);

      if (updateError) throw updateError;

      setNotice(code.is_active ? "Creator deactivated." : "Creator activated.");
      await loadData();
    } catch (toggleError: any) {
      setError(toggleError.message || "Failed to toggle status");
    } finally {
      setBusyKey(null);
    }
  };

  const handleMarkPaid = async (batch: UnpaidBatch) => {
    setBusyKey(batch.key);
    setError(null);
    setNotice(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("mark_referral_payout_paid", {
        p_creator_id: batch.creator_id,
        p_period_type: batch.period_type,
        p_period_start: batch.period_start,
        p_period_end: batch.period_end,
        p_payout_note: null,
      });

      if (rpcError) throw rpcError;

      setNotice(`Marked paid for ${batch.creator_name}. Updated ${Number(data ?? 0)} sale(s).`);
      await loadData();
    } catch (payError: any) {
      setError(payError.message || "Failed to mark payout paid");
    } finally {
      setBusyKey(null);
    }
  };

  const recentSales = useMemo(() => sales.slice(0, 20), [sales]);

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
        <p className="text-sm">Loading referral monitor...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 sm:px-6">
          <section className="w-full rounded-3xl border border-emerald-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 text-center shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
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
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-emerald-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Admin Panel</p>
              <h1 className="mt-2 text-3xl font-extrabold">Referral Monitor</h1>
              <p className="mt-2 text-sm text-slate-300">Creator registry, code status, sales ledger, and weekly/monthly payout batches.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
              >
                Refresh
              </button>
              <Link href="/admin/reviews" className="rounded-lg border border-amber-300/35 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20">
                Payment Review
              </Link>
              <Link href="/dashboard" className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Creators", value: totals.creators },
              { label: "Active Codes", value: totals.activeCreators },
              { label: "Sales", value: totals.totalSales },
              { label: "Unpaid Commission", value: `৳${Math.round(totals.unpaidCommission).toLocaleString("en-US")}` },
              { label: "Paid Commission", value: `৳${Math.round(totals.paidCommission).toLocaleString("en-US")}` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-cyan-100">{item.value}</p>
              </div>
            ))}
          </div>

          {notice ? <p className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{notice}</p> : null}
          {error ? <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <form onSubmit={handleSaveCreator} className="rounded-2xl border border-emerald-200/20 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold">Creator Setup</h2>
                  <p className="mt-1 text-sm text-slate-300">Creator name, phone, and referral code manage করুন। কমিশন fixed 10% থাকবে।</p>
                </div>
                {editingCreatorId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200">Creator Name</label>
                  <input
                    value={form.creator_name}
                    onChange={(event) => setForm((previous) => ({ ...previous, creator_name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/60"
                    placeholder="e.g. Rahim Khan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200">Phone Number</label>
                  <input
                    value={form.phone_number}
                    onChange={(event) => setForm((previous) => ({ ...previous, phone_number: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/60"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200">Referral Code</label>
                  <input
                    value={form.referral_code}
                    onChange={(event) => setForm((previous) => ({ ...previous, referral_code: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#111a2e] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/60"
                    placeholder="VOCAB10"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-[#111a2e]"
                  />
                  Active code
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busyKey === "creator-save"}
                    className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 text-sm font-extrabold text-[#0f0f1a] transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyKey === "creator-save" ? "Saving..." : editingCreatorId ? "Update Creator" : "Save Creator"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold">Creator Registry</h2>
                  <p className="mt-1 text-sm text-slate-300">Edit, deactivate, and audit each influencer code.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {creators.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">এখনো কোনো creator নেই।</p>
                ) : (
                  creators.map((creator) => {
                    const code = codesByCreatorId.get(creator.id);
                    return (
                      <article key={creator.id} className="rounded-2xl border border-white/10 bg-[#111a2e] p-4 flex flex-col sm:flex-row" style={{ touchAction: 'pan-y' }}>
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div>
                            <p className="text-base font-bold text-slate-100">{creator.creator_name}</p>
                            <p className="mt-1 text-sm text-slate-300">{creator.phone_number}</p>
                            <p className="mt-1 text-xs text-slate-400">Code: <span className="font-semibold text-emerald-200">{code?.code ?? "-"}</span></p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${code?.is_active ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100" : "border-slate-400/30 bg-slate-400/10 text-slate-300"}`}>
                            {code?.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <p className="uppercase tracking-[0.14em] text-slate-400">Sales</p>
                            <p className="mt-1 text-sm font-bold text-cyan-100">{creator.total_sales_count}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <p className="uppercase tracking-[0.14em] text-slate-400">Paid</p>
                            <p className="mt-1 text-sm font-bold text-cyan-100">৳{Math.round(Number(creator.total_sales_amount)).toLocaleString("en-US")}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <p className="uppercase tracking-[0.14em] text-slate-400">Commission</p>
                            <p className="mt-1 text-sm font-bold text-cyan-100">৳{Math.round(Number(creator.total_commission_amount)).toLocaleString("en-US")}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                            <p className="uppercase tracking-[0.14em] text-slate-400">Rate</p>
                            <p className="mt-1 text-sm font-bold text-cyan-100">10%</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCreator(creator.id)}
                            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `toggle:${creator.id}`}
                            onClick={() => handleToggleActive(creator.id)}
                            className="rounded-lg border border-emerald-300/35 bg-emerald-300/12 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busyKey === `toggle:${creator.id}` ? "Updating..." : code?.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-extrabold">{periodType === "weekly" ? "Weekly" : "Monthly"} Payout Queue</h2>
                <p className="mt-1 text-sm text-slate-300">Unpaid sales grouped by creator and period. Paid করলে ওই batch reset হয়ে যাবে.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodType("weekly")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${periodType === "weekly" ? "border border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("monthly")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${periodType === "monthly" ? "border border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {unpaidBatches.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">এই period-এ কোনো unpaid referral sale নেই।</p>
                ) : (
                unpaidBatches.map((batch) => (
                  <article key={batch.key} className="rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-300/10 to-transparent p-4 flex flex-col" style={{ touchAction: 'pan-y' }}>
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div>
                        <p className="text-base font-bold text-slate-100">{batch.creator_name}</p>
                        <p className="mt-1 text-sm text-slate-300">Code: <span className="font-semibold text-emerald-200">{batch.referral_code}</span></p>
                        <p className="mt-1 text-xs text-slate-400">Period: {batch.period_start} → {batch.period_end}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busyKey === batch.key}
                        onClick={() => handleMarkPaid(batch)}
                        className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-2 text-sm font-extrabold text-[#0f0f1a] transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === batch.key ? "Saving..." : "Mark Paid"}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Sales</p>
                        <p className="mt-1 text-lg font-bold text-cyan-100">{batch.sales_count}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Payment Total</p>
                        <p className="mt-1 text-lg font-bold text-cyan-100">৳{Math.round(batch.payment_amount_total).toLocaleString("en-US")}</p>
                        <p className="text-xs text-slate-400">Exact ৳{batch.payment_amount_total.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Commission</p>
                        <p className="mt-1 text-lg font-bold text-cyan-100">৳{Math.round(batch.commission_amount_total).toLocaleString("en-US")}</p>
                        <p className="text-xs text-slate-400">Exact ৳{batch.commission_amount_total.toFixed(2)}</p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-extrabold">Recent Sales Ledger</h2>
              <p className="mt-1 text-sm text-slate-300">Approved sales, payout status, and commission trail.</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              {/* Desktop / tablet table */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Creator</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Commission</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-[#10192c]">
                    {recentSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-slate-300">
                          No sales yet.
                        </td>
                      </tr>
                    ) : (
                      recentSales.map((sale) => {
                        const creator = creatorsById.get(sale.creator_id);
                        const code = codesById.get(sale.referral_code_id);

                        return (
                          <tr key={sale.id}>
                            <td className="px-4 py-3 font-semibold text-slate-100">{creator?.creator_name ?? "Unknown"}</td>
                            <td className="px-4 py-3 text-slate-300">{code?.code ?? "-"}</td>
                            <td className="px-4 py-3 text-slate-100">৳{Math.round(Number(sale.payment_amount)).toLocaleString("en-US")}</td>
                            <td className="px-4 py-3 text-slate-100">৳{Math.round(Number(sale.commission_amount)).toLocaleString("en-US")}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${sale.status === "paid" ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100" : "border-amber-300/35 bg-amber-300/12 text-amber-100"}`}>
                                {sale.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{sale.created_at.slice(0, 10)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="block sm:hidden bg-[#10192c] p-3">
                {recentSales.length === 0 ? (
                  <p className="px-4 py-4 text-slate-300">No sales yet.</p>
                ) : (
                  recentSales.map((sale) => {
                    const creator = creatorsById.get(sale.creator_id);
                    const code = codesById.get(sale.referral_code_id);

                    return (
                      <article key={sale.id} className="mb-3 rounded-xl border border-white/10 bg-[#0f1730]/60 p-3" style={{ touchAction: 'pan-y' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-100 truncate">{creator?.creator_name ?? "Unknown"}</p>
                            <p className="mt-1 text-xs text-slate-300">Code: <span className="font-semibold text-emerald-200">{code?.code ?? "-"}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-cyan-100">৳{Math.round(Number(sale.payment_amount)).toLocaleString("en-US")}</p>
                            <p className="text-xs text-slate-300">৳{Math.round(Number(sale.commission_amount)).toLocaleString("en-US")}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${sale.status === "paid" ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100" : "border-amber-300/35 bg-amber-300/12 text-amber-100"}`}>
                            {sale.status}
                          </span>
                          <span className="text-xs text-slate-300">{sale.created_at.slice(0, 10)}</span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}