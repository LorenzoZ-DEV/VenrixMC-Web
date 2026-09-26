"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RankBadge } from "@/components/forum/RankBadge";
import type { StaffRole } from "@prisma/client";

type User = {
  id: string;
  username: string;
  email: string;
  role: "MEMBER" | "BUILDER" | "STAFF" | "HEAD" | "ADMIN" | "DEVELOPER";
  discordRank: StaffRole | null;
  active: boolean;
  createdAt: string;
};

// MEMBER e l'utente del forum (chi entra con Discord parte da qui): nessun
// accesso alla dashboard. Senza questa voce il <select> mostrava la prima
// opzione, STAFF, e gli utenti sembravano tutti staff.
const ROLES: User["role"][] = ["MEMBER", "BUILDER", "STAFF", "HEAD", "ADMIN", "DEVELOPER"];
const ROLE_LABEL: Record<User["role"], string> = {
  MEMBER: "UTENTE",
  BUILDER: "CAPO BUILDER",
  STAFF: "STAFF",
  HEAD: "HEAD",
  ADMIN: "ADMIN",
  DEVELOPER: "DEVELOPER",
};
const CREATE_ROLES = ROLES.filter((r) => r !== "MEMBER");
const emptyCreate = { username: "", email: "", password: "", role: "STAFF" as User["role"] };

type Tab = "staff" | "members";

export function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("staff");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCreate);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setItems((await res.json()).users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser() {
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Errore");
      return;
    }
    setOpen(false);
    setForm(emptyCreate);
    load();
  }

  async function changeRole(id: string, role: User["role"]) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Eliminare questo utente?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }

  // Staff = chiunque abbia accesso alla dashboard; utenti registrati = i
  // MEMBER entrati con Discord dal sito o dal forum.
  const staff = items.filter((u) => u.role !== "MEMBER");
  const members = items.filter((u) => u.role === "MEMBER");
  const shown = tab === "staff" ? staff : members;

  const tabClass = (active: boolean) =>
    `pixel-corners-sm border px-4 py-2 text-sm font-medium transition ${
      active
        ? "border-venrix-500/50 bg-venrix-600/15 text-venrix-200"
        : "border-white/10 text-slate-400 hover:text-white"
    }`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button className={tabClass(tab === "staff")} onClick={() => setTab("staff")}>
            Staff registrati ({staff.length})
          </button>
          <button className={tabClass(tab === "members")} onClick={() => setTab("members")}>
            Utenti registrati ({members.length})
          </button>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nuovo account staff</Button>
      </div>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">{tab === "staff" ? "Email" : "Registrato il"}</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Rank Discord</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Caricamento...
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {tab === "staff" ? "Nessun account staff." : "Nessun utente registrato."}
                </td>
              </tr>
            ) : (
              shown.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {/* Le mail dei membri sono sintetiche (<id>@discord.local): non dicono nulla. */}
                    {tab === "staff" ? u.email : new Date(u.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-white/10 bg-ink-800 px-2 py-1 text-xs text-slate-200"
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as User["role"])}
                      disabled={u.id === currentUserId}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.discordRank ? (
                      <RankBadge rank={u.discordRank} />
                    ) : (
                      <span className="text-xs text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? "approved" : "denied"}>
                      {u.active ? "Attivo" : "Disattivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      className="text-sm font-semibold text-venrix-300 hover:underline"
                      onClick={() => toggleActive(u)}
                      disabled={u.id === currentUserId}
                    >
                      {u.active ? "Disattiva" : "Attiva"}
                    </button>
                    <button
                      className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-300 disabled:opacity-30"
                      onClick={() => remove(u.id)}
                      disabled={u.id === currentUserId}
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo account staff">
        <div className="space-y-3">
          <div>
            <label className="venrix-label">Username</label>
            <input
              className="venrix-input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Email</label>
            <input
              className="venrix-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Password</label>
            <input
              className="venrix-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Ruolo</label>
            <select
              className="venrix-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}
            >
              {CREATE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button onClick={createUser} className="w-full">
            Crea utente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
