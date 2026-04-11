"use client";

import * as React from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={200}>{children}</TooltipProvider>
  );
}
