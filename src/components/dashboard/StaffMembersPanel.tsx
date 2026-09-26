"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ROLE_META, ROLE_ORDER, type StaffRole } from "@/lib/team";
import { IconChevronLeft, IconChevronRight, IconEdit, IconTrash } from "@/components/icons";

type Member = {
  id: string;
  username: string;
  role: StaffRole;
  description: string;
  order: number;
  visible: boolean;
};

const emptyForm = {
  username: "",
  role: "Trainee" as StaffRole,
  description: "",
  visible: true,
};

export function StaffMembersPanel() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/staff-members");
    if (res.ok) setItems((await res.json()).members);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Salva un campo senza ricaricare: chi chiama decide quando rileggere. */
  async function patchOnly(id: string, data: Partial<Member>) {
    const res = await fetch(`/api/staff-members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Salvataggio fallito");
  }

  async function patch(id: string, data: Partial<Member>) {
    await patchOnly(id, data);
    load();
  }

  /**
   * Sposta un membro di una posizione dentro il proprio ruolo scambiando il
   * campo `order` con il vicino. Riordinare solo dentro il gruppo evita di
   * dover ricalcolare l'intera lista a ogni click.
   */
  async function move(member: Member, direction: -1 | 1) {
    const group = items
      .filter((m) => m.role === member.role)
      .sort((a, b) => a.order - b.order || a.username.localeCompare(b.username));
    const index = group.findIndex((m) => m.id === member.id);
    const neighbour = group[index + direction];
    if (!neighbour) return;

    // Se due schede condividono lo stesso `order` (import manuali, seed
    // rieseguiti) lo scambio secco non muoverebbe nulla: in quel caso
    // riassegniamo posizioni distinte partendo dall'ordine mostrato.
    if (neighbour.order === member.order) {
      const reordered = [...group];
      reordered[index] = neighbour;
      reordered[index + direction] = member;
      await Promise.all(reordered.map((m, i) => patchOnly(m.id, { order: i })));
    } else {
      await Promise.all([
        patchOnly(member.id, { order: neighbour.order }),
        patchOnly(neighbour.id, { order: member.order }),
      ]);
    }

    load();
  }

  async function remove(member: Member) {
    if (!confirm(`Rimuovere ${member.username} dalla lista staff?`)) return;
    await fetch(`/api/staff-members/${member.id}`, { method: "DELETE" });
    load();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({
      username: member.username,
      role: member.role,
      description: member.description,
      visible: member.visible,
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    setSaving(true);
    const res = await fetch(editing ? `/api/staff-members/${editing.id}` : "/api/staff-members", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Salvataggio fallito");
      return;
    }

    setOpen(false);
    load();
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Caricamento…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {items.length} {items.length === 1 ? "membro" : "membri"} in lista ·{" "}
          {items.filter((m) => !m.visible).length} nascosti
        </p>
        <Button onClick={openCreate}>Aggiungi membro</Button>
      </div>

      {error && (
        <p className="mt-4 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {ROLE_ORDER.map((role) => {
          const group = items
            .filter((m) => m.role === role)
            .sort((a, b) => a.order - b.order || a.username.localeCompare(b.username));
          const meta = ROLE_META[role];
          const RoleIcon = meta.icon;

          return (
            <section key={role}>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${meta.badgeClass}`}
                >
                  <RoleIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
                <span className="text-xs text-slate-500">{group.length}</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {group.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nessun membro con questo ruolo.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {group.map((member, i) => (
                    <li
                      key={member.id}
                      className="venrix-card flex flex-wrap items-start gap-3 px-4 py-3"
                    >
                      <div className="flex flex-col gap-1 pt-0.5">
                        <button
                          onClick={() => move(member, -1)}
                          disabled={i === 0}
                          aria-label="Sposta su"
                          className="rounded-sm p-1 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                        >
                          <IconChevronLeft className="h-3.5 w-3.5 rotate-90" />
                        </button>
                        <button
                          onClick={() => move(member, 1)}
                          disabled={i === group.length - 1}
                          aria-label="Sposta giù"
                          className="rounded-sm p-1 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                        >
                          <IconChevronRight className="h-3.5 w-3.5 rotate-90" />
                        </button>
                      </div>

                      <div className="min-w-56 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-[15px] font-semibold text-white">
                            {member.username}
                          </p>
                          {!member.visible && <Badge tone="neutral">Nascosto</Badge>}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">
                          {member.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => patch(member.id, { visible: !member.visible })}
                        >
                          {member.visible ? "Nascondi" : "Mostra"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(member)}>
                          <IconEdit className="h-4 w-4" />
                          Modifica
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(member)}>
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Modifica ${editing.username}` : "Nuovo membro dello staff"}
      >
        <div className="space-y-4">
          <div>
            <label className="venrix-label" htmlFor="staff-username">
              Nickname Minecraft
            </label>
            <input
              id="staff-username"
              className="venrix-input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Es. Lorenzzzzzz"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Da questo nickname vengono caricate skin e anteprima 3D su /staff.
            </p>
          </div>

          <div>
            <label className="venrix-label" htmlFor="staff-role">
              Ruolo
            </label>
            <select
              id="staff-role"
              className="venrix-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
            >
              {ROLE_ORDER.map((role) => (
                <option key={role} value={role}>
                  {ROLE_META[role].label}: {ROLE_META[role].tagline}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="venrix-label" htmlFor="staff-description">
              Descrizione
            </label>
            <textarea
              id="staff-description"
              className="venrix-input min-h-28"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Di cosa si occupa nel team"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              className="h-4 w-4 accent-venrix-600"
            />
            Mostra sulla pagina pubblica /staff
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvataggio…" : editing ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
