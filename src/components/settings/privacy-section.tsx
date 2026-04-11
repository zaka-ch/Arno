"use client"

import { useState } from "react"
import { Shield, Eye, Lock, Key, Download, Trash2 } from "lucide-react"
import { Button } from "@/v0-ui/button"
import { Switch } from "@/v0-ui/switch"
import { Label } from "@/v0-ui/label"
import { Input } from "@/v0-ui/input"
import { useSettings } from "@/lib/settings-context"

export function PrivacySection() {
  const { settings, updatePrivacy } = useSettings()
  const { twoFactorEnabled, publicProfile, shareData, analytics } = settings.privacy
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handlePasswordUpdate = () => {
    setPasswordError("")
    setPasswordSuccess(false)
    
    if (passwordForm.new.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("Passwords do not match")
      return
    }
    
    // Simulate password update
    setPasswordSuccess(true)
    setPasswordForm({ current: "", new: "", confirm: "" })
    setTimeout(() => {
      setShowChangePassword(false)
      setPasswordSuccess(false)
    }, 2000)
  }

  const handleExportData = () => {
    const data = JSON.stringify(settings, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "arno-data-export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold">Privacy & Security</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your security settings and data preferences</p>
      </div>

      {/* Password & Security */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Password & Security</h3>
            <p className="text-xs text-muted-foreground">Manage your password and authentication</p>
          </div>
        </div>

        <div className="space-y-4">
          {!showChangePassword ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <Label className="text-foreground font-medium">Password</Label>
                <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowChangePassword(true)}>
                Change Password
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/50 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  placeholder="Enter current password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="Enter new password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Confirm new password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-primary">Password updated successfully!</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handlePasswordUpdate}>
                  Update Password
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-foreground font-medium">Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <Switch 
              checked={twoFactorEnabled} 
              onCheckedChange={(checked) => updatePrivacy({ twoFactorEnabled: checked })} 
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Privacy Settings</h3>
            <p className="text-xs text-muted-foreground">Control who can see your information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <Label className="text-foreground font-medium">Public Profile</Label>
              <p className="text-xs text-muted-foreground">Allow others to view your profile and achievements</p>
            </div>
            <Switch 
              checked={publicProfile} 
              onCheckedChange={(checked) => updatePrivacy({ publicProfile: checked })} 
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <Label className="text-foreground font-medium">Data Sharing</Label>
              <p className="text-xs text-muted-foreground">Share anonymous data to improve Arno</p>
            </div>
            <Switch 
              checked={shareData} 
              onCheckedChange={(checked) => updatePrivacy({ shareData: checked })} 
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <Label className="text-foreground font-medium">Analytics</Label>
              <p className="text-xs text-muted-foreground">Help us understand how you use the app</p>
            </div>
            <Switch 
              checked={analytics} 
              onCheckedChange={(checked) => updatePrivacy({ analytics: checked })} 
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Data Management</h3>
            <p className="text-xs text-muted-foreground">Export or delete your personal data</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-foreground font-medium">Export Data</Label>
                <p className="text-xs text-muted-foreground">Download all your data in JSON format</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div>
                <Label className="text-foreground font-medium">Delete All Data</Label>
                <p className="text-xs text-muted-foreground">Permanently remove all your fitness data</p>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div>
                <Label className="text-foreground font-medium">Current Device</Label>
                <p className="text-xs text-muted-foreground">Chrome on macOS - Active now</p>
              </div>
            </div>
            <span className="text-xs text-primary font-medium">This device</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <div>
                <Label className="text-foreground font-medium">iPhone 15 Pro</Label>
                <p className="text-xs text-muted-foreground">Safari - Last active 2 hours ago</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Revoke
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
