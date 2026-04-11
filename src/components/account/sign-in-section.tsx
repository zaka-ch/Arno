"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileExists } from "@/app/actions/profile";
import { Dumbbell, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "signup";
type Status = "idle" | "loading" | "error" | "success";

const FITNESS_GOALS = [
  "Muscle Gain (Bulking)",
  "Fat Loss (Cutting)",
  "Recomposition",
  "Strength & Power",
  "General Fitness",
];

const GYM_LEVELS = [
  "Beginner (0-1 year)",
  "Intermediate (1-3 years)",
  "Advanced (3+ years)",
];

const SPLITS = [
  "Push Pull Legs (PPL)",
  "Arnold Split",
  "Upper / Lower",
  "Bro Split",
  "Full Body",
  "Let Arno decide",
];

export function SignInSection() {
  const [mode, setMode] = useState<Mode>("login");
  const [status, setStatus] = useState<Status>("idle");
  const [showPassword, setShowPassword] = useState(false);

  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Profile fields (sign-up only)
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState(FITNESS_GOALS[0]);
  const [gymLevel, setGymLevel] = useState(GYM_LEVELS[0]);
  const [split, setSplit] = useState(SPLITS[0]);

  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setStatus("error");
        toast.error(error.message);
        return;
      }
      // Ensure a profile row exists — non-fatal, wrap in try/catch so a server
      // action timing issue never blocks the user from reaching /chat.
      try {
        await ensureProfileExists();
      } catch {
        console.warn("[SignIn] ensureProfileExists failed (non-fatal) — continuing to /chat");
      }
      toast.success("Welcome back! Let's get to work 💪");
      window.location.href = "/chat";
    } else {
      // ── Sign up ──────────────────────────────────────────────────────────
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setStatus("error");
        toast.error(error.message);
        return;
      }

      // Sign in immediately to get a valid session (so auth.uid() is set for RLS)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Email confirmation is required
        toast.success("Account created! Check your email to confirm, then sign in.");
        setMode("login");
        setStatus("idle");
        return;
      }

      // Session is active — save the profile now (RLS will pass)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const newUserId = session?.user?.id;

      if (newUserId) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: newUserId,
            full_name: fullName.trim() || null,
            age: parseInt(age) || null,
            current_weight: parseFloat(weight) || null,
            height: parseFloat(height) || null,
            fitness_goal: fitnessGoal,
            gym_experience: gymLevel,
            preferred_split: split,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (profileError) {
          console.error("[SignUp] Profile save error:", profileError);
          toast.warning(
            "Account created! Profile save had an issue — update it in Settings."
          );
        }
      }

      const firstName = fullName.trim().split(" ")[0] || "champ";
      toast.success(`Welcome to Arno, ${firstName}! Let's get to work 💪`);

      // Go to /onboarding if no name was set, otherwise /chat
      window.location.href = fullName.trim() ? "/chat" : "/onboarding";
    }

    setStatus("idle");
  }

  const selectCls =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 300 300" className="mb-4 drop-shadow-md">
            <rect width="300" height="300" rx="67" fill="white"/>
            <path d="M150 75 L210 225 L188 225 L176 190 L124 190 L112 225 L90 225 Z" fill="#0f0f0f"/>
          </svg>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ARNO</h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI fitness coach</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
          {/* Tab Toggle */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign-up profile section */}
            {mode === "signup" && (
              <>
                <div className="pb-3 border-b border-border/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Your Profile
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="E.g. Zaka"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={status === "loading"}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="22"
                          min={10}
                          max={100}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          disabled={status === "loading"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="75"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          disabled={status === "loading"}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="178"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          disabled={status === "loading"}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Fitness Goal</Label>
                      <select
                        className={`${selectCls} mt-1`}
                        value={fitnessGoal}
                        onChange={(e) => setFitnessGoal(e.target.value)}
                        disabled={status === "loading"}
                      >
                        {FITNESS_GOALS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Experience Level</Label>
                        <select
                          className={`${selectCls} mt-1`}
                          value={gymLevel}
                          onChange={(e) => setGymLevel(e.target.value)}
                          disabled={status === "loading"}
                        >
                          {GYM_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Training Split</Label>
                        <select
                          className={`${selectCls} mt-1`}
                          value={split}
                          onChange={(e) => setSplit(e.target.value)}
                          disabled={status === "loading"}
                        >
                          {SPLITS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Account Details
                  </p>
                </div>
              </>
            )}

            {/* Auth fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === "loading"}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mt-2"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create My Account"
              )}
            </Button>
          </form>

          {mode === "login" && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setMode("signup")}
              >
                Sign up for free
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {/* Google logo SVG */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
