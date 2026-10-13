export const SITE = {
  name: "VenrixMC",
  // Unica fonte: package.json, inlinata da next.config.js.
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  author: { name: "Lorenzzzzzz", url: "https://lorenzzzz.xyz/" },
  serverIp: process.env.NEXT_PUBLIC_SERVER_IP ?? "play.venrixmc.uk",
  storeUrl: process.env.NEXT_PUBLIC_STORE_URL ?? "https://store.venrixmc.uk/",
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/sDhGS4EVJw",
  // La versione minima supportata. Era scritta a mano nel pannello
  // dell'hero: ora la leggono anche i passi di "Come giocare", e due
  // stringhe scollegate sarebbero andate fuori sincrono al primo aggiornamento.
  minecraftVersion: process.env.NEXT_PUBLIC_MC_VERSION ?? "1.20",
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/forum", label: "Forum" },
  { href: "/rules", label: "Rules" },
  { href: "/appeals", label: "Appeals" },
  { href: "/bans", label: "Bans" },
  { href: "/status", label: "Status" },
  { href: "/staff", label: "Staff" },
  { href: "/staff-apply", label: "Staff Apply" },
];
