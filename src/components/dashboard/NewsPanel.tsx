"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  author: { username: string };
};

const empty = { title: "", slug: "", excerpt: "", content: "", coverImage: "", published: false };

export function NewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/news");
    if (res.ok) setItems((await res.json()).news);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  }

  function openEdit(n: NewsItem) {
    setEditing(n);
    setForm({
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt ?? "",
      content: n.content,
      coverImage: n.coverImage ?? "",
      published: n.published,
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    const res = await fetch(editing ? `/api/news/${editing.id}` : "/api/news", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Errore durante il salvataggio");
      return;
    }
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Eliminare questa news?")) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreate}>+ Nuova news</Button>
      </div>

      <div className="venrix-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Titolo</th>
              <th className="px-4 py-3">Autore</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Data</th>
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
                  Nessuna news.
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr key={n.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white">{n.title}</td>
                  <td className="px-4 py-3 text-slate-400">{n.author.username}</td>
                  <td className="px-4 py-3">
                    <Badge tone={n.published ? "approved" : "neutral"}>
                      {n.published ? "Pubblicata" : "Bozza"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      className="text-sm font-semibold text-venrix-300 hover:underline"
                      onClick={() => openEdit(n)}
                    >
                      Modifica
                    </button>
                    <button
                      className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-300"
                      onClick={() => remove(n.id)}
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifica news" : "Nuova news"}>
        <div className="space-y-3">
          <div>
            <label className="venrix-label">Titolo</label>
            <input
              className="venrix-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Slug</label>
            <input
              className="venrix-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="es. nuovo-evento-estivo"
            />
          </div>
          <div>
            <label className="venrix-label">Estratto</label>
            <input
              className="venrix-input"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Immagine di copertina (URL)</label>
            <input
              className="venrix-input"
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="https://i.imgur.com/xxxx.png oppure /imgs/news-cover.png"
            />
            <p className="mt-1 text-xs text-slate-500">
              Accetta link esterni (imgur, ibb, qualsiasi CDN) o file dentro /public.
            </p>
          </div>
          <div>
            <label className="venrix-label">Contenuto (HTML)</label>
            <textarea
              className="venrix-input resize-none"
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Pubblicata
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button onClick={save} className="w-full">
            Salva
          </Button>
        </div>
      </Modal>
    </div>
  );
}
