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

  // If the user has not completed onboarding (no full_name), force them there.
  // Read x-pathname from the request headers (set by updateSession in middleware).
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isOnOnboarding = pathname.startsWith("/onboarding");

  if (!isOnOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.full_name) {
      redirect("/onboarding");
    }
  }

  return <>{children}</>;
}