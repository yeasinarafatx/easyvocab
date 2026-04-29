"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const router = useRouter();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("resources")
        .select("id, title, file_url, size_bytes")
        .eq("is_free", false)
        .eq("visible", true)
        .order("order", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setResources((data || []) as Resource[]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/payment");
  };

  if (loading) return <div className="p-8 text-slate-100">Loading...</div>;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-slate-100">Paid PDF / Ebooks</h1>
      <p className="mt-2 text-sm text-slate-300">Click a file title to purchase and download.</p>

      {error && <div className="mt-4 rounded-md bg-red-500/20 p-3 text-sm text-red-200">{error}</div>}

      {resources.length === 0 ? (
        <p className="mt-6 text-slate-400">No paid resources available yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {resources.map((item) => (
            <li key={item.id} className="rounded-md border border-white/6 bg-white/3 p-3">
              <a href="#" onClick={handleClick} className="text-base font-semibold text-slate-100 hover:text-amber-300">
                {item.title}
              </a>
              <div className="mt-1 text-xs text-slate-300">
                {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : "Size unknown"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
