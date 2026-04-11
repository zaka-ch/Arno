import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout for all protected routes: /chat, /onboarding, /settings.
 * /account is now OUTSIDE this route group so it never hits this layout.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  // Onboarding gate: only redirect NEW users who haven't completed onboarding.
  // "New" is defined as: account was created within the last 2 hours.
  // Existing users (older accounts) are NEVER redirected — they go straight to /chat.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isOnOnboarding = pathname.startsWith("/onboarding");

  if (!isOnOnboarding) {
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const isNewUser = Date.now() - createdAt < 2 * 60 * 60 * 1000; // 2 hours

    if (isNewUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!profile?.full_name) {
        redirect("/onboarding");
      }
    }
  }

  return <>{children}</>;
}