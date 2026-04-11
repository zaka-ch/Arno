"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Settings, User } from "lucide-react";
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function SidebarUserFooter() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch profile directly from DB — no context, no localStorage
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, fitness_goal, current_weight")
          .eq("id", currentUser.id)
          .single();
        setProfile(data as Profile | null);
      } else {
        setProfile(null);
      }
    });

    // Also fetch immediately on mount
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, fitness_goal, current_weight")
          .eq("id", u.id)
          .single();
        setProfile(data as Profile | null);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);


  const displayName = profile?.full_name || user?.email || "Guest";
  const goalLabel = profile?.fitness_goal?.split("(")[0].trim() || (user ? "Profile incomplete" : "Sign in to personalize");

  return (
    <div className="mt-auto border-t border-sidebar-border p-3">
      <Link href={user ? "/settings" : "/account"} className="block">
        <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
            {profile?.full_name ? (
              <span className="text-sm font-bold text-primary">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              {displayName}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{goalLabel}</span>
            </div>
          </div>
        </div>
      </Link>
      <Link
        href="/settings"
        className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-sidebar-border/60 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <Settings className="h-3.5 w-3.5" />
        Settings
      </Link>
    </div>
  );
}
