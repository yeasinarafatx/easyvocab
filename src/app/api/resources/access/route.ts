import { createSupabaseTokenClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", canAccess: false }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const tokenSupabase = createSupabaseTokenClient(token);
    const { data: { user }, error: userError } = await tokenSupabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", canAccess: false }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is premium
    const { data: profile, error: profileError } = await tokenSupabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    const isPremium = !profileError && Boolean(profile?.is_premium);

    return new Response(
      JSON.stringify({ 
        canAccess: isPremium, 
        isPremium, 
        userId: user.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, canAccess: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
