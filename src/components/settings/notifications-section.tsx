"use client"

import { Bell, Dumbbell, Utensils, Trophy, MessageSquare, Mail, Smartphone } from "lucide-react"
import { Switch } from "@/v0-ui/switch"
import { Label } from "@/v0-ui/label"
import { useSettings } from "@/lib/settings-context"
import { cn } from "@/lib/utils"

const notificationMeta: Record<string, { label: string; description: string; icon: typeof Bell }> = {
  "workout-reminders": {
    label: "Workout Reminders",
    description: "Get reminded when it's time to train",
    icon: Dumbbell,
  },
  "meal-reminders": {
    label: "Meal Reminders",
    description: "Never miss a meal with timely notifications",
    icon: Utensils,
  },
  "achievements": {
    label: "Achievements & Milestones",
    description: "Celebrate your fitness achievements",
    icon: Trophy,
  },
  "coach-messages": {
    label: "Coach Messages",
    description: "Tips and advice from Arno",
    icon: MessageSquare,
  },
  "weekly-reports": {
    label: "Weekly Reports",
    description: "Summary of your weekly progress",
    icon: Bell,
  },
}

export function NotificationsSection() {
  const { settings, updateNotifications, toggleNotification } = useSettings()
  const { pushEnabled, emailEnabled, notifications, quietHoursStart, quietHoursEnd } = settings.notifications

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground text-sm mt-1">Control how and when you receive updates</p>
      </div>

      {/* Notification Channels */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-foreground font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive notifications on your device</p>
              </div>
            </div>
            <Switch 
              checked={pushEnabled} 
              onCheckedChange={(checked) => updateNotifications({ pushEnabled: checked })} 
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-foreground font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch 
              checked={emailEnabled} 
              onCheckedChange={(checked) => updateNotifications({ emailEnabled: checked })} 
            />
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
        <div className="space-y-3">
          {notifications.map((notification) => {
            const meta = notificationMeta[notification.id]
            if (!meta) return null
            const Icon = meta.icon
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl transition-colors",
                  notification.enabled ? "bg-primary/5" : "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    notification.enabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className={cn(
                      "font-medium",
                      notification.enabled ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {meta.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                <Switch
                  checked={notification.enabled}
                  onCheckedChange={() => toggleNotification(notification.id)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-2">Quiet Hours</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Pause notifications during specific hours to avoid interruptions
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
            <input
              type="time"
              value={quietHoursStart}
              onChange={(e) => updateNotifications({ quietHoursStart: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
            <input
              type="time"
              value={quietHoursEnd}
              onChange={(e) => updateNotifications({ quietHoursEnd: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
