"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquarePlus, X, MessagesSquare, ChevronRight,
  Trophy, ChevronDown, ChevronUp, Settings, LogOut,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/v0-ui/button";
import { createClient } from "@/lib/supabase/client";
import { getPersonalRecords, type PersonalRecord } from "@/app/actions/personal-records";


// ─── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  title: string;
  firstCreatedAt: string;
  latestTs: number;
  dateGroup: DateGroup;
}

interface UserInfo {
  full_name: string | null;
  email: string | null;
  initials: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SessionSkeleton() {
  return (
    <div className="space-y-1 px-1">
      {[80, 65, 72, 55, 68].map((w, i) => (
        <div key={i} className="rounded-lg px-3 py-2.5 space-y-1.5">
          <div
            className="h-2.5 rounded-full bg-sidebar-accent/60 animate-pulse"
            style={{ width: `${w}%` }}
          />
          <div className="h-2 rounded-full bg-sidebar-accent/40 animate-pulse w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

type DateGroup = "Today" | "Yesterday" | "This Week" | "Older";

function getDateGroup(ts: number): DateGroup {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ts) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Older";
}

function relativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string | null, email: string | null): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ChatSidebar({
  isOpen,
  onToggle,
  onNewChat,
  activeConversationId,
  onSelectConversation,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [prsOpen, setPrsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // ── Fetch user info ────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      if (!user) return;
      const email = user.email ?? null;
      // Also fetch full_name from profiles
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }: { data: { full_name: string | null } | null }) => {
          const name = profile?.full_name ?? null;
          setUserInfo({
            full_name: name,
            email,
            initials: getInitials(name, email),
          });
        });
    });
  }, []);

  // ── Fetch conversation list ────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingSessions(false);
      return;
    }

    // Fetch ALL messages for the user, oldest first, so we can group by conversation_id
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, conversation_id, content, created_at, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Sidebar] fetchSessions error:", error.message);
      setLoadingSessions(false);
      return;
    }

    if (data && data.length > 0) {
      // Group by conversation_id (fallback to row id for messages without one)
      const map = new Map<string, { firstContent: string; firstCreatedAt: string; latestTs: number }>();
      for (const row of data) {
        const key: string = (row.conversation_id as string | null) ?? (row.id as string);
        const ts = new Date(row.created_at as string).getTime();
        if (!map.has(key)) {
          // First row for this key = oldest = conversation title
          map.set(key, {
            firstContent: row.content as string,
            firstCreatedAt: row.created_at as string,
            latestTs: ts,
          });
        } else {
          map.get(key)!.latestTs = ts;
        }
      }

      const built: Session[] = [];
      for (const [cid, info] of map) {
        const latestTs = info.latestTs;
        built.push({
          id: cid,
          title: info.firstContent.length > 40
            ? info.firstContent.slice(0, 40) + "\u2026"
            : info.firstContent,
          firstCreatedAt: info.firstCreatedAt,
          latestTs,
          dateGroup: getDateGroup(latestTs),
        });
      }

      setSessions(built.sort((a, b) => b.latestTs - a.latestTs).slice(0, 30));
    } else {
      setSessions([]);
    }

    setLoadingSessions(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Fetch PRs (lazy — only when section is opened) ────────────────────────
  const fetchPrs = useCallback(async () => {
    try {
      const data = await getPersonalRecords();
      setPrs(data);
    } catch {
      setPrs([]);
    }
  }, []);

  useEffect(() => {
    if (prsOpen) fetchPrs();
  }, [prsOpen, fetchPrs]);

  // ── Realtime refresh ──────────────────────────────────────────────────────
  // BUG 1 FIX: use a closure variable so the useEffect cleanup can call
  // supabase.removeChannel(). The previous pattern returned the cleanup from
  // inside .then() — that return value is ignored by React.
  useEffect(() => {
    const supabase = createClient();
    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
        if (!user || !mounted) return;
        channelRef = supabase
          .channel("sidebar_realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
            () => fetchSessions()
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "personal_records", filter: `user_id=eq.${user.id}` },
            () => { if (prsOpen) fetchPrs(); }
          )
          .subscribe();
      });

    return () => {
      mounted = false;
      if (channelRef) {
        supabase.removeChannel(channelRef);
        channelRef = null;
      }
    };
  }, [fetchSessions, fetchPrs, prsOpen]);

  // ── Sign out ──────────────────────────────────────────────────────────────
  // BUG 3 FIX: use window.location.href for a full page reload so the browser
  // re-fetches /account with cleared session cookies. router.push() is
  // insufficient because Next.js client-side navigation can keep stale state.
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/account";
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-border bg-sidebar transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 300 300">
              <rect width="300" height="300" rx="67" fill="white"/>
              <path d="M150 75 L210 225 L188 225 L176 190 L124 190 L112 225 L90 225 Z" fill="#0f0f0f"/>
            </svg>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── New Chat button ─────────────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onNewChat}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* ── Conversation list (scrollable) ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {loadingSessions ? (
            <SessionSkeleton />
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessagesSquare className="h-7 w-7 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                No conversations yet.
                <br />
                Start chatting to begin!
              </p>
            </div>
          ) : (
            (() => {
              const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "This Week", "Older"];
              const grouped = new Map<DateGroup, Session[]>();
              for (const g of GROUP_ORDER) grouped.set(g, []);
              for (const s of sessions) grouped.get(s.dateGroup)!.push(s);

              return GROUP_ORDER.filter((g) => grouped.get(g)!.length > 0).map((group) => (
                <div key={group} className="mb-2">
                  <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group}
                  </p>
                  {grouped.get(group)!.map((session) => {
                    const isActive = session.id === activeConversationId;
                    return (
                      <button
                        key={session.id}
                        onClick={() => onSelectConversation(session.id)}
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-2 transition-all duration-150 group",
                          "hover:bg-sidebar-accent",
                          isActive
                            ? "bg-sidebar-accent border border-primary/25"
                            : "border border-transparent"
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-medium leading-snug line-clamp-2",
                            isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
                          )}
                        >
                          {session.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>

        {/* ── Personal Records (collapsible) ────────────────────────────── */}
        <div className="border-t border-sidebar-border px-3 py-2">
          <button
            className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground transition-colors"
            onClick={() => setPrsOpen(!prsOpen)}
          >
            <span className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              My PRs
            </span>
            {prsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {prsOpen && (
            <div className="mt-1 space-y-0.5 pb-1 max-h-40 overflow-y-auto">
              {prs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No PRs yet. Tell ARNO about a lift!
                </p>
              ) : (
                prs.map((pr) => (
                  <div
                    key={pr.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-sidebar-accent"
                  >
                    <span className="text-xs font-medium text-sidebar-foreground capitalize truncate max-w-[130px]">
                      {pr.exercise}
                    </span>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-primary">{pr.weight_kg} kg</span>
                      {pr.reps && (
                        <span className="text-[10px] text-muted-foreground ml-1">×{pr.reps}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── User card (fixed bottom) ───────────────────────────────────── */}
        <div className="border-t border-sidebar-border p-3">
          {userInfo ? (
            <div className="flex items-center gap-3">
              {/* Avatar / initials */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {userInfo.initials}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {userInfo.full_name ?? "User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {userInfo.email ?? ""}
                </p>
              </div>

              {/* Settings button */}
              <Link href="/settings" title="Settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>

              {/* Sign out button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                title="Sign out"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* Loading skeleton for user card */
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sidebar-accent/60 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 rounded-full bg-sidebar-accent/60 animate-pulse" />
                <div className="h-2 w-32 rounded-full bg-sidebar-accent/40 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
