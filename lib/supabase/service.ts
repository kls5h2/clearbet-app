/**
 * Supabase service-role client — bypasses RLS entirely. Use ONLY in
 * server-side contexts where the request cannot (or should not) be scoped
 * to a user session:
 *   - Stripe webhooks (no session present at all)
 *   - Internal writes to shared/reference tables (breakdowns, opening_lines)
 *     that other users must be able to read
 *
 * Never import this from a Client Component. The service role key must
 * never reach the browser.
 */

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
