"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { getTodayTotals, type DayTotals } from "@/app/actions/calorie";

interface MacrosBarProps {
  /** Increment this to trigger a re-fetch (pass a counter from ChatWindow after each send) */
  refreshKey: number;
}

export function MacrosBar({ refreshKey }: MacrosBarProps) {
  const [totals, setTotals] = useState<DayTotals | null>(null);

  useEffect(() => {
    getTodayTotals()
      .then(setTotals)
      .catch(() => setTotals(null));
  }, [refreshKey]);

  // Don't render if no calories logged today
  if (!totals || totals.calories === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border/40 bg-muted/20 text-xs">
      <Flame className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="font-semibold text-foreground">Today:</span>
      <span className="text-muted-foreground">
        <span className="text-foreground font-medium">{totals.calories}</span> kcal
      </span>
      <span className="text-border">|</span>
      <span className="text-muted-foreground">
        P: <span className="text-foreground font-medium">{Math.round(totals.protein_g)}</span>g
      </span>
      <span className="text-muted-foreground">
        C: <span className="text-foreground font-medium">{Math.round(totals.carbs_g)}</span>g
      </span>
      <span className="text-muted-foreground">
        F: <span className="text-foreground font-medium">{Math.round(totals.fat_g)}</span>g
      </span>
    </div>
  );
}
