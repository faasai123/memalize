import { supabase } from "@/integrations/supabase/client";

/**
 * Returns "/" when the signed-in user already completed onboarding
 * (track + display name saved), otherwise "/onboarding".
 */
export async function destinationAfterAuth(): Promise<"/" | "/onboarding"> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return "/onboarding";
  const { data: profile } = await supabase
    .from("profiles")
    .select("track, display_name")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.track ? "/" : "/onboarding";
}
