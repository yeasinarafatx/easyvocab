"use client";

import { useState, useEffect } from "react";
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
      fetchResources();
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
      setResources((data || []) as Resource[]);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setMessage("Failed to fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (!form.title || !form.file) {
        throw new Error("Title and file are required");
      }

      // Upload file to storage
      const fileName = `${Date.now()}-${form.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resources")
        .upload(fileName, form.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("resources")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from("resources").insert([
        {
          title: form.title,
          file_url: urlData.publicUrl,
          is_free: form.is_free,
          visible: form.visible,
          order: form.order,
          size_bytes: form.file.size,
        },
      ]);

      if (dbError) throw dbError;

      setMessage("Resource uploaded successfully!");
      setForm({ title: "", is_free: true, visible: true, order: 0, file: null });
      fetchResources();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
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
      setMessage("Resource deleted");
      fetchResources();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleToggleVisible = async (id: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({ visible: !visible })
        .eq("id", id);
      if (error) throw error;
      fetchResources();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-slate-100">Loading...</div>;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-slate-100">Admin - Manage Resources</h1>

      {message && (
        <div className={`mt-4 rounded-md p-3 text-sm ${message.includes("Error") ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-md border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Upload New Resource</h2>

        <div>
          <label className="block text-sm font-medium text-slate-200">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            placeholder="e.g., Quick Vocab List"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">File</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.epub,.doc,.docx"
            className="mt-1 block w-full text-slate-300"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-slate-200">
            <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} />
            Free
          </label>
          <label className="flex items-center gap-2 text-slate-200">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
            Visible
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">Order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
            className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-[#0f0f1a] hover:bg-cyan-200 disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Upload Resource"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-100">Resources ({resources.length})</h2>
        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pa-2 text-left text-sm font-medium text-slate-200">Title</th>
              <th className="pa-2 text-left text-sm font-medium text-slate-200">Free</th>
              <th className="pa-2 text-left text-sm font-medium text-slate-200">Visible</th>
              <th className="pa-2 text-left text-sm font-medium text-slate-200">Order</th>
              <th className="pa-2 text-center text-sm font-medium text-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="pa-2 text-sm text-slate-300">{r.title}</td>
                <td className="pa-2 text-sm text-slate-300">{r.is_free ? "Yes" : "No"}</td>
                <td className="pa-2 text-sm text-slate-300">{r.visible ? "Yes" : "No"}</td>
                <td className="pa-2 text-sm text-slate-300">{r.order}</td>
                <td className="pa-2 flex justify-center gap-2">
                  <button
                    onClick={() => handleToggleVisible(r.id, r.visible)}
                    className="text-xs rounded-md bg-white/10 px-2 py-1 text-slate-100 hover:bg-white/20"
                  >
                    {r.visible ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-xs rounded-md bg-red-500/20 px-2 py-1 text-red-200 hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
