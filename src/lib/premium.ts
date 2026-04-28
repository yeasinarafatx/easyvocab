import { supabase } from "@/lib/supabase";

export type PremiumSnapshot = {
  hasSession: boolean;
  userId: string | null;
  isPremium: boolean;
};

export async function fetchPremiumSnapshot(): Promise<PremiumSnapshot> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    return {
      hasSession: false,
      userId: null,
      isPremium: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  return {
    hasSession: true,
    userId: user.id,
    isPremium: Boolean(profile?.is_premium),
  };
}

export function requiresPremium(levelNumber: number, isDemoLevel: boolean): boolean {
  if (isDemoLevel) return false;
  return levelNumber > 1;
}
