"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { STAFF_POSITION_ICONS, STAFF_POSITION_ICON_KEYS } from "@/lib/staffPositionIcons";

type Position = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  slots: number;
  open: boolean;
  requirements: string[];
  wizardId: string | null;
  order: number;
};

const WIZARD_OPTIONS = [
  { value: "", label: "Nessuno (form generico)" },
  { value: "helper-supporter", label: "Helper Supporter" },
  { value: "helper-ss", label: "Helper SS" },
];

const emptyForm = {
  slug: "",
  title: "",
  tagline: "",
  icon: "chat",
  slots: 1,
  open: true,
  requirements: "",
  wizardId: "",
  order: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function PositionsPanel() {
  const [items, setItems] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/staff-positions");
    if (res.ok) setItems((await res.json()).positions);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, data: Partial<Position>) {
    await fetch(`/api/staff-positions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function toggleOpen(p: Position) {
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, open: !x.open } : x)));
    await patch(p.id, { open: !p.open });
  }

  async function updateSlots(p: Position, slots: number) {
    if (Number.isNaN(slots) || slots < 0) return;
    await patch(p.id, { slots });
  }

  async function remove(p: Position) {
    if (!confirm(`Eliminare la posizione "${p.title}"?`)) return;
    await fetch(`/api/staff-positions/${p.id}`, { method: "DELETE" });
    load();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setError(null);
    setOpen(true);
  }

  function openEdit(p: Position) {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      icon: p.icon,
      slots: p.slots,
      open: p.open,
      requirements: p.requirements.join("\n"),
      wizardId: p.wizardId ?? "",
      order: p.order,
    });
    setSlugTouched(true);
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    const payload = {
      slug: form.slug,
      title: form.title,
      tagline: form.tagline,
      icon: form.icon,
      slots: form.slots,
      open: form.open,
      order: form.order,
      wizardId: form.wizardId || null,
      requirements: form.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
    };

    const res = await fetch(editing ? `/api/staff-positions/${editing.id}` : "/api/staff-positions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Errore durante il salvataggio");
      return;
    }

    setOpen(false);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreate}>+ Nuova posizione</Button>
      </div>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Posizione</th>
              <th className="px-4 py-3">Wizard</th>
              <th className="px-4 py-3">Posti</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nessuna posizione configurata.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const Icon = STAFF_POSITION_ICONS[p.icon];
                return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 shrink-0 text-venrix-300" />}
                        <div>
                          <p className="font-medium text-white">{p.title}</p>
                          <p className="text-xs text-slate-500">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.wizardId ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        defaultValue={p.slots}
                        className="w-16 border-2 border-white/10 bg-ink-800 px-2 py-1 text-sm text-slate-200"
                        onBlur={(e) => updateSlots(p, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleOpen(p)}>
                        <Badge tone={p.open ? "approved" : "denied"}>
                          {p.open ? "Aperta" : "Chiusa"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        className="text-sm font-semibold text-venrix-300 hover:text-venrix-200"
                        onClick={() => openEdit(p)}
                      >
                        Modifica
                      </button>
                      <button
                        className="text-sm font-semibold text-red-400 hover:text-red-300"
                        onClick={() => remove(p)}
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifica posizione" : "Nuova posizione"}>
        <div className="space-y-3">
          <div>
            <label className="venrix-label">Titolo</label>
            <input
              className="venrix-input"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: slugTouched ? f.slug : slugify(title),
                }));
              }}
            />
          </div>
          <div>
            <label className="venrix-label">Slug (usato nell'URL del wizard)</label>
            <input
              className="venrix-input"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
          </div>
          <div>
            <label className="venrix-label">Tagline</label>
            <input
              className="venrix-input"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="venrix-label">Icona</label>
              <select
                className="venrix-input"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              >
                {STAFF_POSITION_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="venrix-label">Posti disponibili</label>
              <input
                type="number"
                min={0}
                max={99}
                className="venrix-input"
                value={form.slots}
                onChange={(e) => setForm({ ...form, slots: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="venrix-label">Wizard dedicato</label>
              <select
                className="venrix-input"
                value={form.wizardId}
                onChange={(e) => setForm({ ...form, wizardId: e.target.value })}
              >
                {WIZARD_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="venrix-label">Ordine visualizzazione</label>
              <input
                type="number"
                min={0}
                className="venrix-input"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="venrix-label">Requisiti (uno per riga)</label>
            <textarea
              className="venrix-input resize-none"
              rows={5}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.open}
              onChange={(e) => setForm({ ...form, open: e.target.checked })}
            />
            Posizione aperta
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button onClick={save} className="w-full">
            Salva
          </Button>
        </div>
      </Modal>
    </div>
  );
}
