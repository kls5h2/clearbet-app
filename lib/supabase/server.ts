/**
 * Supabase server client — reads/writes the session cookie via next/headers.
 * Use this in Route Handlers, Server Components, Server Actions, and any
 * server-side context where you need to know WHO the user is.
 *
 * For anonymous public reads that don't need auth, keep using the plain
 * `lib/supabase.ts` export. For browser client-component auth, use
 * `lib/supabase/client.ts`. For middleware, build the client inline with
 * NextResponse cookies.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set here.
            // The middleware session refresh handles cookie updates instead.
          }
        },
      },
    }
  );
}
