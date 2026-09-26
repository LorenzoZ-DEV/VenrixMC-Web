"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/icons";

type Theme = "light" | "dark";

/**
 * Interruttore chiaro/scuro. Il tema viene gia applicato dallo script inline
 * in `layout.tsx` prima del primo frame: qui lo rileggiamo dal DOM dopo il
 * mount, cosi il markup del server (che non conosce il localStorage) e quello
 * del client coincidono e React non segnala mismatch di idratazione.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Navigazione in incognito o storage bloccato: il tema resta valido
      // per la sessione corrente, semplicemente non viene ricordato.
    }
  }

  // Finche non sappiamo quale tema e attivo mostriamo un segnaposto della
  // stessa dimensione, per non far saltare la barra di navigazione.
  const label = theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`btn-base h-10 w-10 bg-ink-700 text-slate-200 hover:bg-ink-600 ${className ?? ""}`}
    >
      {theme === null ? (
        <span className="h-4 w-4" />
      ) : theme === "dark" ? (
        <IconSun className="h-4 w-4" />
      ) : (
        <IconMoon className="h-4 w-4" />
      )}
    </button>
  );
}
