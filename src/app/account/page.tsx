import { SignInSection } from "@/components/account/sign-in-section";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Arno — Sign In",
  description: "Sign in to ARNO, your AI fitness coach.",
};

/**
 * Public /account page — NOT inside the (app) route group, so the (app)
 * layout's auth checks never run here. Middleware already redirects
 * authenticated users to /chat before this page is rendered.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double-safety: if somehow an authenticated user lands here, send to /chat
  if (user) redirect("/chat");

  return <SignInSection />;
}
