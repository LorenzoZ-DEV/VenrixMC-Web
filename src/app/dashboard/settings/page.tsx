import { requireDashboardRole } from "@/components/dashboard/RoleGate";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { DiscordNotifyPanel } from "@/components/dashboard/DiscordNotifyPanel";
import { StatusPanel } from "@/components/dashboard/StatusPanel";
import { getSetting } from "@/lib/settings";
import { getDiscordNotifyConfig } from "@/lib/discordNotify";
import { getAnnouncement, getServerModes } from "@/lib/siteStatus";

import { PageHeader } from "@/components/dashboard/PageHeader";
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
  await requireDashboardRole("ADMIN");

  const [colorsRaw, socialRaw, togglesRaw, discordNotify, announcement, modes] = await Promise.all([
    getSetting("site_colors"),
    getSetting("social_links"),
    getSetting("section_toggles"),
    getDiscordNotifyConfig(),
    getAnnouncement(),
    getServerModes(),
  ]);

  return (
    <div>
      <PageHeader
        title="Impostazioni Sito"
        description="Variabili globali: colori, link social, visibilità sezioni pubbliche e notifiche Discord. Le modifiche invalidano la cache Redis immediatamente."
      />
      <div className="mt-6 space-y-6">
        <SettingsPanel
          initialColors={safeParse(colorsRaw, DEFAULT_COLORS)}
          initialSocial={safeParse(socialRaw, DEFAULT_SOCIAL)}
          initialToggles={safeParse(togglesRaw, DEFAULT_TOGGLES)}
        />
        <DiscordNotifyPanel initial={discordNotify} />
        <StatusPanel initialAnnouncement={announcement} initialModes={modes} />
      </div>
    </div>
  );
}
