"use server";

import { createClient } from "@/lib/supabase/server";

export interface PersonalRecord {
  id: string;
  exercise: string;
  weight_kg: number;
  reps: number | null;
  recorded_at: string;
}

/** Returns the user's latest PR per exercise (top 10 by most recent). */
export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("personal_records")
    .select("id, exercise, weight_kg, reps, recorded_at")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(50);

  if (!data) return [];

  // Keep only the most recent record per exercise
  const seen = new Set<string>();
  return data.filter((row) => {
    const key = row.exercise.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as PersonalRecord[];
}
