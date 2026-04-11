"use server";

import { createClient } from "@/lib/supabase/server";

export interface DayTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Returns today's summed calorie/macro totals for the current user. */
export async function getTodayTotals(): Promise<DayTotals> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("calorie_logs")
    .select("calories, protein_g, carbs_g, fat_g")
    .eq("user_id", user.id)
    .eq("date", today);

  return (data ?? []).reduce<DayTotals>(
    (acc, row) => ({
      calories: acc.calories + (row.calories ?? 0),
      protein_g: acc.protein_g + (row.protein_g ?? 0),
      carbs_g: acc.carbs_g + (row.carbs_g ?? 0),
      fat_g: acc.fat_g + (row.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}
