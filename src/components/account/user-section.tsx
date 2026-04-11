"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type UserSectionProps = {
  email: string | undefined;
  userId: string;
};

export function UserSection({ email, userId }: UserSectionProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-5">
      <h2 className="text-sm font-medium">Signed in</h2>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">User ID</dt>
          <dd className="font-mono text-xs text-muted-foreground">{userId}</dd>
        </div>
      </dl>
      <Button type="button" variant="outline" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}
