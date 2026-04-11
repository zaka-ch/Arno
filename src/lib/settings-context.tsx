"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Fix #5 – deep-merge so nested objects (appearance, notifications) are not wiped
function deepMerge<T extends object>(defaults: T, stored: Partial<T>): T {
  const result: T = { ...defaults }
  for (const key in stored) {
    const storedVal = stored[key]
    const defaultVal = defaults[key]
    if (
      storedVal !== null &&
      storedVal !== undefined &&
      typeof storedVal === "object" &&
      !Array.isArray(storedVal) &&
      defaultVal !== null &&
      defaultVal !== undefined &&
      typeof defaultVal === "object" &&
      !Array.isArray(defaultVal)
    ) {
      result[key] = deepMerge(defaultVal as object, storedVal as object) as T[typeof key]
    } else if (storedVal !== undefined) {
      result[key] = storedVal as T[typeof key]
    }
  }
  return result
}

// Types
export type Theme = "light" | "dark" | "system"
export type AccentColor = "lime" | "cyan" | "orange" | "pink" | "violet"
export type FontSize = "small" | "medium" | "large"

interface NotificationSetting {
  id: string
  enabled: boolean
}

interface UserProfile {
  name: string
  email: string
  avatar: string | null
  dateOfBirth: string
  height: string
  weight: string
  goal: string
  fitnessLevel: string
}

interface NotificationSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  notifications: NotificationSetting[]
  quietHoursStart: string
  quietHoursEnd: string
}

interface PrivacySettings {
  publicProfile: boolean
  shareData: boolean
  analytics: boolean
  twoFactorEnabled: boolean
}

interface AppearanceSettings {
  theme: Theme
  accentColor: AccentColor
  fontSize: FontSize
  reducedMotion: boolean
  compactMode: boolean
}

interface Settings {
  profile: UserProfile
  notifications: NotificationSettings
  privacy: PrivacySettings
  appearance: AppearanceSettings
}

interface SettingsContextType {
  settings: Settings
  updateProfile: (profile: Partial<UserProfile>) => void
  updateNotifications: (notifications: Partial<NotificationSettings>) => void
  updatePrivacy: (privacy: Partial<PrivacySettings>) => void
  updateAppearance: (appearance: Partial<AppearanceSettings>) => void
  toggleNotification: (id: string) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  profile: {
    name: "",
    email: "",
    avatar: null,
    dateOfBirth: "",
    height: "",
    weight: "",
    goal: "",
    fitnessLevel: "",
  },
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    notifications: [
      { id: "workout-reminders", enabled: true },
      { id: "meal-reminders", enabled: true },
      { id: "achievements", enabled: true },
      { id: "coach-messages", enabled: false },
      { id: "weekly-reports", enabled: true },
    ],
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  },
  privacy: {
    publicProfile: false,
    shareData: false,
    analytics: true,
    twoFactorEnabled: false,
  },
  appearance: {
    theme: "dark",
    accentColor: "lime",
    fontSize: "medium",
    reducedMotion: false,
    compactMode: false,
  },
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Accent color CSS variable mappings
const accentColorMap: Record<AccentColor, { primary: string; primaryFg: string }> = {
  lime: { primary: "oklch(0.85 0.2 130)", primaryFg: "oklch(0.1 0.02 130)" },
  cyan: { primary: "oklch(0.78 0.15 200)", primaryFg: "oklch(0.1 0.02 200)" },
  orange: { primary: "oklch(0.75 0.18 50)", primaryFg: "oklch(0.1 0.02 50)" },
  pink: { primary: "oklch(0.72 0.2 350)", primaryFg: "oklch(0.1 0.02 350)" },
  violet: { primary: "oklch(0.7 0.2 290)", primaryFg: "oklch(0.98 0 0)" },
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  // Load appearance settings from localStorage on mount.
  // Profile data is fetched directly by each component (account-section, sidebar, etc.)
  useEffect(() => {
    let active = true
    const stored = localStorage.getItem("arno-settings")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<Settings>
        if (active) setSettings(deepMerge(defaultSettings, parsed))
      } catch { /* ignore malformed JSON */ }
    }
    if (active) setMounted(true)
    return () => { active = false }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("arno-settings", JSON.stringify(settings))
    }
  }, [settings, mounted])

  // Apply theme and appearance
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const { theme, accentColor, fontSize, reducedMotion, compactMode } = settings.appearance

    let isDark = theme === "dark"
    if (theme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    if (isDark) {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.remove("dark")
      root.classList.add("light")
    }

    const colors = accentColorMap[accentColor]
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--primary-foreground", colors.primaryFg)
    root.style.setProperty("--accent", colors.primary)
    root.style.setProperty("--accent-foreground", colors.primaryFg)
    root.style.setProperty("--ring", colors.primary)
    root.style.setProperty("--sidebar-primary", colors.primary)
    root.style.setProperty("--sidebar-primary-foreground", colors.primaryFg)
    root.style.setProperty("--sidebar-ring", colors.primary)
    root.style.setProperty("--chart-1", colors.primary)

    const fontSizeMap = { small: "14px", medium: "16px", large: "18px" }
    root.style.setProperty("--base-font-size", fontSizeMap[fontSize])
    root.style.fontSize = fontSizeMap[fontSize]

    if (reducedMotion) root.classList.add("reduce-motion")
    else root.classList.remove("reduce-motion")

    if (compactMode) root.classList.add("compact")
    else root.classList.remove("compact")

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) { root.classList.add("dark"); root.classList.remove("light") }
        else { root.classList.remove("dark"); root.classList.add("light") }
      }
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [settings.appearance, mounted])

  const updateProfile = (profile: Partial<UserProfile>) => {
    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, ...profile } }))
  }

  const updateNotifications = (notifications: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, ...notifications } }))
  }

  const updatePrivacy = (privacy: Partial<PrivacySettings>) => {
    setSettings((prev) => ({ ...prev, privacy: { ...prev.privacy, ...privacy } }))
  }

  const updateAppearance = (appearance: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({ ...prev, appearance: { ...prev.appearance, ...appearance } }))
  }

  const toggleNotification = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        notifications: prev.notifications.notifications.map((n) =>
          n.id === id ? { ...n, enabled: !n.enabled } : n
        ),
      },
    }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem("arno-settings")
  }

  return (
    <SettingsContext.Provider value={{ settings, updateProfile, updateNotifications, updatePrivacy, updateAppearance, toggleNotification, resetSettings }}>
      {!mounted ? (
        <div style={{ visibility: "hidden" }} aria-hidden>{children}</div>
      ) : (
        children
      )}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
