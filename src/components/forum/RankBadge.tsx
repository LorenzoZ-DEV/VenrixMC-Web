import clsx from "clsx";
import type { Role, StaffRole } from "@prisma/client";
import { ROLE_META } from "@/lib/team";
import { ROLE_RANK } from "@/lib/roles";
import { IconShield } from "@/components/icons";

/**
 * Il rank che la community riconosce, preso dalla vetrina /staff e non dal
 * ruolo dell'account: chi scrive sul forum e "Owner" o "Helper", non
 * "ADMIN" (che e un livello di accesso alla dashboard, e non interessa a
 * nessuno leggendo una discussione).
 *
 * `role` e la rete di sicurezza: chi fa parte dello staff ma non compare
 * nella vetrina (o vi compare con un altro nick) resta riconoscibile con un
 * badge generico invece di sembrare un membro qualunque.
 */
export function RankBadge({
  rank,
  role,
  className,
}: {
  rank?: StaffRole | null;
  role?: Role;
  className?: string;
}) {
  if (!rank) {
    const isStaff = role ? ROLE_RANK[role] >= ROLE_RANK.STAFF : false;

    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          isStaff
            ? "border-venrix-500/35 bg-venrix-600/15 text-venrix-200"
            : "border-white/10 bg-white/5 text-slate-400",
          className
        )}
      >
        {isStaff && <IconShield className="h-2.5 w-2.5" />}
        {isStaff ? "Staff" : "Membro"}
      </span>
    );
  }

  const meta = ROLE_META[rank];
  const Icon = meta.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        meta.badgeClass,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}
