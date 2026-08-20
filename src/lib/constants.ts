export const SITE = {
  name: "VenrixMC",
  serverIp: process.env.NEXT_PUBLIC_SERVER_IP ?? "play.venrixmc.uk",
  storeUrl: process.env.NEXT_PUBLIC_STORE_URL ?? "https://store.venrixmc.uk/",
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/venrixmc",
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/rules", label: "Rules" },
  { href: "/appeals", label: "Appeals" },
  { href: "/staff", label: "Staff" },
  { href: "/staff-apply", label: "Staff Apply" },
];
