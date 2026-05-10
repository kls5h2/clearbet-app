/**
 * Email-confirmation callback — Supabase redirects here after the user clicks
 * the confirmation link sent during sign-up (if email confirmation is enabled).
 * Exchange the code for a session, set the cookie, then forward to wherever
 * the user was headed (?next=…) or /dashboard as default.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth:callback] exchange failed:", error.message);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email && process.env.LOOPS_API_KEY) {
    try {
      await fetch("https://app.loops.so/api/v1/contacts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.user_metadata?.first_name ?? "",
          source: "supabase-signup",
        }),
      });
    } catch (err) {
      console.error("[loops] contact create failed:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
