import type { Metadata } from "next";
import { StaffSkin } from "@/components/StaffSkin";
import { ROLE_ORDER, ROLE_META } from "@/lib/team";
import { getStaffMembers } from "@/lib/staffMembers";

export const metadata: Metadata = { title: "Staff · VenrixMC" };

// La lista arriva dal database (con cache Redis davanti): renderizzarla al
// build congelerebbe la formazione al momento del deploy.
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const members = await getStaffMembers();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-venrix-radial" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <span className="section-eyebrow">Il team</span>
          <h1 className="section-title">Staff</h1>
          <p className="section-lead">
            Le persone che gestiscono e fanno crescere VenrixMC ogni giorno.
          </p>
        </header>

        {members.length === 0 ? (
          <p className="mt-12 text-slate-400">
            La lista dello staff non è ancora stata pubblicata.
          </p>
        ) : (
          <div className="mt-14 space-y-16">
            {ROLE_ORDER.map((role) => {
              const group = members.filter((m) => m.role === role);
              if (group.length === 0) return null;
              const meta = ROLE_META[role];
              const Icon = meta.icon;

              return (
                <section key={role}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${meta.badgeClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                    <p className="text-sm text-slate-500">{meta.tagline}</p>
                    <div className="h-px min-w-8 flex-1 bg-white/10" />
                  </div>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((member) => (
                      <article
                        key={member.id}
                        className="venrix-card group flex flex-col items-center overflow-hidden px-6 pb-7 pt-8 text-center duration-300 hover:-translate-y-1"
                      >
                        <div className={`absolute inset-x-0 top-0 h-1 ${meta.barClass}`} />
                        <div
                          className="pointer-events-none absolute -top-8 h-32 w-32 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100"
                          style={{ backgroundImage: meta.glow }}
                        />

                        <div className="relative">
                          <StaffSkin username={member.username} />
                        </div>

                        <p className="mt-4 font-display text-lg font-bold text-white">
                          {member.username}
                        </p>

                        <span
                          className={`mt-3 inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${meta.badgeClass}`}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>

                        <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
                          {member.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
