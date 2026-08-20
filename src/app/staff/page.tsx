import type { Metadata } from "next";
import { PlayerSkinViewer } from "@/components/PlayerSkinViewer";
import { MinecraftCube } from "@/components/icons";
import { ROLE_ORDER, ROLE_META, STAFF_TEAM } from "@/lib/team";

export const metadata: Metadata = { title: "Staff — VenrixMC" };

export default function StaffPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-venrix-radial opacity-60" />
      <MinecraftCube className="pointer-events-none absolute left-[6%] top-24 h-10 w-10 text-venrix-500/20 sm:h-14 sm:w-14" />
      <MinecraftCube className="pointer-events-none absolute right-[8%] top-52 h-7 w-7 text-venrix-400/20 sm:h-9 sm:w-9" />
      <MinecraftCube className="pointer-events-none absolute left-[12%] bottom-10 h-8 w-8 text-venrix-600/15 sm:h-11 sm:w-11" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-display text-xl text-white sm:text-2xl">Staff</h1>
        <p className="mt-2 text-slate-400">Il team che gestisce e fa crescere VenrixMC ogni giorno.</p>

        <div className="mt-12 space-y-16">
          {ROLE_ORDER.map((role) => {
            const members = STAFF_TEAM.filter((m) => m.role === role);
            if (members.length === 0) return null;
            const meta = ROLE_META[role];
            const Icon = meta.icon;

            return (
              <section key={role}>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`pixel-corners-sm flex items-center gap-1.5 border-2 px-2.5 py-1 font-display text-[10px] uppercase tracking-wide ${meta.badgeClass}`}
                    style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.4)" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {role}
                  </span>
                  <p className="text-xs text-slate-500">{meta.tagline}</p>
                  <div className="h-px min-w-8 flex-1 bg-white/10" />
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <div
                      key={member.username}
                      className="venrix-card group relative flex flex-col items-center overflow-hidden px-6 pb-8 pt-6 text-center transition duration-300 hover:-translate-y-1.5"
                    >
                      <div className={`absolute inset-x-0 top-0 h-1.5 ${meta.barClass}`} />
                      <div
                        className="pointer-events-none absolute -top-10 h-44 w-44 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100"
                        style={{ backgroundImage: meta.glow }}
                      />

                      <div className="relative">
                        <PlayerSkinViewer username={member.username} width={140} height={175} />
                      </div>

                      <p className="mt-2 font-display text-sm text-white">{member.username}</p>

                      <span
                        className={`pixel-corners-sm mt-3 inline-flex items-center gap-1 border-2 px-2 py-0.5 font-display text-[8px] uppercase tracking-wide ${meta.badgeClass}`}
                      >
                        <Icon className="h-3 w-3" />
                        {role}
                      </span>

                      <p className="mt-4 text-sm leading-relaxed text-slate-300">
                        {member.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
