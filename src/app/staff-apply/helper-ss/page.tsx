import type { Metadata } from "next";
import { StaffWizard } from "@/components/forms/StaffWizard";
import { ApplyGateNotice } from "@/components/forms/ApplyGateNotice";
import { SanctionsWarning } from "@/components/forms/SanctionsWarning";
import { getApplyGate } from "@/lib/applyCooldown";

export const metadata: Metadata = { title: "Candidatura Helper SS · VenrixMC" };
export const dynamic = "force-dynamic";

export default async function HelperSSApplyPage() {
  const gate = await getApplyGate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      {gate.state === "open" ? (
        <div className="space-y-6">
          <SanctionsWarning />
          <StaffWizard wizardId="helper-ss" />
        </div>
      ) : (
        <ApplyGateNotice gate={gate} next="/staff-apply/helper-ss" />
      )}
    </div>
  );
}
