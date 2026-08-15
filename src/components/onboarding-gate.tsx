import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

/**
 * Sends signed-in users who have never picked a track to onboarding.
 * Returning users (track already saved) are left alone.
 */
export function OnboardingGate() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("track")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || data?.track) return;
        navigate({ to: "/onboarding", replace: true });
      });
    return () => {
      active = false;
    };
  }, [user, loading, navigate]);

  return null;
}
