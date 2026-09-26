import clsx from "clsx";

type AvatarUser = {
  username: string;
  discordAvatar?: string | null;
  minecraftName?: string | null;
};

/**
 * Faccia di un membro. Nell'ordine: avatar Discord (ce l'hanno tutti quelli
 * che si sono registrati da qui), testa Minecraft del nick dichiarato,
 * iniziale come ultima spiaggia.
 *
 * Volutamente un <img> e non next/image: minotar.net serve una PNG diversa
 * per ogni nick e passare dall'optimizer significherebbe una cache entry per
 * ogni membro, per immagini da qualche kilobyte.
 */
export function MemberAvatar({
  user,
  size = 40,
  className,
}: {
  user: AvatarUser;
  size?: number;
  className?: string;
}) {
  const nick = user.minecraftName ?? user.username;
  const src =
    user.discordAvatar ?? `https://minotar.net/helm/${encodeURIComponent(nick)}/${size * 2}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={user.username}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={clsx("pixel-corners-sm shrink-0 border border-white/10 object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
