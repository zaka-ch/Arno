"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, WifiOff } from "lucide-react";

import type { HealthPayload } from "@/types";

export function ConnectionStatus() {
  const [state, setState] = useState<
    "loading" | { ok: true; message: string } | { ok: false; message: string }
  >("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/supabase/health");
        const data = (await res.json()) as HealthPayload;
        if (!cancelled) {
          setState(
            data.ok
              ? { ok: true, message: data.message }
              : { ok: false, message: data.message },
          );
        }
      } catch {
        if (!cancelled) {
          setState({ ok: false, message: "Could not reach health check." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Checking Supabase…
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-foreground">
        <CheckCircle2 className="size-4 shrink-0 text-primary" />
        <span>{state.message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <WifiOff className="size-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}
