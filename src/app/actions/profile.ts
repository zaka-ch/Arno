"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ProfilePayload {
  full_name?: string | null;
  age?: number | null;
  current_weight?: number | null;
  height?: number | null;
  fitness_goal?: string | null;
  gym_experience?: string | null;
  preferred_split?: string | null;
}

/**
 * Upserts the user's profile. Uses UPSERT so it works whether or not a row
 * already exists. The `id` is always taken from the authenticated session —
 * never trusted from the client.
 */
export async function updateProfile(fields: ProfilePayload) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized — please sign in first.");
  }

  // Strip out undefined values so we don't overwrite existing data with nulls accidentally
  const cleanFields: Record<string, unknown> = { id: user.id, updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) cleanFields[key] = value;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(cleanFields, { onConflict: "id" });

  if (error) {
    console.error("[updateProfile] Supabase error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/account");
  return { success: true };
}

/**
 * Called from the onboarding form on first sign-up.
 */
export async function submitOnboarding(formData: {
  fullName: string;
  age: number;
  currentWeight: number;
  height: number;
  fitnessGoal: string;
  gymExperience: string;
  preferredSplit: string;
}) {
  return updateProfile({
    full_name: formData.fullName,
    age: formData.age,
    current_weight: formData.currentWeight,
    height: formData.height,
    fitness_goal: formData.fitnessGoal,
    gym_experience: formData.gymExperience,
    preferred_split: formData.preferredSplit,
  });
}

/**
 * Ensures a profile row exists for the user. Called after sign-in if no profile
 * row is present (in case the DB trigger didn't fire).
 * Returns { success: true } or { success: false, error: string } — never throws.
 */
export async function ensureProfileExists(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // If the session hasn't propagated yet (cookie timing race), just return OK.
    // The profile will be created on the next server action call.
    if (authError || !user) {
      console.warn("[ensureProfileExists] No server-side session yet (timing race) — skipping.");
      return { success: true };
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existing) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, updated_at: new Date().toISOString() });

      if (insertError) {
        console.error("[ensureProfileExists] Insert error:", insertError.message);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[ensureProfileExists] Unexpected error:", msg);
    // Return success anyway — this is a non-fatal helper; the user is already
    // signed in. A missing profile row is handled gracefully elsewhere.
    return { success: true };
  }
}
