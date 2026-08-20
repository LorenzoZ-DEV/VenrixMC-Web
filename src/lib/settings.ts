import { prisma } from "./prisma";
import { cached, TTL } from "./cache";
import { keys } from "./redis";

export async function getSetting(key: string): Promise<string | null> {
  return cached(keys.cache("settings", key), TTL.RULES, async () => {
    const row = await prisma.siteSettings.findUnique({ where: { key } });
    return row?.value ?? null;
  });
}

export async function getRulesContent(): Promise<string> {
  const value = await getSetting("rules_content");
  return value ?? "<p>Il regolamento sarà pubblicato a breve.</p>";
}
