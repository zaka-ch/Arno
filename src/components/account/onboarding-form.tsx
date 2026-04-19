"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitOnboarding } from "@/app/actions/profile";
import { Dumbbell, ChevronRight, ChevronLeft } from "lucide-react";

type Step = 1 | 2 | 3;

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
  "I need Arno to decide",
];

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>(1);

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    currentWeight: "",
    height: "",
    fitnessGoal: FITNESS_GOALS[0],
    gymExperience: GYM_LEVELS[0],
    preferredSplit: SPLITS[0],
    gender: "prefer_not_to_say" as "male" | "female" | "prefer_not_to_say",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.fullName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      await submitOnboarding({
        fullName: formData.fullName,
        age: parseInt(formData.age) || 0,
        currentWeight: parseFloat(formData.currentWeight) || 0,
        height: parseFloat(formData.height) || 0,
        fitnessGoal: formData.fitnessGoal,
        gymExperience: formData.gymExperience,
        preferredSplit: formData.preferredSplit,
        gender: formData.gender,
      });

      toast.success("Profile saved! Zdem ya wahesh — let's get to work 💪");
      // Redirect to /chat — the layout gate will no longer block since full_name is set
      router.push("/chat");
      router.refresh();
    } catch (err) {
      toast.error("Failed to save profile. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const steps = ["About You", "Your Body", "Your Training"];

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
          <Dumbbell className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Arno</h1>
        <p className="text-muted-foreground text-sm mt-1 text-center max-w-xs">
          A few quick questions so Arno can personalise your coaching.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-primary"
                    : isActive
                    ? "bg-primary/60"
                    : "bg-border"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20 space-y-5"
      >
        {/* Step 1 — About You */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="E.g. Zaka"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                min="10"
                max="100"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Your Body */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentWeight">Weight (kg)</Label>
              <Input
                id="currentWeight"
                type="number"
                step="0.1"
                placeholder="75.5"
                value={formData.currentWeight}
                onChange={(e) => handleChange("currentWeight", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="180"
                value={formData.height}
                onChange={(e) => handleChange("height", e.target.value)}
                disabled={loading}
              />
            </div>
            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange("gender", "male")}
                  className={`flex-1 h-10 rounded-lg text-sm border font-medium transition-colors ${
                    formData.gender === 'male' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-black/10 hover:text-foreground'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"  
                  onClick={() => handleChange("gender", "female")}
                  className={`flex-1 h-10 rounded-lg text-sm border font-medium transition-colors ${
                    formData.gender === 'female' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-black/10 hover:text-foreground'
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("gender", "prefer_not_to_say")}
                  className={`flex-1 h-10 rounded-lg text-sm border font-medium transition-colors ${
                    formData.gender === 'prefer_not_to_say' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-black/10 hover:text-foreground'
                  }`}
                >
                  Prefer not to say
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fitness Goal</Label>
              <select
                className={selectCls}
                value={formData.fitnessGoal}
                onChange={(e) => handleChange("fitnessGoal", e.target.value)}
                disabled={loading}
              >
                {FITNESS_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3 — Your Training */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gym Experience Level</Label>
              <select
                className={selectCls}
                value={formData.gymExperience}
                onChange={(e) => handleChange("gymExperience", e.target.value)}
                disabled={loading}
              >
                {GYM_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Training Split</Label>
              <select
                className={selectCls}
                value={formData.preferredSplit}
                onChange={(e) => handleChange("preferredSplit", e.target.value)}
                disabled={loading}
              >
                {SPLITS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={loading}
              className="flex-1 gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="flex-1 gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Start Training 💪"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
