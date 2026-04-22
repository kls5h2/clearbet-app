/**
 * Auth middleware — refreshes the Supabase session cookie and gates
 * non-public routes. When an unauthenticated user hits a protected route
 * they're redirected to /login?next=<original-path>.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes (and prefixes) that do NOT require a session.
const PUBLIC_PREFIXES = [
  "/login",
  "/pricing",
  "/terms",
  "/privacy",
  "/tools/line-translator",
  "/learn",
  "/auth/callback",
  "/api/line-translator",
  "/api/stripe/webhook",
];
const PUBLIC_EXACT = new Set(["/"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session cookie on every request — critical for server-side auth.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, search } = req.nextUrl;

  if (isPublic(pathname)) return res;

  if (!user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  // Skip static assets, image optimizer, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico)$).*)"],
};
