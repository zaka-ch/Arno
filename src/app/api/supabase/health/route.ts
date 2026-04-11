import { NextResponse } from "next/server";

import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase hosted: PostgREST can return 401 when using a publishable key as
 * Bearer JWT. Auth's public settings endpoint accepts apikey only and returns 200.
 */
export async function GET() {
  try {
    const base = getSupabaseUrl().replace(/\/$/, "");
    const key = getSupabasePublicKey();

    const res = await fetch(`${base}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        status: res.status,
        message: "Supabase is reachable (Auth API OK).",
      });
    }

    const hint = `Auth API returned ${res.status}. Check URL and key in .env.local.`;
    return NextResponse.json({
      ok: false,
      status: res.status,
      message: hint,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json(
      { ok: false, status: 0, message },
      { status: 502 },
    );
  }
}
