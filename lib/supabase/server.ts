import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Service-role Supabase client — privileged, RLS-bypassing. Server-only:
 * `import "server-only"` fails the build if this ever gets pulled into a Client
 * Component. Authorization is enforced by the caller (Clerk session + role check),
 * never by RLS, since auth is Clerk not Supabase Auth.
 *
 * Uses SUPABASE_ROLE_KEY (the project's env name for the service-role key).
 */
let client: SupabaseClient<Database> | null = null;

export function getServiceClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ROLE_KEY are required.",
    );
  }

  client = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
