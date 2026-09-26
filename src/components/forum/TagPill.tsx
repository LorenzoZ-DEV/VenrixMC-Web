import Link from "next/link";
import clsx from "clsx";
import { tagColor } from "@/lib/forumMeta";

export type TagShape = { id: string; name: string; slug: string; color: string };

/**
 * Prefisso colorato davanti al titolo di una discussione, come le label di
 * NamelessMC. Con `href` diventa il filtro della lista del forum.
 */
export function TagPill({
  tag,
  href,
  active,
  className,
}: {
  tag: TagShape;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  const style = tagColor(tag.color);
  const content = (
    <>
      <span className={clsx("h-1.5 w-1.5 rounded-sm", style.dot)} />
      {tag.name}
    </>
  );

  const classes = clsx(
    "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition",
    style.className,
    active && "ring-1 ring-inset ring-current",
    href && "hover:brightness-110",
    className
  );

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
