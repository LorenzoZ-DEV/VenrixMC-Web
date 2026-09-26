"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";

function Saved() {
  return (
    <span className="ml-3 inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
      <IconCheck className="h-3.5 w-3.5" /> Salvato
    </span>
  );
}

type Props = {
  initialColors: { primary: string; primaryDark: string };
  initialSocial: { discord: string; store: string; tiktok: string; youtube: string };
  initialToggles: { showNews: boolean; showDiscordWidget: boolean };
};

async function putSetting(key: string, value: unknown) {
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value: JSON.stringify(value) }),
  });
}

export function SettingsPanel({ initialColors, initialSocial, initialToggles }: Props) {
  const [colors, setColors] = useState(initialColors);
  const [social, setSocial] = useState(initialSocial);
  const [toggles, setToggles] = useState(initialToggles);
  const [saved, setSaved] = useState<string | null>(null);

  async function save(section: string) {
    if (section === "colors") await putSetting("site_colors", colors);
    if (section === "social") await putSetting("social_links", social);
    if (section === "toggles") await putSetting("section_toggles", toggles);
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="venrix-card space-y-4 p-6">
        <h3 className="font-display text-base font-semibold text-white">Colori del sito</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="venrix-label">Primario</label>
            <input
              type="text"
              className="venrix-input"
              value={colors.primary}
              onChange={(e) => setColors({ ...colors, primary: e.target.value })}
            />
          </div>
          <div>
            <label className="venrix-label">Primario scuro</label>
            <input
              type="text"
              className="venrix-input"
              value={colors.primaryDark}
              onChange={(e) => setColors({ ...colors, primaryDark: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={() => save("colors")}>Salva colori</Button>
        {saved === "colors" && <Saved />}
      </div>

      <div className="venrix-card space-y-4 p-6">
        <h3 className="font-display text-base font-semibold text-white">Link social</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["discord", "store", "tiktok", "youtube"] as const).map((k) => (
            <div key={k}>
              <label className="venrix-label capitalize">{k}</label>
              <input
                type="text"
                className="venrix-input"
                value={social[k]}
                onChange={(e) => setSocial({ ...social, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <Button onClick={() => save("social")}>Salva link</Button>
        {saved === "social" && <Saved />}
      </div>

      <div className="venrix-card space-y-4 p-6">
        <h3 className="font-display text-base font-semibold text-white">Sezioni pubbliche</h3>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={toggles.showNews}
            onChange={(e) => setToggles({ ...toggles, showNews: e.target.checked })}
          />
          Mostra sezione News in homepage
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={toggles.showDiscordWidget}
            onChange={(e) => setToggles({ ...toggles, showDiscordWidget: e.target.checked })}
          />
          Mostra widget Discord
        </label>
        <Button onClick={() => save("toggles")}>Salva sezioni</Button>
        {saved === "toggles" && <Saved />}
      </div>
    </div>
  );
}
