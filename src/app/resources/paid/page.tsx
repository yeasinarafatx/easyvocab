"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { trackMetaEvent } from "@/lib/metaPixel";

interface Resource {
  id: string;
  title: string;
  file_url: string;
  size_bytes: number;
}

export default function PaidResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    try {
      // Check user premium status
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsPremium(false);
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", session.user.id)
          .single();
        
        setIsPremium(Boolean(profile?.is_premium));
      }

      // Check cache first (5 minutes validity)
      const cacheKey = "paid_resources_cache";
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(`${cacheKey}_time`);
      
      if (cachedData && cachedTime) {
        const cacheAgeMinutes = (Date.now() - parseInt(cachedTime)) / 1000 / 60;
        if (cacheAgeMinutes < 5) {
          // Cache is fresh, use it
          try {
            const parsedData = JSON.parse(cachedData) as Resource[];
            setResources(parsedData);
            setLoading(false);
            return;
          } catch (e) {
            console.warn("Could not parse cached paid resources", e);
          }
        }
      }

      // Fetch paid resources
      const { data, error: fetchError } = await supabase
        .from("resources")
        .select("id, title, file_url, size_bytes")
        .eq("is_free", false)
        .eq("visible", true)
        .order("order", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        // Try to use stale cache if available
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData) as Resource[];
            setResources(parsedData);
          } catch (e) {
            console.warn("Could not parse cached paid resources", e);
          }
        }
      } else {
        const resourcesData = (data || []) as Resource[];
        setResources(resourcesData);
        
        // Cache the data
        try {
          localStorage.setItem(cacheKey, JSON.stringify(resourcesData));
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        } catch (e) {
          // localStorage full, continue anyway
          console.warn("Could not cache paid resources", e);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resourceId: string, resourceTitle: string) => {
    if (!isPremium) {
      router.push("/payment");
      return;
    }

    try {
      let { data: { session } } = await supabase.auth.getSession();

      // Refresh token if close to expiration (less than 15 minutes)
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000 / 60;
        
        if (minutesUntilExpiry < 15) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed?.session) {
            session = refreshed.session;
          }
        }
      }

      // Check for cached URL (valid for 50 minutes out of 60-minute expiration)
      const cacheKey = `dl_url_${resourceId}`;
      const cachedUrl = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(`${cacheKey}_time`);
      
      if (cachedUrl && cachedTime) {
        const ageMinutes = (Date.now() - parseInt(cachedTime)) / 1000 / 60;
        if (ageMinutes < 50) {
          // Cache still valid, use cached URL directly
          window.location.href = cachedUrl;
          return;
        }
      }

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/resources/download?id=${resourceId}`, {
        headers,
      });

      const payload = await response.json().catch(() => null) as { downloadUrl?: string; error?: string } | null;

      if (!response.ok) {
        alert(`Download failed: ${payload?.error || "Unknown error"}`);
        return;
      }

      if (payload?.downloadUrl) {
        // Cache the URL for future downloads
        try {
          localStorage.setItem(cacheKey, payload.downloadUrl);
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        } catch (e) {
          // localStorage full or disabled, continue anyway
          console.warn("Could not cache download URL", e);
        }
        window.location.href = payload.downloadUrl;
      } else {
        alert("Download URL not found");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed. Please try again.");
    }
  };


  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
      <p>Loading resources...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-[#1a2a21]/70 p-8 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="mb-8 border-b border-white/10 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Library</p>
            <h1 className="mt-2 text-4xl font-extrabold text-amber-100">Premium Resources</h1>
            <p className="mt-3 text-slate-300">প্রিমিয়াম সদস্যদের জন্য বিশেষ সামগ্রী ডাউনলোড করুন</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-300/30 bg-red-300/10 p-4 text-red-200">
              {error}
            </div>
          )}

          {!isPremium && (
            <div className="mb-6 rounded-lg border border-amber-300/35 bg-amber-300/15 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-100">প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন</p>
                  <p className="mt-1 text-sm text-amber-200/80">এই সামগ্রী অ্যাক্সেস করতে আপনাকে প্রিমিয়াম সদস্য হতে হবে।</p>
                </div>
                <Link
                  href="/payment"
                  onClick={() => trackMetaEvent("Lead", { content_name: "Paid Resources Upgrade CTA" })}
                  className="ml-4 rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-2.5 text-sm font-semibold text-[#0f0f1a] transition hover:brightness-110 whitespace-nowrap"
                >
                  Upgrade Now →
                </Link>
              </div>
            </div>
          )}

          {resources.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-slate-300">কোনো প্রিমিয়াম সামগ্রী পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
              {resources.map((item) => (
                isPremium ? (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-400/12 via-slate-900/60 to-slate-900/40 shadow-xl shadow-amber-400/15 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-2xl hover:shadow-amber-400/25"
                  >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100 -z-10" />

                    <div className="relative z-10 p-5 md:p-6">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <img
                          src="/icons/premium/trophy-front-premium.svg"
                          alt="Unlocked premium resource"
                          className="h-7 w-7 flex-shrink-0"
                        />

                        <span className="inline-block flex-shrink-0 whitespace-nowrap rounded-full border border-emerald-300/50 bg-emerald-400/25 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
                          ✓ Unlocked
                        </span>
                      </div>

                      <h3 className="mb-1.5 line-clamp-2 text-base font-bold text-amber-50 transition group-hover:text-amber-100 md:text-lg">
                        {item.title}
                      </h3>

                      <p className="mb-3.5 text-xs text-slate-400">
                        {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : "Size unknown"}
                      </p>

                      <button
                        onClick={() => handleDownload(item.id, item.title)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2 text-xs font-bold text-[#0f0f1a] shadow-lg shadow-amber-400/30 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-amber-300/40"
                      >
                        <span>⬇️</span>
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    href="/payment"
                    onClick={() => trackMetaEvent("Lead", { content_name: "Locked Premium Resource CTA" })}
                    className="group relative overflow-hidden rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/30 via-slate-900/60 to-slate-900/50 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-gradient-to-br hover:from-slate-800/45 hover:via-slate-900/70 hover:to-slate-900/55"
                  >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-400/10 to-cyan-400/8 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100 -z-10" />

                    <div className="relative z-10">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <img
                          src="/icons/premium/lock-front-color.svg"
                          alt="Locked premium resource"
                          className="h-7 w-7 flex-shrink-0"
                        />

                        <span className="inline-block flex-shrink-0 whitespace-nowrap rounded-full border border-slate-600/40 bg-slate-700/50 px-2.5 py-0.5 text-xs font-bold text-slate-400">
                          🔒 Locked
                        </span>
                      </div>

                      <h3 className="mb-1.5 line-clamp-2 text-base font-bold text-slate-400 md:text-lg">
                        Premium Resource
                      </h3>

                      <p className="mb-4 text-xs text-slate-500">
                        Premium content is hidden for free users.
                      </p>

                      <div className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 py-2 text-xs font-bold text-[#0f0f1a] transition-all duration-300 group-hover:brightness-110">
                        Unlock →
                      </div>
                    </div>
                  </Link>
                )
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link href="/dashboard" className="inline-flex items-center text-amber-300 hover:text-amber-200 transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
