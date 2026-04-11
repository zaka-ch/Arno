"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Palette, Dumbbell, ChevronRight } from "lucide-react";
import { AccountSection } from "@/components/settings/account-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { Button } from "@/v0-ui/button";
import { cn } from "@/lib/utils";

// Cannot export metadata from a Client Component in Next.js.
// Since settings uses useState, it must be 'use client'.
// Page title is managed by next.js, but since it's a client layout, we can wrap it or build metadata elsewhere.
// Actually, layout.tsx sets the title. For now I must comply with TS.

const settingsSections = [
  { id: "account", label: "Account", icon: User, description: "Profile & body metrics" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme & display" },
] as const;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");
  const [showMobileContent, setShowMobileContent] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "account": return <AccountSection />;
      case "appearance": return <AppearanceSection />;
      default: return <AccountSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 300 300" className="drop-shadow-sm">
              <rect width="300" height="300" rx="67" fill="white"/>
              <path d="M150 75 L210 225 L188 225 L176 190 L124 190 L112 225 L90 225 Z" fill="#0f0f0f"/>
            </svg>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl">
        <div className="flex min-h-[calc(100vh-57px)]">
          <aside className={cn("w-full border-r border-border bg-card/30 p-4 md:w-72 lg:w-80", showMobileContent && "hidden md:block")}>
            <nav className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => { setActiveSection(section.id); setShowMobileContent(true); }}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl p-3 transition-all",
                    activeSection === section.id
                      ? "border border-primary/30 bg-primary/10"
                      : "border border-transparent hover:bg-card",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      activeSection === section.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className={cn("text-sm font-medium", activeSection === section.id ? "text-primary" : "text-foreground")}>
                        {section.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{section.description}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground md:hidden" />
                </button>
              ))}
            </nav>
            <div className="mt-6 border-t border-border pt-6">
              <SignOutButton />
            </div>
          </aside>

          <main className={cn("flex-1 p-4 md:p-6 lg:p-8", !showMobileContent && "hidden md:block")}>
            <div className="mb-4 md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setShowMobileContent(false)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </div>
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}
