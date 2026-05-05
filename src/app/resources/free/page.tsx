"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { trackMetaEvent } from "@/lib/metaPixel";

interface Resource {
  id: string;
  title: string;
  file_url: string;
  size_bytes: number;
}

export default function FreeResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Check cache first (5 minutes validity)
        const cacheKey = "free_resources_cache";
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
              console.warn("Could not parse cached resources", e);
            }
          }
        }

        // Cache is stale or doesn't exist, fetch from database
        const { data, error: fetchError } = await supabase
          .from("resources")
          .select("id, title, file_url, size_bytes")
          .eq("is_free", true)
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
              console.warn("Could not parse cached resources", e);
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
            console.warn("Could not cache resources", e);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch resources");
      } finally {
        setLoading(false);
      }
    };

    void fetchResources();
  }, []);

  const handleDownload = async (resourceId: string, resourceTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-[#122531]/70 p-8 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="mb-8 border-b border-white/10 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Library</p>
            <h1 className="mt-2 text-4xl font-extrabold text-cyan-100">🎁 Free Resources</h1>
            <p className="mt-3 text-slate-300">সকল বিনামূল্যে শিক্ষা সামগ্রী ডাউনলোড করুন</p>
            <div className="mt-4">
              <Link
                href="/payment"
                onClick={() => trackMetaEvent("Lead", { content_name: "Free Resources Upgrade CTA" })}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-2 text-sm font-semibold text-[#0f0f1a] shadow-md hover:brightness-105"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-300/30 bg-red-300/10 p-4 text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-slate-400">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-slate-300">কোনো বিনামূল্যে সামগ্রী পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {resources.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-cyan-300/28 bg-gradient-to-br from-cyan-400/10 via-slate-900/68 to-slate-900/44 p-3.5 md:p-4 shadow-lg shadow-cyan-400/10 transition-all duration-300 hover:border-cyan-300/45 hover:shadow-xl hover:shadow-cyan-400/18 hover:-translate-y-0.5"
                >
                  {/* Animated background glow */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-400/16 to-emerald-400/8 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100 -z-10" />
                  
                  <div className="relative z-10">
                    <div className="mb-3 flex items-start justify-between gap-2.5">
                      {/* Icon (no container) */}
                      <img src="/icons/premium/fav-folder-front-premium.svg" alt="Free resource" className="h-7 w-7 flex-shrink-0" />
                      
                      {/* Status Badge */}
                      <span className="flex-shrink-0 whitespace-nowrap rounded-full border border-emerald-300/45 bg-emerald-400/18 px-2.5 py-0.5 text-xs font-bold text-emerald-100">
                        ✓ Free
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-1.5 text-sm font-bold leading-snug text-cyan-50 transition group-hover:text-cyan-100 md:text-base line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Size Info */}
                    <p className="mb-3 text-xs text-slate-400">
                      {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : "Size unknown"}
                    </p>

                    {/* Action Button */}
                    <button
                      onClick={() => handleDownload(item.id, item.title)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400/90 to-emerald-400/90 px-3 py-2 text-xs font-bold text-[#0f0f1a] shadow-md shadow-cyan-400/20 transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-cyan-300/25"
                    >
                      <span>⬇️</span>
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link href="/dashboard" className="inline-flex items-center text-cyan-300 hover:text-cyan-200 transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
