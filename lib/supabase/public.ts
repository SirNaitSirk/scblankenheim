import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Anon (public) Supabase client — safe on the client or server. For public reads
 * only (landing page: current camp, form fields, non-hidden price tiers). RLS
 * restricts what this client can see; hidden price tiers are never returned here.
 *
 * Only NEXT_PUBLIC_* env vars are used, so this is safe to bundle for the browser.
 */
let client: SupabaseClient<Database> | null = null;

export function getPublicClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
    );
  }

  client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
