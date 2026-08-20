import type { Metadata } from "next";
import { StaffApplyForm } from "@/components/forms/StaffApplyForm";
import { getStaffPositions } from "@/lib/staffPositions";

export const metadata: Metadata = { title: "Candidatura Staff — VenrixMC" };
export const dynamic = "force-dynamic";

export default async function StaffApplyPage() {
  const positions = await getStaffPositions();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-xl text-white sm:text-2xl">
        Candidati per lo Staff
      </h1>
      <p className="mt-2 text-slate-400">
        Scegli la posizione più adatta a te, leggi i requisiti e compila il modulo. Cerchiamo
        persone motivate, mature e disponibili ad aiutare la community.
      </p>

      <div className="mt-8">
        <StaffApplyForm positions={positions} />
      </div>
    </div>
  );
}
