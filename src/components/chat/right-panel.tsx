"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Flame, Droplets, Zap, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { calculateMacros, type MacroTargets } from "@/types";
import type { Profile } from "@/types";
import { Progress } from "@/v0-ui/progress";

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function RightPanel({ isOpen, onToggle }: RightPanelProps) {
  return (
    <>
      <aside className={cn(
        "fixed right-0 top-0 z-40 h-screen border-l border-border bg-sidebar transition-all duration-300",
        isOpen ? "w-80" : "w-0 overflow-hidden",
        "max-lg:shadow-2xl"
      )}>
        <MacrosView />
      </aside>
    </>
  );
}

function MacrosView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) {
          const p = data as Profile;
          setProfile(p);
          setMacros(calculateMacros(p));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded-lg" />
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
      </div>
    );
  }

  if (!profile || !macros) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">No Profile Data</p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete your profile in Settings to see your personalized macro targets.
        </p>
      </div>
    );
  }

  const macroItems = [
    { name: "Protein", target: macros.protein, unit: "g", color: "bg-primary", icon: Zap, note: "Muscle building" },
    { name: "Carbs", target: macros.carbs, unit: "g", color: "bg-blue-500", icon: Flame, note: "Energy" },
    { name: "Fats", target: macros.fats, unit: "g", color: "bg-yellow-500", icon: Droplets, note: "Hormones & health" },
  ];

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full pb-8">
      <div className="py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-sidebar-foreground">Daily Macro Targets</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Based on your profile · {profile.fitness_goal?.split("(")[0].trim() || "General"}
        </p>
      </div>

      {/* Calories */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-foreground">Daily Calories</span>
          <span className="text-lg font-bold text-primary">{macros.calories.toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground">kcal / day target</p>
      </div>

      {/* Macros */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-primary" />Macro Breakdown
        </h3>
        {macroItems.map((macro) => (
          <div key={macro.name} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", macro.color)} />
                <div>
                  <span className="text-sm font-medium text-foreground">{macro.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">({macro.note})</span>
                </div>
              </div>
              <span className="text-sm font-bold text-foreground">
                {macro.target}{macro.unit}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              ≈ {macro.name === "Protein" ? macro.target * 4 : macro.name === "Carbs" ? macro.target * 4 : macro.target * 9} kcal
            </div>
          </div>
        ))}
      </div>

      {/* Profile Summary */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Based On</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-base font-bold text-primary">{profile.current_weight ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground">kg</div>
          </div>
          <div>
            <div className="text-base font-bold text-primary">{profile.height ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground">cm</div>
          </div>
          <div>
            <div className="text-base font-bold text-primary">{profile.age ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground">years</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center pt-1">
          Mifflin-St Jeor formula · Moderate activity
        </p>
      </div>
    </div>
  );
}
