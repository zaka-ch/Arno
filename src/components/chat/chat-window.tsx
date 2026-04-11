"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Menu, PanelRight, LogIn, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/v0-ui/button"
import { ChatSidebar } from "./chat-sidebar"
import { MessageList, Message } from "./message-list"
import { ChatInput, SelectedImage } from "./chat-input"
import { RightPanel } from "./right-panel"
import { MacrosBar } from "./macros-bar"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

export function ChatWindow() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [macrosRefreshKey, setMacrosRefreshKey] = useState(0)

  // Each chat session gets a UUID — stable across the component lifetime
  const [conversationId, setConversationId] = useState<string>(() =>
    crypto.randomUUID()
  )

  const scrollRef = useRef<HTMLDivElement>(null)

  // ─── Auth state ───────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data: { user: u } }: { data: { user: User | null } }) =>
        setUser(u)
      )
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ─── Responsive layout ────────────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
      if (mobile) setRightPanelOpen(false)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // ─── Load a past conversation from Supabase (Bug 3) ──────────────────────
  const loadConversation = useCallback(
    async (convId: string) => {
      if (!user) return
      const supabase = createClient()
      setMessages([])
      setConversationId(convId)

      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("user_id", user.id)
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[ChatWindow] loadConversation error:", error.message)
        toast.error("Failed to load conversation.")
        return
      }

      if (data) {
        setMessages(
          data.map((m: { id: string; role: string; content: string; created_at: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.created_at),
          }))
        )
      }
    },
    [user]
  )

  // ─── New Chat (Bug 3) ─────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    const prevMessages = messages
    const prevId = conversationId
    const newId = crypto.randomUUID()
    setMessages([])
    setConversationId(newId)
    toast("New chat started", {
      description: "Your previous conversation was saved.",
      action: {
        label: "Undo",
        onClick: () => {
          setMessages(prevMessages)
          setConversationId(prevId)
        },
      },
      duration: 5000,
    })
  }, [messages, conversationId])

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (content: string, image?: SelectedImage) => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      imageDataUrl: image?.dataUrl,
    }

    const allMessages = [...messages, userMessage]
    setMessages(allMessages)
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageDataUrl: m.imageDataUrl,
          })),
          conversationId,
        }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          // FIX 2: Show rate-limit message as assistant bubble, keep input enabled
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "\u23F3 **Quota reached** — wait about 1 minute and try again.\n\nYou're on the free tier (15 requests/min). It resets automatically.",
                  }
                : m
            )
          )
          setIsLoading(false)
          return
        }
        // FIX 1: Any other non-2xx — show error bubble, don't crash
        const err = await res.json().catch(() => ({ error: "Unexpected response" }))
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Something went wrong — ${err.error ?? `HTTP ${res.status}`}. Please try again.` }
              : m
          )
        )
        setIsLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        )
      }

      // Stream complete — trigger macro bar refresh in case a meal was logged
      setMacrosRefreshKey((k) => k + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      if (msg !== "handled") {
        // FIX 1: show error in bubble, don't crash UI
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Something went wrong — please try again. " + msg }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        activeConversationId={conversationId}
        onSelectConversation={loadConversation}
      />

      <main
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen && !isMobile ? "lg:ml-72" : "ml-0",
          rightPanelOpen && !isMobile ? "lg:mr-80" : "mr-0"
        )}
      >
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-sm font-medium text-foreground">Chat with Arno</h1>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Link href="/account">
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={cn("h-8 w-8", rightPanelOpen && "text-primary")}
            >
              <PanelRight className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-grid-pattern" ref={scrollRef}>
          <div className="max-w-3xl mx-auto px-4 py-8">
            <MessageList messages={messages} isLoading={isLoading} onSend={handleSend} />
          </div>
        </div>

        <MacrosBar refreshKey={macrosRefreshKey} />
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </main>

      <RightPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
      />

      {/* Auth prompt modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowAuthPrompt(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Sign in to chat with Arno
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a free account so Arno can personalise your coaching
                  based on your weight, goal, and training split.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAuthPrompt(false)}
                >
                  Maybe Later
                </Button>
                <Link href="/account" className="flex-1">
                  <Button className="w-full">Create Account</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
