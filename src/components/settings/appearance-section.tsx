"use client"

import { Sun, Moon, Monitor, Type, Gauge, Check } from "lucide-react"
import { Label } from "@/v0-ui/label"
import { Switch } from "@/v0-ui/switch"
import { useSettings, type Theme, type AccentColor, type FontSize } from "@/lib/settings-context"
import { cn } from "@/lib/utils"

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
]

const accentColors: { id: AccentColor; label: string; color: string; ring: string }[] = [
  { id: "lime", label: "Lime", color: "bg-lime-400", ring: "ring-lime-400" },
  { id: "cyan", label: "Cyan", color: "bg-cyan-400", ring: "ring-cyan-400" },
  { id: "orange", label: "Orange", color: "bg-orange-400", ring: "ring-orange-400" },
  { id: "pink", label: "Pink", color: "bg-pink-400", ring: "ring-pink-400" },
  { id: "violet", label: "Violet", color: "bg-violet-400", ring: "ring-violet-400" },
]

const fontSizes: { id: FontSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
]

export function AppearanceSection() {
  const { settings, updateAppearance } = useSettings()
  const { theme, accentColor, fontSize, reducedMotion, compactMode } = settings.appearance

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold">Appearance</h2>
        <p className="text-muted-foreground text-sm mt-1">Customize how Arno looks and feels</p>
      </div>

      {/* Theme Selection */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateAppearance({ theme: t.id })}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                theme === t.id
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/50 border-border hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                theme === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <t.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-sm font-medium",
                theme === t.id ? "text-primary" : "text-foreground"
              )}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => updateAppearance({ accentColor: color.id })}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                accentColor === color.id
                  ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                  : "bg-muted/50 border-border hover:bg-muted"
              )}
            >
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", color.color)}>
                {accentColor === color.id && (
                  <Check className="w-4 h-4 text-black" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium",
                accentColor === color.id ? "text-primary" : "text-foreground"
              )}>
                {color.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Type className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Font Size</h3>
        </div>
        <div className="flex gap-3">
          {fontSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => updateAppearance({ fontSize: size.id })}
              className={cn(
                "flex-1 py-3 rounded-xl border transition-all text-center",
                fontSize === size.id
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-border hover:bg-muted text-foreground"
              )}
            >
              <span className={cn(
                "font-medium",
                size.id === "small" && "text-sm",
                size.id === "medium" && "text-base",
                size.id === "large" && "text-lg"
              )}>
                {size.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-foreground font-medium">Reduced Motion</Label>
                <p className="text-xs text-muted-foreground">Minimize animations throughout the app</p>
              </div>
            </div>
            <Switch 
              checked={reducedMotion} 
              onCheckedChange={(checked) => updateAppearance({ reducedMotion: checked })} 
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <Label className="text-foreground font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">Reduce spacing for more content on screen</p>
            </div>
            <Switch 
              checked={compactMode} 
              onCheckedChange={(checked) => updateAppearance({ compactMode: checked })} 
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="bg-background rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Arno</p>
              <p className="text-xs text-muted-foreground">AI Fitness Coach</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-foreground">
              This is how your messages will appear with the current settings.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 ml-8">
            <p className="text-sm text-foreground">
              And this is how Arno&apos;s responses will look.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
