import { NextResponse } from "next/server";
import { createR2DownloadUrl } from "@/lib/r2";
import { createSupabaseServerClient, createSupabaseTokenClient } from "@/lib/supabaseServer";
import { downloadLimiter, getClientKey } from "@/lib/rateLimiter";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get("id");
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!resourceId) {
      return NextResponse.json({ error: "Missing resource id" }, { status: 400 });
    }

    // Rate limiting: Extract user ID from token if available, else use IP
    let userId: string | undefined;
    if (token) {
      try {
        const tokenSupabase = createSupabaseTokenClient(token);
        const { data: { user } } = await tokenSupabase.auth.getUser();
        userId = user?.id;
      } catch {
        // Continue even if we can't get user ID
      }
    }

    const clientKey = getClientKey(request, userId);
    if (!downloadLimiter.isAllowed(clientKey)) {
      const resetTime = downloadLimiter.getResetTime(clientKey);
      return NextResponse.json(
        {
          error: `Rate limited. Try again in ${resetTime} seconds`,
          retryAfter: resetTime,
        },
        { status: 429, headers: { "Retry-After": resetTime.toString() } }
      );
    }

    const serverSupabase = await createSupabaseServerClient();
    const { data: resource, error: resourceError } = await serverSupabase
      .from("resources")
      .select("id, file_url, is_free, visible")
      .eq("id", resourceId)
      .maybeSingle();

    if (resourceError) {
      console.error("Resource fetch error:", resourceError);
      return NextResponse.json({ error: "Resource fetch failed" }, { status: 500 });
    }

    if (!resource || !resource.visible) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // If free resource, allow download
    if (resource.is_free) {
      const downloadUrl = await createR2DownloadUrl(resource.file_url);
      return NextResponse.json({ downloadUrl });
    }

    // For paid resources, check premium access
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenSupabase = createSupabaseTokenClient(token);
    const { data: { user }, error: userError } = await tokenSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await tokenSupabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ error: "Profile fetch failed" }, { status: 500 });
    }

    if (!profile?.is_premium) {
      return NextResponse.json({ error: "Premium access required" }, { status: 403 });
    }

    const downloadUrl = await createR2DownloadUrl(resource.file_url);
    return NextResponse.json({ downloadUrl });
  } catch (error: unknown) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}