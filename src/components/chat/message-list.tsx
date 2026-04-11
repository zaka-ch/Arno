"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Dumbbell, User, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react"
import { Button } from "@/v0-ui/button"
import { toast } from "sonner"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageDataUrl?: string // base64 data URL — shown in user bubbles
}

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  onSend?: (text: string) => void
}

export function MessageList({ messages, isLoading, onSend }: MessageListProps) {
  if (messages.length === 0) {
    return <EmptyState onSend={onSend} />
  }

  return (
    <div className="space-y-6 pb-8">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
        <TypingIndicator />
      )}
    </div>
  )
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function parseInline(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-inline-${i}`
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="px-1 py-0.5 rounded bg-muted font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

function renderMarkdown(rawText: string): React.ReactNode {
  // Clean up any residual structured log tags (in case of partial streaming)
  const text = rawText
    .replace(/\[LOG_MEAL:(\{[^\[\]]+\})\]/g, (_, json) => {
      try {
        const d = JSON.parse(json);
        return `\n\n\u{1F4CA} **Meal logged:** ${d.meal_name} \u2014 ${d.calories} kcal | P: ${d.protein_g ?? 0}g | C: ${d.carbs_g ?? 0}g | F: ${d.fat_g ?? 0}g`;
      } catch { return ""; }
    })
    .replace(/\[LOG_PR:(\{[^\[\]]+\})\]/g, (_, json) => {
      try {
        const d = JSON.parse(json);
        return `\n\n\u{1F3C6} **PR logged:** ${d.exercise} \u2014 ${d.weight_kg} kg${d.reps ? ` \u00D7 ${d.reps} reps` : ""}`;
      } catch { return ""; }
    });

  const lines = text.split("\n");
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const key = `md-${i}`

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key} className="font-bold text-sm mt-3 mb-1 text-foreground">
          {parseInline(line.slice(4), key)}
        </h3>
      )
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key} className="font-bold text-base mt-4 mb-2 text-foreground">
          {parseInline(line.slice(3), key)}
        </h2>
      )
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key} className="font-bold text-lg mt-4 mb-2 text-foreground">
          {parseInline(line.slice(2), key)}
        </h1>
      )
    } else if (/^[-*] /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        const itemKey = `md-${i}-li`
        items.push(
          <li key={itemKey} className="leading-relaxed">
            {parseInline(lines[i].slice(2), itemKey)}
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`ul-${key}`} className="list-disc list-inside space-y-0.5 my-2 pl-1">
          {items}
        </ul>
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const itemKey = `md-${i}-oli`
        items.push(
          <li key={itemKey} className="leading-relaxed">
            {parseInline(lines[i].replace(/^\d+\. /, ""), itemKey)}
          </li>
        )
        i++
      }
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal list-inside space-y-0.5 my-2 pl-1">
          {items}
        </ol>
      )
      continue
    } else if (line.trim().startsWith("|") && line.includes("|")) {
      const tableRows: React.ReactNode[] = []
      let isHeader = true
      let hasHeaderRow = false
      let headerCells: React.ReactNode[] = []
      let bodyRows: React.ReactNode[] = []
      
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const rowLine = lines[i].trim()
        const cells = rowLine.split("|").slice(1, -1).map((c) => c.trim())
        
        // Skip separator row like |---|---|
        if (cells.every((c) => c.match(/^[-:\s]+$/))) {
          isHeader = false
          i++
          continue
        }

        const rowKey = `tr-${key}-${i}`
        
        if (isHeader && !hasHeaderRow) {
          headerCells = cells.map((cellText, colIdx) => (
            <th 
              key={`th-${rowKey}-${colIdx}`} 
              className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
            >
              {parseInline(cellText, `th-inline-${rowKey}-${colIdx}`)}
            </th>
          ))
          hasHeaderRow = true
        } else {
          bodyRows.push(
            <tr key={rowKey} className="border-b border-border/50 transition-colors hover:bg-muted/30">
              {cells.map((cellText, colIdx) => (
                <td 
                  key={`td-${rowKey}-${colIdx}`} 
                  className="p-4 align-middle text-foreground"
                >
                  {parseInline(cellText, `td-inline-${rowKey}-${colIdx}`)}
                </td>
              ))}
            </tr>
          )
        }
        i++
      }

      elements.push(
        <div key={`table-wrapper-${key}`} className="my-5 w-full overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              {headerCells.length > 0 && (
                <thead className="[&_tr]:border-b bg-muted/40">
                  <tr className="border-b border-border transition-colors hover:bg-muted/50">
                    {headerCells}
                  </tr>
                </thead>
              )}
              <tbody className="[&_tr:last-child]:border-0">
                {bodyRows}
              </tbody>
            </table>
          </div>
          <div className="bg-primary/5 p-3 flex justify-between items-center border-t border-border/80">
             <span className="text-xs text-muted-foreground px-2 flex items-center gap-1">
               <Dumbbell className="h-3 w-3" /> Workout Plan Detected
             </span>
             <Button variant="secondary" size="sm" className="h-8 shadow-sm" onClick={() => {
                toast.success("Workout saved to your profile!");
                // Here we would call a server action: await saveWorkoutToDatabase(tableRowsData)
             }}>
                Save Workout
             </Button>
          </div>
        </div>
      )
      continue
    } else if (line.trim() === "") {
      elements.push(<div key={key} className="h-1" />)
    } else {
      elements.push(
        <p key={key} className="leading-relaxed">
          {parseInline(line, key)}
        </p>
      )
    }

    i++
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success("Copied to clipboard!")
    } catch {
      toast.error("Couldn't copy — try selecting the text manually.")
    }
  }

  return (
    <div className={cn("flex gap-4", isAssistant ? "items-start" : "items-start justify-end")}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <Dumbbell className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={cn("flex-1 max-w-2xl", !isAssistant && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isAssistant
              ? "bg-card border border-border"
              : "bg-primary/10 border border-primary/20"
          )}
        >
          {/* Image attached to user message */}
          {!isAssistant && message.imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.imageDataUrl}
              alt="attached"
              className="mb-2 max-h-60 rounded-lg object-cover border border-primary/20"
            />
          )}
          {isAssistant ? (
            renderMarkdown(message.content)
          ) : (
            message.content && (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {message.content}
              </p>
            )
          )}
        </div>
        {isAssistant && message.content && (
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <Dumbbell className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const suggestions = [
  { text: "Create a PPL workout split for me",     icon: "\u{1F4AA}" },
  { text: "Calculate my daily macros",             icon: "\u{1F95A}" },
  { text: "Help me track my bench press PR",       icon: "\u{1F4C8}" },
  { text: "Best supplements for muscle recovery?", icon: "\u26A1" },
]

function EmptyState({ onSend }: { onSend?: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8 flex justify-center">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full max-w-[80px]" />
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 300 300" className="relative z-10 drop-shadow-md">
          <rect width="300" height="300" rx="67" fill="white"/>
          <path d="M150 75 L210 225 L188 225 L176 190 L124 190 L112 225 L90 225 Z" fill="#0f0f0f"/>
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-3 text-balance">Welcome to ARNO</h2>
      <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
        Your AI fitness coach. Ask about workouts, nutrition, supplements, or log a meal or PR — available in any language.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.text}
            onClick={() => onSend?.(suggestion.text)}
            className="p-4 text-left text-sm rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all group flex items-start gap-3"
          >
            <span className="text-lg">{suggestion.icon}</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
