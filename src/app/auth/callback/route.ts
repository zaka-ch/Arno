import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/account?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/account?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Ensure a profile row exists (covers Google OAuth first-time sign-ins).
    // The ProfileCompletionModal on /chat will detect and handle incomplete profiles.
    await supabase.from("profiles").upsert(
      { id: user.id, full_name: user.user_metadata?.full_name ?? null },
      { onConflict: "id", ignoreDuplicates: true }
    );

    // Always go to /chat — the modal handles incomplete profile data.
    return NextResponse.redirect(`${origin}/chat`);
  }

  return NextResponse.redirect(`${origin}/account?error=no_user`);
}