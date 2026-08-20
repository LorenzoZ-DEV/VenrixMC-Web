import type { Metadata } from "next";
import { StaffWizard } from "@/components/forms/StaffWizard";

export const metadata: Metadata = { title: "Candidatura Helper Supporter — VenrixMC" };

export default function HelperSupporterApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <StaffWizard wizardId="helper-supporter" />
    </div>
  );
}
