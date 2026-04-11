import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

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
    // Upsert a profile row for this user (covers Google OAuth first-time sign-ins)
    await supabase.from("profiles").upsert(
      { id: user.id, full_name: user.user_metadata?.full_name ?? null },
      { onConflict: "id", ignoreDuplicates: true }
    );

    // Check whether onboarding is still needed
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const needsOnboarding = !profile?.full_name;
    const redirectTo = needsOnboarding ? "/onboarding" : next;

    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  return NextResponse.redirect(`${origin}/account?error=no_user`);
}