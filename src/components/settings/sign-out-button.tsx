"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/v0-ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Redirect to /account (login page) after sign-out, not to "/" which
    // would be picked up by the root page and loop back to /account anyway.
    router.push("/account");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => void signOut()}
    >
      <LogOut className="h-5 w-5" />
      Log out
    </Button>
  );
}
