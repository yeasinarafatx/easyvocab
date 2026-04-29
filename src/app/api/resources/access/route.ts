import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    // Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", canAccess: false }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is premium
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", session.user.id)
      .single();

    const isPremium = !profileError && Boolean(profile?.is_premium);

    return new Response(
      JSON.stringify({ 
        canAccess: isPremium, 
        isPremium, 
        userId: session.user.id 
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
