const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export const DISCORD_REDIRECT_URI = `${APP_URL}/api/auth/discord/callback`;

export function isDiscordOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export function getDiscordAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID ?? "",
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

/** Exchanges an OAuth2 authorization code for the Discord user it belongs to. */
export async function resolveDiscordUser(code: string): Promise<DiscordUser> {
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID ?? "",
      client_secret: CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    throw new Error(`Discord token exchange failed: ${tokenRes.status}`);
  }

  const { access_token: accessToken } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!userRes.ok) {
    throw new Error(`Discord user fetch failed: ${userRes.status}`);
  }

  return (await userRes.json()) as DiscordUser;
}

export function discordAvatarUrl(user: DiscordUser): string | null {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
}
