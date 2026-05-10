"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Resource {
  id: string;
  title: string;
  file_url: string;
  is_free: boolean;
  visible: boolean;
  order: number;
  size_bytes: number;
  created_at: string;
}

export default function AdminResourcesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState({
    title: "",
    is_free: true,
    visible: true,
    order: 0,
    file: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ total: 0, free: 0, paid: 0, visible: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        router.push("/login");
        return;
      }
      setAuthenticated(true);
      await fetchResources();
    } catch (err) {
      console.error("Auth error:", err);
      router.push("/login");
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;
      const resourcesData = (data || []) as Resource[];
      setResources(resourcesData);

      // Calculate stats
      setStats({
        total: resourcesData.length,
        free: resourcesData.filter(r => r.is_free).length,
        paid: resourcesData.filter(r => !r.is_free).length,
        visible: resourcesData.filter(r => r.visible).length,
      });
    } catch (err) {
      console.error("Error fetching resources:", err);
      setMessage("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;

    setForm((previous) => ({
      ...previous,
      file: selectedFile,
      title: previous.title || (selectedFile ? selectedFile.name.replace(/\.[^.]+$/, "") : ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (!form.file) {
        throw new Error("Please choose a file");
      }

      const normalizedTitle = form.title.trim() || form.file.name.replace(/\.[^.]+$/, "");

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Authentication required");
      }

      const uploadResponse = await fetch("/api/upload-resource", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: form.file.name,
          fileType: form.file.type || "application/octet-stream",
          isFree: form.is_free,
          fileSize: form.file.size,
        }),
      });

      if (!uploadResponse.ok) {
        const payload = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to create upload URL");
      }

      const { uploadUrl, fileKey } = (await uploadResponse.json()) as { uploadUrl: string; fileKey: string };

      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": form.file.type || "application/octet-stream",
        },
        body: form.file,
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file to R2");
      }

      // Save to database
      const { error: dbError } = await supabase.from("resources").insert([
        {
          title: normalizedTitle,
          file_url: fileKey,
          is_free: form.is_free,
          visible: form.visible,
          order: form.order,
          size_bytes: form.file.size,
        },
      ]);

      if (dbError) throw dbError;

      setMessage("✓ Resource uploaded successfully!");
      setForm({ title: "", is_free: true, visible: true, order: 0, file: null });
      await fetchResources();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
      console.error("Upload error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;

    try {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) throw error;
      setMessage("✓ Resource deleted");
      await fetchResources();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const handleToggleVisible = async (id: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({ visible: !visible })
        .eq("id", id);
      if (error) throw error;
      await fetchResources();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-8 lg:px-8">
        <div className="rounded-3xl border border-amber-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-[#1a2a21]/70 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="mb-8 border-b border-white/10 pb-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-amber-200 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-extrabold text-amber-100 sm:text-4xl">📂 Manage Resources</h1>
            <p className="mt-3 text-slate-300">Upload PDFs/Ebooks, set access rules, control visibility, and organize your resource library.</p>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg border p-4 text-sm ${
              message.includes("❌") 
                ? "border-red-300/30 bg-red-300/10 text-red-200"
                : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
            }`}>
              {message}
            </div>
          )}

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { label: "TOTAL", value: stats.total, icon: "📊" },
              { label: "FREE", value: stats.free, icon: "🆓" },
              { label: "PREMIUM", value: stats.paid, icon: "👑" },
              { label: "VISIBLE", value: stats.visible, icon: "👁️" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-cyan-200">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.icon}</p>
              </div>
            ))}
          </div>

          {/* Upload Form */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 to-transparent p-4 sm:p-6">
              <h2 className="text-xl font-bold text-cyan-100">⬆️ Upload New Resource</h2>
              <p className="mt-2 text-sm text-slate-300">Add a new PDF, ebook, or document to the library.</p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((previous) => ({ ...previous, title: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="e.g., Advanced IELTS Vocabulary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200">File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.epub,.doc,.docx"
                    className="mt-1 block w-full text-slate-300"
                  />
                  <p className="mt-1 text-xs text-slate-400">PDF, EPUB, DOC or DOCX accepted.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input type="checkbox" checked={form.is_free} onChange={(e) => setForm((previous) => ({ ...previous, is_free: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-sm">Free</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input type="checkbox" checked={form.visible} onChange={(e) => setForm((previous) => ({ ...previous, visible: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-sm">Visible</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200">Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm((previous) => ({ ...previous, order: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 font-semibold text-[#0f0f1a] transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "⬆️ Upload Resource"}
                </button>
              </form>
            </div>

            {/* Resources List */}
            <div className="rounded-lg border border-emerald-200/20 bg-gradient-to-br from-emerald-300/10 to-transparent p-4 sm:p-6">
              <h2 className="text-xl font-bold text-emerald-100">📚 Resources ({resources.length})</h2>
              <p className="mt-2 text-sm text-slate-300">Manage upload visibility and release order.</p>

              <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                {resources.length === 0 ? (
                  <p className="text-sm text-slate-400">No resources uploaded yet.</p>
                ) : (
                  resources.map((r) => (
                    <div key={r.id} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-slate-100">{r.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {r.is_free ? "🆓 Free" : "👑 Premium"} • {r.visible ? "👁️ Visible" : "🔒 Hidden"} • {r.order}
                        </p>
                      </div>
                      <div className="flex w-full gap-2 sm:ml-2 sm:w-auto sm:gap-1">
                        <button
                          onClick={() => handleToggleVisible(r.id, r.visible)}
                          className="w-full whitespace-nowrap rounded bg-white/10 px-2 py-2 text-xs text-slate-100 hover:bg-white/20 sm:w-auto sm:py-1"
                        >
                          {r.visible ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="w-full rounded bg-red-500/20 px-2 py-2 text-xs text-red-200 hover:bg-red-500/30 sm:w-auto sm:py-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
