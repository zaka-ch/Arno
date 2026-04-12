"use client"

import { useState, useTransition } from "react"
import { updateProfile } from "@/app/actions/profile"
import { Button } from "@/v0-ui/button"
import { Loader2 } from "lucide-react"

interface Props {
  /** Display name pre-filled from Google OAuth metadata */
  defaultName?: string | null
  onComplete: () => void
}

const selectCls =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground " +
  "ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50 transition-colors"

const inputCls =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 " +
  "ring-offset-background transition-colors"

export function ProfileCompletionModal({ defaultName, onComplete }: Props) {
  const [fullName, setFullName]       = useState(defaultName ?? "")
  const [weight, setWeight]           = useState("")
  const [height, setHeight]           = useState("")
  const [goal, setGoal]               = useState("")
  const [level, setLevel]             = useState("")
  const [split, setSplit]             = useState("")
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!fullName.trim()) { setErrorMsg("Please enter your name."); return }
    if (!weight || isNaN(+weight)) { setErrorMsg("Please enter a valid weight."); return }
    if (!height || isNaN(+height)) { setErrorMsg("Please enter a valid height."); return }
    if (!goal)  { setErrorMsg("Please select your goal."); return }
    if (!level) { setErrorMsg("Please select your fitness level."); return }
    if (!split) { setErrorMsg("Please select your preferred split."); return }

    startTransition(async () => {
      try {
        await updateProfile({
          full_name:       fullName.trim(),
          current_weight:  parseFloat(weight),
          height:          parseFloat(height),
          fitness_goal:    goal,
          gym_experience:  level,
          preferred_split: split,
        })
        onComplete()
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to save profile. Please try again."
        )
      }
    })
  }

  return (
    /* Overlay — pointer-events on backdrop are disabled so clicking outside does nothing */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden">

        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

        <div className="p-6 pb-7">
          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-6">
            <span style={{ color: "var(--foreground)" }} className="mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="52" height="52">
                <rect width="300" height="300" rx="67" fill="currentColor"/>
                <path d="M150 75 L210 225 L188 225 L176 190 L124 190 L112 225 L90 225 Z"
                  fill="var(--background, #0f0f0f)"/>
              </svg>
            </span>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Complete your profile</h2>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
              ARNO needs a few details to personalize your coaching
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Weight + Height row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  placeholder="75"
                  min={30}
                  max={300}
                  step={0.5}
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="175"
                  min={100}
                  max={250}
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Goal */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Goal
              </label>
              <select value={goal} onChange={e => setGoal(e.target.value)} className={selectCls}>
                <option value="" disabled>Select your goal</option>
                <option value="bulk">Bulk — build muscle &amp; size</option>
                <option value="cut">Cut — lose fat, keep muscle</option>
                <option value="maintenance">Maintenance — stay lean &amp; strong</option>
              </select>
            </div>

            {/* Fitness Level */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fitness Level
              </label>
              <select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>
                <option value="" disabled>Select your level</option>
                <option value="beginner">Beginner — less than 1 year</option>
                <option value="intermediate">Intermediate — 1–3 years</option>
                <option value="advanced">Pro — 3+ years</option>
              </select>
            </div>

            {/* Preferred Split */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Preferred Split
              </label>
              <select value={split} onChange={e => setSplit(e.target.value)} className={selectCls}>
                <option value="" disabled>Select your split</option>
                <option value="ppl">Push / Pull / Legs</option>
                <option value="arnold">Arnold Split</option>
                <option value="upper_lower">Upper / Lower</option>
                <option value="bro">Bro Split</option>
                <option value="full_body">Full Body</option>
              </select>
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 mt-1 text-sm font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Start Training with ARNO 💪"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
