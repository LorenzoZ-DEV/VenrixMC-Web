import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { Badge, statusTone } from "@/components/ui/Badge";
import { IconBug, PixelFrame } from "@/components/icons";

const MOCK_APPLICATIONS = [
  { id: "mock-1", minecraftName: "Steve_Test", discord: "steve#0001", roles: "Helper", status: "PENDING" },
  { id: "mock-2", minecraftName: "Alex_Test", discord: "alex#0002", roles: "Moderator", status: "APPROVED" },
];

const MOCK_USERS = [
  { id: "mock-u1", username: "mod_demo", email: "mod@demo.venrixmc.uk", role: "STAFF", active: true },
  { id: "mock-u2", username: "head_demo", email: "head@demo.venrixmc.uk", role: "HEAD", active: true },
];

const MOCK_STATS = { users: 12, news: 8, appealsPending: 3, appliesPending: 2 };

export default async function DebugPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canSeeAdmin = hasRole(session, "DEVELOPER");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PixelFrame className="h-11 w-11 text-amber-300">
            <IconBug className="h-5 w-5" />
          </PixelFrame>
          <div>
            <h1 className="font-display text-lg text-white">Debug Mode</h1>
            <p className="mt-2 text-sm text-slate-400">
              Anteprima con dati mock delle sezioni riservate a ruoli superiori.
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="venrix-btn-secondary">
          Dashboard
        </Link>
      </div>

      <section className="venrix-card p-6">
        <h2 className="mb-4 font-display text-xs text-white">Anteprima Head Staff — Candidature</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Giocatore</th>
              <th className="px-4 py-3">Discord</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_APPLICATIONS.map((app) => (
              <tr key={app.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-white">{app.minecraftName}</td>
                <td className="px-4 py-3 text-slate-400">{app.discord}</td>
                <td className="px-4 py-3 text-slate-400">{app.roles}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(app.status)}>{app.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {canSeeAdmin && (
        <>
          <section className="venrix-card mt-6 p-6">
            <h2 className="mb-4 font-display text-xs text-white">Anteprima Admin — Statistiche</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(MOCK_STATS).map(([key, value]) => (
                <div key={key} className="pixel-corners-sm border-2 border-black/30 bg-ink-800 p-4 text-center">
                  <p className="font-display text-lg text-white">{value}</p>
                  <p className="mt-2 text-xs uppercase text-slate-500">{key}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="venrix-card mt-6 p-6">
            <h2 className="mb-4 font-display text-xs text-white">Anteprima Admin — Utenti</h2>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Ruolo</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white">{u.username}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone="role">{u.role}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {!canSeeAdmin && (
        <p className="mt-6 text-sm text-slate-500">
          Effettua il login come Developer per vedere anche l'anteprima delle sezioni Admin.
        </p>
      )}
    </div>
  );
}
