import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { getSetting } from "@/lib/settings";

const DEFAULT_COLORS = { primary: "#7c3aed", primaryDark: "#6d28d9" };
const DEFAULT_SOCIAL = { discord: "", store: "", tiktok: "", youtube: "" };
const DEFAULT_TOGGLES = { showNews: true, showDiscordWidget: true };

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export default async function SettingsDashboardPage() {
  await requireDashboardRole("DEVELOPER");

  const [colorsRaw, socialRaw, togglesRaw] = await Promise.all([
    getSetting("site_colors"),
    getSetting("social_links"),
    getSetting("section_toggles"),
  ]);

  return (
    <div>
      <h1 className="font-display text-lg text-white">Impostazioni Sito</h1>
      <p className="mt-1 text-slate-400">
        Variabili globali: colori, link social e visibilità sezioni pubbliche. Le modifiche
        invalidano la cache Redis immediatamente.
      </p>
      <div className="mt-6">
        <SettingsPanel
          initialColors={safeParse(colorsRaw, DEFAULT_COLORS)}
          initialSocial={safeParse(socialRaw, DEFAULT_SOCIAL)}
          initialToggles={safeParse(togglesRaw, DEFAULT_TOGGLES)}
        />
      </div>
    </div>
  );
}
