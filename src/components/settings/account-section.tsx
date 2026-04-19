"use client";

import { useState, useEffect } from "react";
import { User, Mail, Ruler, Weight, Target, Edit2, Check, X, Loader2, Dumbbell } from "lucide-react";
import { Button } from "@/v0-ui/button";
import { Input } from "@/v0-ui/input";
import { Label } from "@/v0-ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const FITNESS_GOALS = ["Muscle Gain (Bulking)", "Fat Loss (Cutting)", "Recomposition", "Strength & Power", "General Fitness"];
const GYM_LEVELS = ["Beginner (0-1 year)", "Intermediate (1-3 years)", "Advanced (3+ years)"];
const SPLITS = ["Push Pull Legs (PPL)", "Arnold Split", "Upper / Lower", "Bro Split", "Full Body", "Let Arno decide"];

const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function AccountSection() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Profile>>({});

  // Load profile directly from the Supabase client (has in-memory session token)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user || !mounted) { setLoading(false); return; }

        setUserId(user.id);
        setEmail(user.email ?? "");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("[Account] Profile fetch error:", error);
          toast.error("Could not load profile: " + error.message);
        }

        if (mounted && data) setProfile(data as Profile);
      } catch (err) {
        console.error("[Account] Unexpected error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const startEdit = () => {
    setDraft({
      full_name: profile?.full_name ?? "",
      age: profile?.age ?? undefined,
      current_weight: profile?.current_weight ?? undefined,
      height: profile?.height ?? undefined,
      fitness_goal: profile?.fitness_goal ?? FITNESS_GOALS[0],
      gym_experience: profile?.gym_experience ?? GYM_LEVELS[0],
      preferred_split: profile?.preferred_split ?? SPLITS[0],
      gender: profile?.gender ?? "prefer_not_to_say",
    });
    setIsEditing(true);
  };

  // Uses client-side Supabase directly — no server action, no cookie propagation issues
  const handleSave = async () => {
    if (!userId) { toast.error("Not logged in."); return; }
    setSaving(true);

    const payload = {
      id: userId,
      full_name: draft.full_name || null,
      age: draft.age || null,
      current_weight: draft.current_weight || null,
      height: draft.height || null,
      fitness_goal: draft.fitness_goal || null,
      gym_experience: draft.gym_experience || null,
      preferred_split: draft.preferred_split || null,
      gender: draft.gender || null,
      updated_at: new Date().toISOString(),
    };

    console.log("[Account] Saving profile payload:", payload);

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("[Account] Save error:", error);
      toast.error(`Failed to save: ${error.message}`);
      setSaving(false);
      return;
    }

    setProfile((prev) => ({ ...prev!, ...payload } as Profile));
    toast.success("Profile saved! Arno now knows your stats 💪");
    setIsEditing(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account</h2>
          <p className="text-muted-foreground text-sm mt-1">Your fitness profile — what Arno uses to personalize advice</p>
        </div>
        {!isEditing ? (
          <Button onClick={startEdit} className="gap-2">
            <Edit2 className="w-4 h-4" />Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving} className="gap-2">
              <X className="w-4 h-4" />Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            {profile?.full_name ? (
              <span className="text-3xl font-black text-primary">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Dumbbell className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{profile?.full_name || "No name set yet"}</h3>
            <p className="text-muted-foreground text-sm">{email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {profile?.fitness_goal && (
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {profile.fitness_goal}
                </span>
              )}
              {profile?.gym_experience && (
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  {profile.gym_experience}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="text-base font-semibold">Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-muted-foreground text-xs">
              <User className="w-3.5 h-3.5" />Full Name
            </Label>
            {isEditing ? (
              <Input
                value={draft.full_name ?? ""}
                placeholder="Your full name"
                onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
              />
            ) : (
              <p className="font-medium text-sm py-2">{profile?.full_name || <span className="text-muted-foreground italic">Not set</span>}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-muted-foreground text-xs">
              <Mail className="w-3.5 h-3.5" />Email
            </Label>
            <p className="font-medium text-sm py-2 text-muted-foreground">{email}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-muted-foreground text-xs">
              <User className="w-3.5 h-3.5" />Age
            </Label>
            {isEditing ? (
              <Input
                type="number" min={10} max={100} placeholder="22"
                value={draft.age ?? ""}
                onChange={(e) => setDraft({ ...draft, age: parseInt(e.target.value) || undefined })}
              />
            ) : (
              <p className="font-medium text-sm py-2">{profile?.age ? `${profile.age} years` : <span className="text-muted-foreground italic">Not set</span>}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-muted-foreground text-xs">
              <User className="w-3.5 h-3.5" />Gender
            </Label>
            {isEditing ? (
              <select className={selectCls} value={draft.gender ?? "prefer_not_to_say"} onChange={(e) => setDraft({ ...draft, gender: e.target.value as 'male'|'female'|'prefer_not_to_say' })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            ) : (
              <p className="font-medium text-sm py-2">{profile?.gender === 'male' ? 'Male' : profile?.gender === 'female' ? 'Female' : <span className="text-muted-foreground italic">Prefer not to say</span>}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body Metrics */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="text-base font-semibold">Body Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-muted-foreground text-xs">
              <Ruler className="w-3.5 h-3.5" />Height (cm)
            </Label>
            {isEditing ? (
              <Input
                type="number" placeholder="180"
                value={draft.height ?? ""}
                onChange={(e) => setDraft({ ...draft, height: parseFloat(e.target.value) || undefined })}
              />
            ) : (
              <p className="font-medium text-sm py-2">{profile?.height ? `${profile.height} cm` : <span className="text-muted-foreground italic">Not set</span>}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-muted-foreground text-xs">
              <Weight className="w-3.5 h-3.5" />Weight (kg)
            </Label>
            {isEditing ? (
              <Input
                type="number" step="0.1" placeholder="75"
                value={draft.current_weight ?? ""}
                onChange={(e) => setDraft({ ...draft, current_weight: parseFloat(e.target.value) || undefined })}
              />
            ) : (
              <p className="font-medium text-sm py-2">{profile?.current_weight ? `${profile.current_weight} kg` : <span className="text-muted-foreground italic">Not set</span>}</p>
            )}
          </div>
        </div>
      </div>

      {/* Fitness Profile */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />Fitness Profile
        </h3>

        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Fitness Goal</Label>
          {isEditing ? (
            <select className={selectCls} value={draft.fitness_goal ?? ""} onChange={(e) => setDraft({ ...draft, fitness_goal: e.target.value })}>
              {FITNESS_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          ) : (
            <p className="font-medium text-sm py-2">{profile?.fitness_goal || <span className="text-muted-foreground italic">Not set</span>}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Experience Level</Label>
          {isEditing ? (
            <select className={selectCls} value={draft.gym_experience ?? ""} onChange={(e) => setDraft({ ...draft, gym_experience: e.target.value })}>
              {GYM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <p className="font-medium text-sm py-2">{profile?.gym_experience || <span className="text-muted-foreground italic">Not set</span>}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Training Split</Label>
          {isEditing ? (
            <select className={selectCls} value={draft.preferred_split ?? ""} onChange={(e) => setDraft({ ...draft, preferred_split: e.target.value })}>
              {SPLITS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <p className="font-medium text-sm py-2">{profile?.preferred_split || <span className="text-muted-foreground italic">Not set</span>}</p>
          )}
        </div>
      </div>
    </div>
  );
}
