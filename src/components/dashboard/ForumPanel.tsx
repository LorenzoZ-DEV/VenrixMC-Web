"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FORUM_BOARD_ICON_KEYS, FORUM_TAG_COLORS, boardIcon, tagColor } from "@/lib/forumMeta";
import { IconEdit, IconTrash, IconChevronRight } from "@/components/icons";

type Tag = {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  order: number;
  staffOnly: boolean;
  boards: { id: string }[];
  _count: { topics: number };
};

type Board = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  visible: boolean;
  locked: boolean;
  readRole: string | null;
  postRole: string | null;
  parentId: string | null;
  tags: { id: string }[];
  _count: { topics: number };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  visible: boolean;
  boards: Board[];
};

const ROLE_OPTIONS = [
  { value: "", label: "Tutti" },
  { value: "MEMBER", label: "Membri registrati" },
  { value: "STAFF", label: "Staff" },
  { value: "HEAD", label: "Head" },
  { value: "ADMIN", label: "Admin" },
  { value: "DEVELOPER", label: "Developer" },
];

const emptyCategory = { name: "", description: "", order: 0, visible: true };
const emptyBoard = {
  categoryId: "",
  parentId: "",
  name: "",
  description: "",
  icon: "chat",
  order: 0,
  visible: true,
  locked: false,
  readRole: "",
  postRole: "",
  tagIds: [] as string[],
};
const emptyTag = {
  name: "",
  color: "venrix",
  description: "",
  order: 0,
  staffOnly: false,
  boardIds: [] as string[],
};

/**
 * Pannello unico per la struttura del forum: categorie, forum ed etichette.
 * Stanno insieme perche si guardano a vicenda — un forum va in una categoria,
 * un'etichetta si abilita su certi forum — e separarli obbligherebbe a
 * rimbalzare fra tre pagine per configurare una sezione nuova.
 */
export function ForumPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryModal, setCategoryModal] = useState(false);
  const [boardModal, setBoardModal] = useState(false);
  const [tagModal, setTagModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [boardForm, setBoardForm] = useState(emptyBoard);
  const [tagForm, setTagForm] = useState(emptyTag);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/forum/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setTags(data.tags);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Ogni scrittura passa di qui: stesso errore, stesso ricaricamento. */
  async function send(url: string, method: string, body?: unknown): Promise<boolean> {
    setError(null);
    const res = await fetch(url, {
      method,
      ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Operazione non riuscita.");
      return false;
    }

    await load();
    return true;
  }

  const allBoards = categories.flatMap((c) => c.boards);

  // ---- Categorie ----

  function openCategory(category?: Category) {
    setEditingCategory(category ?? null);
    setCategoryForm(
      category
        ? {
            name: category.name,
            description: category.description ?? "",
            order: category.order,
            visible: category.visible,
          }
        : emptyCategory
    );
    setError(null);
    setCategoryModal(true);
  }

  async function saveCategory() {
    const ok = editingCategory
      ? await send(`/api/forum/categories/${editingCategory.id}`, "PATCH", categoryForm)
      : await send("/api/forum/categories", "POST", categoryForm);
    if (ok) setCategoryModal(false);
  }

  // ---- Forum ----

  function openBoard(categoryId: string, board?: Board, parentId = "") {
    setEditingBoard(board ?? null);
    setBoardForm(
      board
        ? {
            categoryId,
            parentId: board.parentId ?? "",
            name: board.name,
            description: board.description,
            icon: board.icon,
            order: board.order,
            visible: board.visible,
            locked: board.locked,
            readRole: board.readRole ?? "",
            postRole: board.postRole ?? "",
            tagIds: board.tags.map((t) => t.id),
          }
        : { ...emptyBoard, categoryId, parentId }
    );
    setError(null);
    setBoardModal(true);
  }

  async function saveBoard() {
    const ok = editingBoard
      ? await send(`/api/forum/boards/${editingBoard.id}`, "PATCH", boardForm)
      : await send("/api/forum/boards", "POST", boardForm);
    if (ok) setBoardModal(false);
  }

  // ---- Etichette ----

  function openTag(tag?: Tag) {
    setEditingTag(tag ?? null);
    setTagForm(
      tag
        ? {
            name: tag.name,
            color: tag.color,
            description: tag.description ?? "",
            order: tag.order,
            staffOnly: tag.staffOnly,
            boardIds: tag.boards.map((b) => b.id),
          }
        : emptyTag
    );
    setError(null);
    setTagModal(true);
  }

  async function saveTag() {
    const ok = editingTag
      ? await send(`/api/forum/tags/${editingTag.id}`, "PATCH", tagForm)
      : await send("/api/forum/tags", "POST", tagForm);
    if (ok) setTagModal(false);
  }

  if (loading) return <p className="text-slate-400">Caricamento…</p>;

  return (
    <div className="space-y-8">
      {error && (
        <p className="pixel-corners-sm border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">Categorie e forum</h2>
          <Button size="sm" onClick={() => openCategory()}>
            Nuova categoria
          </Button>
        </div>

        {categories.length === 0 && (
          <p className="venrix-card p-8 text-center text-sm text-slate-500">
            Nessuna categoria. Creane una per iniziare a costruire il forum.
          </p>
        )}

        {categories.map((category) => (
          <div key={category.id} className="venrix-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-venrix-300">
                {category.name}
              </h3>
              {!category.visible && (
                <span className="rounded-sm border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                  nascosta
                </span>
              )}
              <span className="text-xs text-slate-500">#{category.order}</span>

              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => openBoard(category.id)}>
                  + Forum
                </Button>
                <IconButton title="Modifica categoria" onClick={() => openCategory(category)}>
                  <IconEdit className="h-4 w-4" />
                </IconButton>
                <IconButton
                  title="Elimina categoria"
                  danger
                  onClick={() => {
                    if (confirm(`Eliminare la categoria "${category.name}"?`)) {
                      send(`/api/forum/categories/${category.id}`, "DELETE");
                    }
                  }}
                >
                  <IconTrash className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            {category.boards.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">Nessun forum in questa categoria.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {/*
                  L'API restituisce i forum di una categoria in un elenco
                  piatto: qui si ricompone l'albero, un livello solo, cosi le
                  sotto-sezioni compaiono rientrate sotto il loro padre.
                */}
                {category.boards
                  .filter((board) => !board.parentId)
                  .map((board) => (
                    <BoardRow
                      key={board.id}
                      board={board}
                      childBoards={category.boards.filter((b) => b.parentId === board.id)}
                      onEdit={(b) => openBoard(category.id, b)}
                      onAddChild={() => openBoard(category.id, undefined, board.id)}
                      onDelete={(b) => {
                        if (confirm(`Eliminare il forum "${b.name}"?`)) {
                          send(`/api/forum/boards/${b.id}`, "DELETE");
                        }
                      }}
                    />
                  ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-white">Etichette</h2>
            <p className="text-sm text-slate-400">
              I prefissi colorati davanti alle discussioni. Senza forum indicati valgono ovunque.
            </p>
          </div>
          <Button size="sm" onClick={() => openTag()}>
            Nuova etichetta
          </Button>
        </div>

        <div className="venrix-card overflow-hidden">
          {tags.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Nessuna etichetta.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {tags.map((tag) => {
                const style = tagColor(tag.color);
                return (
                  <li key={tag.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        style.className
                      )}
                    >
                      <span className={clsx("h-1.5 w-1.5 rounded-sm", style.dot)} />
                      {tag.name}
                    </span>

                    <div className="min-w-0 flex-1 text-xs text-slate-500">
                      {tag.description && <p className="truncate">{tag.description}</p>}
                      <p>
                        {tag.boards.length === 0
                          ? "tutti i forum"
                          : `${tag.boards.length} forum`}{" "}
                        · {tag._count.topics} discussioni
                        {tag.staffOnly && " · solo staff"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <IconButton title="Modifica etichetta" onClick={() => openTag(tag)}>
                        <IconEdit className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        title="Elimina etichetta"
                        danger
                        onClick={() => {
                          if (confirm(`Eliminare l'etichetta "${tag.name}"?`)) {
                            send(`/api/forum/tags/${tag.id}`, "DELETE");
                          }
                        }}
                      >
                        <IconTrash className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ---- Modale categoria ---- */}
      <Modal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        title={editingCategory ? "Modifica categoria" : "Nuova categoria"}
      >
        <div className="space-y-4">
          <div>
            <label className="venrix-label">Nome</label>
            <input
              className="venrix-input"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Descrizione</label>
            <input
              className="venrix-input"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Ordine</label>
            <input
              type="number"
              min={0}
              className="venrix-input"
              value={categoryForm.order}
              onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={categoryForm.visible}
              onChange={(e) => setCategoryForm({ ...categoryForm, visible: e.target.checked })}
            />
            Visibile sul sito
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button className="w-full" onClick={saveCategory}>
            Salva
          </Button>
        </div>
      </Modal>

      {/* ---- Modale forum ---- */}
      <Modal
        open={boardModal}
        onClose={() => setBoardModal(false)}
        title={editingBoard ? "Modifica forum" : "Nuovo forum"}
      >
        <div className="space-y-4">
          <div>
            <label className="venrix-label">Categoria</label>
            <select
              className="venrix-input"
              value={boardForm.categoryId}
              onChange={(e) => setBoardForm({ ...boardForm, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="venrix-label">Sotto-sezione di</label>
            <select
              className="venrix-input"
              value={boardForm.parentId}
              onChange={(e) => setBoardForm({ ...boardForm, parentId: e.target.value })}
            >
              <option value="">Nessuno (forum di primo livello)</option>
              {/*
                Solo i forum di primo livello della stessa categoria: l'albero
                si ferma a un livello e un padre di un'altra categoria
                renderebbe incoerenti le briciole di pane. L'API ricontrolla.
              */}
              {categories
                .find((c) => c.id === boardForm.categoryId)
                ?.boards.filter((b) => !b.parentId && b.id !== editingBoard?.id)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="venrix-label">Nome</label>
            <input
              className="venrix-input"
              value={boardForm.name}
              onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Descrizione</label>
            <textarea
              rows={2}
              className="venrix-input resize-none"
              value={boardForm.description}
              onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="venrix-label">Icona</label>
              <select
                className="venrix-input"
                value={boardForm.icon}
                onChange={(e) => setBoardForm({ ...boardForm, icon: e.target.value })}
              >
                {FORUM_BOARD_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="venrix-label">Ordine</label>
              <input
                type="number"
                min={0}
                className="venrix-input"
                value={boardForm.order}
                onChange={(e) => setBoardForm({ ...boardForm, order: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="venrix-label">Chi può leggere</label>
              <select
                className="venrix-input"
                value={boardForm.readRole}
                onChange={(e) => setBoardForm({ ...boardForm, readRole: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="venrix-label">Chi può scrivere</label>
              <select
                className="venrix-input"
                value={boardForm.postRole}
                onChange={(e) => setBoardForm({ ...boardForm, postRole: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.value === "" ? "Ogni membro" : r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="venrix-label">Etichette abilitate qui</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Toggle
                    key={tag.id}
                    on={boardForm.tagIds.includes(tag.id)}
                    label={tag.name}
                    onClick={() =>
                      setBoardForm({
                        ...boardForm,
                        tagIds: boardForm.tagIds.includes(tag.id)
                          ? boardForm.tagIds.filter((id) => id !== tag.id)
                          : [...boardForm.tagIds, tag.id],
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={boardForm.visible}
                onChange={(e) => setBoardForm({ ...boardForm, visible: e.target.checked })}
              />
              Visibile sul sito
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={boardForm.locked}
                onChange={(e) => setBoardForm({ ...boardForm, locked: e.target.checked })}
              />
              Sola lettura (archivio)
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button className="w-full" onClick={saveBoard}>
            Salva
          </Button>
        </div>
      </Modal>

      {/* ---- Modale etichetta ---- */}
      <Modal
        open={tagModal}
        onClose={() => setTagModal(false)}
        title={editingTag ? "Modifica etichetta" : "Nuova etichetta"}
      >
        <div className="space-y-4">
          <div>
            <label className="venrix-label">Nome</label>
            <input
              className="venrix-input"
              value={tagForm.name}
              onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Colore</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FORUM_TAG_COLORS).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  title={value.label}
                  onClick={() => setTagForm({ ...tagForm, color: key })}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition",
                    value.className,
                    tagForm.color === key ? "ring-1 ring-inset ring-current" : "opacity-60"
                  )}
                >
                  <span className={clsx("h-1.5 w-1.5 rounded-sm", value.dot)} />
                  {value.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="venrix-label">Descrizione</label>
            <input
              className="venrix-input"
              value={tagForm.description}
              onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
            />
          </div>

          {allBoards.length > 0 && (
            <div>
              <label className="venrix-label">
                Forum in cui è disponibile (nessuno = tutti)
              </label>
              <div className="flex flex-wrap gap-2">
                {allBoards.map((board) => (
                  <Toggle
                    key={board.id}
                    on={tagForm.boardIds.includes(board.id)}
                    label={board.name}
                    onClick={() =>
                      setTagForm({
                        ...tagForm,
                        boardIds: tagForm.boardIds.includes(board.id)
                          ? tagForm.boardIds.filter((id) => id !== board.id)
                          : [...tagForm.boardIds, board.id],
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="venrix-label">Ordine</label>
              <input
                type="number"
                min={0}
                className="venrix-input"
                value={tagForm.order}
                onChange={(e) => setTagForm({ ...tagForm, order: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={tagForm.staffOnly}
                onChange={(e) => setTagForm({ ...tagForm, staffOnly: e.target.checked })}
              />
              Solo staff
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button className="w-full" onClick={saveTag}>
            Salva
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Una riga della lista forum, con le sue sotto-sezioni rientrate sotto.
 * `depth` cambia solo il rientro e la taglia: le azioni sono le stesse, a
 * parte "aggiungi sotto-sezione", che ha senso solo al primo livello.
 */
function BoardRow({
  board,
  childBoards,
  onEdit,
  onAddChild,
  onDelete,
  depth = 0,
}: {
  board: Board;
  childBoards?: Board[];
  onEdit: (board: Board) => void;
  onAddChild?: () => void;
  onDelete: (board: Board) => void;
  depth?: number;
}) {
  const Icon = boardIcon(board.icon);
  const nested = depth > 0;

  return (
    <>
      <li
        className={clsx("flex flex-wrap items-center gap-3 py-3 pr-5", nested ? "pl-14" : "pl-5")}
      >
        <span
          className={clsx(
            "pixel-corners-sm flex shrink-0 items-center justify-center bg-venrix-600/12 text-venrix-300",
            nested ? "h-7 w-7" : "h-9 w-9"
          )}
        >
          <Icon className={nested ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
            {board.name}
            {nested && (
              <span className="text-[10px] font-bold uppercase text-slate-600">sotto-sezione</span>
            )}
            {!board.visible && (
              <span className="text-[10px] font-bold uppercase text-slate-500">nascosto</span>
            )}
            {board.locked && (
              <span className="text-[10px] font-bold uppercase text-amber-500">chiuso</span>
            )}
          </p>
          <p className="truncate text-xs text-slate-500">{board.description}</p>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p>{board._count.topics} discussioni</p>
          <p>
            lettura: {board.readRole ?? "tutti"} · scrittura: {board.postRole ?? "membri"}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {onAddChild && (
            <button
              type="button"
              onClick={onAddChild}
              title="Aggiungi una sotto-sezione"
              className="pixel-corners-sm border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition hover:border-venrix-500/40 hover:text-venrix-200"
            >
              + Sotto-sezione
            </button>
          )}
          <Link
            href={`/forum/${board.slug}`}
            target="_blank"
            className="p-1.5 text-slate-500 transition hover:text-venrix-300"
            title="Apri sul sito"
          >
            <IconChevronRight className="h-4 w-4" />
          </Link>
          <IconButton title="Modifica forum" onClick={() => onEdit(board)}>
            <IconEdit className="h-4 w-4" />
          </IconButton>
          <IconButton title="Elimina forum" danger onClick={() => onDelete(board)}>
            <IconTrash className="h-4 w-4" />
          </IconButton>
        </div>
      </li>

      {childBoards?.map((child) => (
        <BoardRow
          key={child.id}
          board={child}
          onEdit={onEdit}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function IconButton({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={clsx(
        "p-1.5 text-slate-500 transition",
        danger ? "hover:text-red-400" : "hover:text-venrix-300"
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "pixel-corners-sm border px-2.5 py-1 text-xs transition",
        on
          ? "border-venrix-500/40 bg-venrix-600/15 text-venrix-200"
          : "border-white/10 text-slate-400 hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}
