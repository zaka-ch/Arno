import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import { AppProviders } from "@/components/shared/app-providers";
import { SettingsProvider } from "@/lib/settings-context";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arno — AI Fitness Coach",
  description: "Your AI-powered fitness coach for workouts, nutrition, and progress tracking.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' rx='67' fill='white'/><path d='M150 75 L210 225 L188 225 L176 190 L124 190 L112 225 L90 225 Z' fill='%230f0f0f'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <SettingsProvider>
          <AppProviders>{children}</AppProviders>
        </SettingsProvider>
        <Toaster richColors position="bottom-center" />
        <Analytics />
      </body>
    </html>
  );
}
