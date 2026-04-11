import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// These paths are always public -- never redirect, never block.
const PUBLIC_ROUTES = ["/account", "/auth/callback", "/auth/confirm"];

// These paths require authentication -- guests are sent to /account.
const PROTECTED_ROUTES = ["/chat", "/onboarding", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run Supabase session refresh + get current user.
  // updateSession() now injects x-pathname into request headers so that
  // Server Components (e.g. (app)/layout.tsx) can read it via headers().
  const { supabaseResponse, user } = await updateSession(request);

  const isPublic   = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));

  // Guest trying to reach a protected page -> send to /account
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.redirect(url);
  }

  // Authenticated user on /account -> send to /chat (avoid showing login to logged-in users)
  if (user && pathname.startsWith("/account")) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    return NextResponse.redirect(url);
  }

  // All other routes pass through with refreshed session cookies.
  // The supabaseResponse already has x-pathname baked into request headers
  // (done inside updateSession), so no additional header manipulation needed here.
  void isPublic; // acknowledged, no special handling required beyond the above
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};