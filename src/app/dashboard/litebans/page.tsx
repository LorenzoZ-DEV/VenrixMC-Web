import { LiteBansPanel } from "@/components/dashboard/LiteBansPanel";

export default function LiteBansDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-lg text-white">Sanzioni (LiteBans)</h1>
      <p className="mt-2 text-slate-400">
        Storico completo di ban, mute, warn e kick letto direttamente dal database di LiteBans.
      </p>
      <div className="mt-6">
        <LiteBansPanel />
      </div>
    </div>
  );
}
