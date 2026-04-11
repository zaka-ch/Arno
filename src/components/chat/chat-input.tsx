"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic, Paperclip, Sparkles, Utensils, TrendingUp, Zap, X, ImageIcon } from "lucide-react"
import { Button } from "@/v0-ui/button"
import { cn } from "@/lib/utils"

export interface SelectedImage {
  dataUrl: string
  name: string
}

interface ChatInputProps {
  onSend: (message: string, image?: SelectedImage) => void
  isLoading?: boolean
}

const quickActions = [
  { icon: Sparkles,   label: "Generate Workout", prompt: "Create a personalized workout plan for me based on my goal and fitness level." },
  { icon: Utensils,   label: "Log Meal",          prompt: "Help me calculate the macros for my meal." },
  { icon: TrendingUp, label: "Track PR",           prompt: "I want to log a new personal record, help me track it!" },
  { icon: Zap,        label: "Recovery Tips",      prompt: "Give me your best recovery tips after an intense training session." },
]

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if ((!input.trim() && !selectedImage) || isLoading) return
    onSend(input.trim(), selectedImage ?? undefined)
    setInput("")
    setSelectedImage(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setSelectedImage({ dataUrl: ev.target?.result as string, name: file.name })
    }
    reader.readAsDataURL(file)
    // reset so the same file can be re-selected
    e.target.value = ""
  }

  const canSend = (input.trim() || selectedImage) && !isLoading

  return (
    <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground whitespace-nowrap transition-colors"
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-2 flex items-start gap-2">
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.dataUrl}
                alt={selectedImage.name}
                className="h-20 w-20 rounded-lg object-cover border border-border"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ImageIcon className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{selectedImage.name}</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/50 transition-colors">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "h-9 w-9 shrink-0 hover:text-foreground transition-colors",
              selectedImage ? "text-primary" : "text-muted-foreground"
            )}
            title="Attach image"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? "Ask Arno about this image…" : "Ask Arno anything about fitness..."}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[200px] py-2"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSend}
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0 rounded-xl transition-all",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Arno can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}
