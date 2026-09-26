import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { isDiscordOAuthConfigured } from "@/lib/discordOAuth";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Dashboard · VenrixMC" };

export default async function LoginPage() {
  // Real session check (Redis-backed), unlike the middleware's cookie-only
  // gate — this is what safely redirects an already-authenticated user
  // away from /login without risking a redirect loop on a stale cookie.
  // I membri vanno dritti alle loro richieste, senza passare dalla panoramica.
  const session = await getSession();
  if (session) redirect(hasRole(session, "STAFF") ? "/dashboard" : "/dashboard/richieste");

  return (
    <Suspense fallback={null}>
      <LoginForm discordConfigured={isDiscordOAuthConfigured()} />
    </Suspense>
  );
}
