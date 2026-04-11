// ─── Database Types (mirror Supabase schema) ──────────────────────────────────

// ─── Utility / API Types ─────────────────────────────────────────────────────

export interface HealthPayload {
  ok: boolean;
  message: string;
}

export type SplitType = "ppl" | "arnold" | "upper_lower" | "bro";


export interface Profile {
  id: string;
  full_name: string | null;
  age: number | null;
  current_weight: number | null;
  height: number | null;
  fitness_goal: string | null;
  gym_experience: string | null;
  preferred_split: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  conversation_id: string | null;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  content: string; // raw markdown table from AI
  created_at: string;
}

// ─── Computed / UI Types ──────────────────────────────────────────────────────

export interface MacroTargets {
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fats: number;    // g
}

/**
 * Mifflin-St Jeor TDEE calculator
 * Activity: sedentary(1.2), light(1.375), moderate(1.55), very(1.725)
 */
export function calculateMacros(profile: Profile): MacroTargets | null {
  const { current_weight, height, age, fitness_goal } = profile;
  if (!current_weight || !height || !age) return null;

  // BMR (assume male for now — can add gender later)
  const bmr = 10 * current_weight + 6.25 * height - 5 * age + 5;

  // TDEE — assume moderately active for gym users
  const tdee = Math.round(bmr * 1.55);

  const goal = fitness_goal?.toLowerCase() ?? "";
  let calories = tdee;
  if (goal.includes("bulk") || goal.includes("gain")) calories = tdee + 300;
  else if (goal.includes("cut") || goal.includes("fat") || goal.includes("loss")) calories = tdee - 400;
  else if (goal.includes("strength")) calories = tdee + 100;

  // Macro split
  const protein = Math.round(current_weight * 2.2); // 2.2g per kg
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);

  return { calories, protein, carbs: Math.max(carbs, 50), fats };
}
