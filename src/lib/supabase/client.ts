import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

// Singleton: only ONE browser client instance exists per page load.
// Multiple instances fight over the same localStorage auth-token lock,
// causing the "lock was released because another request stole it" error.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient(getSupabaseUrl(), getSupabasePublicKey());
  }
  return client;
}
