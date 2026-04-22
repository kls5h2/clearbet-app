/**
 * Supabase browser client — use in Client Components that need to know who
 * the user is or sign them in/out. The client picks up the session cookie
 * set by the server/middleware.
 *
 * Note: the plain `lib/supabase.ts` export still exists for anonymous
 * reads (slate queries, etc.) and doesn't depend on auth cookies.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
