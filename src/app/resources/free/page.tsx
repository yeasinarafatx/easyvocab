import { supabase } from "@/lib/supabase";

interface Resource {
  id: string;
  title: string;
  file_url: string;
  size_bytes: number;
}

export default async function FreeResourcesPage() {
  let resources: Resource[] = [];
  let error = "";

  try {
    const { data, error: fetchError } = await supabase
      .from("resources")
      .select("id, title, file_url, size_bytes")
      .eq("is_free", true)
      .eq("visible", true)
      .order("order", { ascending: true });

    if (fetchError) {
      error = fetchError.message;
    } else {
      resources = (data || []) as Resource[];
    }
  } catch (err: any) {
    error = err.message || "Failed to fetch resources";
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold text-slate-100">Free PDF / Ebooks</h1>
      <p className="mt-2 text-sm text-slate-300">Click a file title to download.</p>

      {error && <div className="mt-4 rounded-md bg-red-500/20 p-3 text-sm text-red-200">{error}</div>}

      {resources.length === 0 ? (
        <p className="mt-6 text-slate-400">No free resources available yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {resources.map((item) => (
            <li key={item.id} className="rounded-md border border-white/6 bg-white/3 p-3">
              <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-slate-100 hover:text-cyan-300">
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
