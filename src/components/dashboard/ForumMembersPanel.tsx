"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MemberAvatar } from "@/components/forum/MemberAvatar";
import { RankBadge } from "@/components/forum/RankBadge";
import type { StaffRole } from "@prisma/client";

type Member = {
  id: string;
  username: string;
  role: string;
  discordRank: StaffRole | null;
  active: boolean;
  forumMuted: boolean;
  postCount: number;
  minecraftName: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  createdAt: string;
  lastSeenAt: string | null;
};

/**
 * Moderazione dei membri: silenziamento sul forum e disattivazione
 * dell'account. Il cambio di ruolo resta in "Utenti", che e riservato agli
 * ADMIN — qui arriva anche chi e HEAD.
 */
export function ForumMembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/forum/members${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) setMembers((await res.json()).members);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Piccolo ritardo: la lista si ricarica quando si smette di scrivere,
    // non a ogni tasto.
    const timer = setTimeout(() => load(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query, load]);

  async function patch(member: Member, data: Partial<Pick<Member, "forumMuted" | "active">>) {
    setError(null);
    const res = await fetch(`/api/forum/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Operazione non riuscita.");
      return;
    }

    const { member: updated } = await res.json();
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, ...updated } : m)));
  }

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca per username…"
        className="venrix-input max-w-sm"
      />

      {error && (
        <p className="pixel-corners-sm border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-400">Caricamento…</p>
      ) : members.length === 0 ? (
        <p className="venrix-card p-8 text-center text-sm text-slate-500">Nessun membro trovato.</p>
      ) : (
        <div className="venrix-card divide-y divide-white/5 overflow-hidden">
          {members.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <MemberAvatar user={member} size={36} />

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
                  <Link
                    href={`/forum/utente/${member.username}`}
                    target="_blank"
                    className="hover:text-venrix-300"
                  >
                    {member.username}
                  </Link>
                  <Badge tone="role">{member.role === "MEMBER" ? "UTENTE" : member.role}</Badge>
                  {member.discordRank && <RankBadge rank={member.discordRank} />}
                  {member.forumMuted && <Badge tone="pending">silenziato</Badge>}
                  {!member.active && <Badge tone="denied">disattivato</Badge>}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {member.postCount} messaggi
                  {member.discordUsername && ` · Discord: ${member.discordUsername}`}
                  {member.minecraftName && ` · MC: ${member.minecraftName}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => patch(member, { forumMuted: !member.forumMuted })}
                  className="pixel-corners-sm border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  {member.forumMuted ? "Riattiva voce" : "Silenzia"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      member.active &&
                      !confirm(`Disattivare l'account di ${member.username}? Verrà disconnesso.`)
                    ) {
                      return;
                    }
                    patch(member, { active: !member.active });
                  }}
                  className="pixel-corners-sm border border-red-500/25 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                >
                  {member.active ? "Disattiva" : "Riattiva"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
