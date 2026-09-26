"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@/components/icons";

/** Ricerca nelle discussioni. Porta a /forum/cerca?q=… */
export function ForumSearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    router.push(`/forum/cerca?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden sm:block">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca nel forum…"
        aria-label="Cerca nel forum"
        className="venrix-input h-10 w-56 py-0 pl-9"
      />
    </form>
  );
}
