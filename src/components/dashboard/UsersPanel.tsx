"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type User = {
  id: string;
  username: string;
  email: string;
  role: "STAFF" | "HEAD" | "ADMIN" | "DEVELOPER";
  active: boolean;
  createdAt: string;
};

const ROLES: User["role"][] = ["STAFF", "HEAD", "ADMIN", "DEVELOPER"];
const emptyCreate = { username: "", email: "", password: "", role: "STAFF" as User["role"] };

export function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<User[]>([]);
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

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>+ Nuovo utente</Button>
      </div>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Caricamento...
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="border-2 border-white/10 bg-ink-800 px-2 py-1 text-xs text-slate-200"
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as User["role"])}
                      disabled={u.id === currentUserId}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? "approved" : "denied"}>
                      {u.active ? "Attivo" : "Disattivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      className="text-sm font-semibold text-venrix-300 hover:text-venrix-200"
                      onClick={() => toggleActive(u)}
                      disabled={u.id === currentUserId}
                    >
                      {u.active ? "Disattiva" : "Attiva"}
                    </button>
                    <button
                      className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-30"
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

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo utente">
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
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button onClick={createUser} className="w-full">
            Crea utente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
