import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user:", user?.id, user?.email);

    // Get all resources
    const { data: resources, error: resourcesError } = await supabase
      .from("resources")
      .select("*");

    if (resourcesError) {
      console.error("Resources error:", resourcesError);
      return NextResponse.json({ error: resourcesError }, { status: 500 });
    }

    // Get user profile
    let userProfile = null;
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
      }
      userProfile = profile;
    }

    return NextResponse.json({
      user: {
        id: user?.id,
        email: user?.email,
        emailConfirmed: user?.email_confirmed_at,
      },
      profile: userProfile,
      resources: resources,
      resourceCount: resources?.length || 0,
    });
  } catch (error: unknown) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
