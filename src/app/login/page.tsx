import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage() {
  // Real session check (Redis-backed), unlike the middleware's cookie-only
  // gate — this is what safely redirects an already-authenticated user
  // away from /login without risking a redirect loop on a stale cookie.
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
