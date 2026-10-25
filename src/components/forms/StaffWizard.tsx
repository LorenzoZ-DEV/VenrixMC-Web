"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconChevronLeft, IconShield, PixelFrame } from "@/components/icons";
import { wizardTotalSteps, type WizardField } from "@/lib/wizards/types";
import { WIZARD_REGISTRY, type WizardId } from "@/lib/wizards/registry";

type Values = Record<string, string>;

function Field({
  field,
  value,
  onChange,
}: {
  field: WizardField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="venrix-label" htmlFor={field.id}>
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={field.id}
          required={field.required}
          minLength={field.minLength}
          rows={4}
          className="venrix-input resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          id={field.id}
          required={field.required}
          className="venrix-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Seleziona...
          </option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.id}
          type={field.type === "number" ? "number" : "text"}
          required={field.required}
          minLength={field.type === "text" ? field.minLength : undefined}
          min={field.type === "number" ? 10 : undefined}
          max={field.type === "number" ? 99 : undefined}
          className="venrix-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function StaffWizard({ wizardId }: { wizardId: WizardId }) {
  const config = WIZARD_REGISTRY[wizardId];
  const totalSteps = wizardTotalSteps(config);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  /*
   * Motivo del blocco per blacklist. Sta a parte da `error` perche' non e'
   * un errore da correggere e riprovare: quando arriva, il modulo non serve
   * piu' e lascia il posto all'avviso.
   */
  const [blacklistReason, setBlacklistReason] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const isIntro = step === 0;
  const section = isIntro ? null : config.sections[step - 1];
  const isLastSection = step === totalSteps - 1;

  function setValue(id: string, value: string) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  function currentSectionValid(): boolean {
    if (!section) return true;
    return section.fields.every((f) => {
      if (!f.required) return true;
      const v = (values[f.id] ?? "").trim();
      if (!v) return false;
      if (f.minLength && v.length < f.minLength) return false;
      return true;
    });
  }

  function goNext() {
    setTouched(true);
    if (!currentSectionValid()) return;
    setTouched(false);
    setStep((s) => Math.min(totalSteps - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setTouched(false);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setTouched(true);
    if (!currentSectionValid()) return;

    setStatus("loading");
    setError(null);

    // Skip unanswered optional questions — the API rejects blank answers.
    const answers = config.sections.flatMap((sec) =>
      sec.fields
        .filter((f) => (values[f.id] ?? "").trim().length > 0)
        .map((f) => ({
          section: sec.title,
          question: f.label,
          answer: values[f.id].trim(),
        }))
    );

    const fallback = (fieldId: string, text: string) => values[fieldId] || text;

    const payload = {
      minecraftName: values[config.mapping.minecraftName],
      discord: values[config.mapping.discord],
      age: values[config.mapping.age],
      roles: config.roleTitle,
      experience: fallback(config.mapping.experience, "Nessuna informazione aggiuntiva indicata."),
      message: fallback(config.mapping.message, "Nessuna informazione aggiuntiva indicata."),
      answers,
    };

    try {
      const res = await fetch("/api/staff-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.blacklisted) {
          setBlacklistReason(typeof data.reason === "string" ? data.reason : "");
          setStatus("error");
          return;
        }
        setError(data.error ?? "Si è verificato un errore, riprova più tardi.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setError("Impossibile contattare il server, riprova più tardi.");
      setStatus("error");
    }
  }

  /*
   * Blacklist: si sostituisce il modulo, non si aggiunge una riga rossa in
   * fondo. Ricompilare non cambierebbe l'esito, quindi tenere i campi a
   * video sarebbe un invito a perdere tempo.
   */
  if (blacklistReason !== null) {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-8 text-center">
        <PixelFrame className="h-12 w-12 text-red-600 dark:text-red-400">
          <IconShield className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-base font-semibold text-red-600 dark:text-red-400">
          Candidatura bloccata per blacklist staff
        </p>
        {blacklistReason && (
          <div className="mt-1 w-full max-w-md rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-left">
            <p className="mono-label text-red-600 dark:text-red-400">Motivo</p>
            <p className="mt-1.5 whitespace-pre-line text-sm text-slate-200">{blacklistReason}</p>
          </div>
        )}
        <p className="mt-1 max-w-md text-[13px] text-slate-500">
          Se pensi che sia un errore, parlane con lo staff sul Discord del server.
        </p>
        <Link href="/staff-apply" className="venrix-btn-secondary mt-2">
          Torna alle posizioni
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="venrix-card flex flex-col items-center gap-3 p-8 text-center">
        <PixelFrame className="h-12 w-12 text-emerald-600 dark:text-emerald-400">
          <IconCheck className="h-6 w-6" />
        </PixelFrame>
        <p className="font-display text-base font-semibold text-emerald-600 dark:text-emerald-400">Candidatura inviata</p>
        <p className="text-sm text-slate-400">
          Grazie per il tuo interesse! Il nostro Head Staff la esaminerà a breve.
        </p>
        <Link href="/dashboard/richieste" className="venrix-btn-secondary mt-2">
          Segui lo stato nella tua dashboard
        </Link>
      </div>
    );
  }

  const Icon = isIntro ? config.intro.icon : section!.icon;
  const title = isIntro ? config.intro.title : section!.title;

  return (
    <div className="venrix-card p-6 sm:p-8">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 ${i <= step ? "bg-venrix-500" : "bg-white/10"}`} />
        ))}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-venrix-200">
        Sezione {step + 1} di {totalSteps}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <PixelFrame className="h-11 w-11 text-venrix-300">
          <Icon className="h-5 w-5" />
        </PixelFrame>
        <h2 className="font-display text-sm text-white">{title}</h2>
      </div>

      {isIntro ? (
        <p className="mt-5 text-sm leading-relaxed text-slate-400">{config.intro.body}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {section!.fields.map((f) => (
            <Field key={f.id} field={f} value={values[f.id] ?? ""} onChange={(v) => setValue(f.id, v)} />
          ))}
          {touched && !currentSectionValid() && (
            <p className="text-sm text-red-600 dark:text-red-400">Compila tutti i campi richiesti prima di continuare.</p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLastSection && (
        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          Inviando la candidatura accetti i{" "}
          <Link href="/terms" target="_blank" className="text-venrix-300 hover:underline">
            Termini di Servizio
          </Link>{" "}
          e dichiari di aver letto la{" "}
          <Link href="/privacy" target="_blank" className="text-venrix-300 hover:underline">
            Privacy Policy
          </Link>
          , che spiega quali dati raccogliamo e come li usiamo.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={goBack} disabled={status === "loading"}>
            <IconChevronLeft className="h-3.5 w-3.5" /> Indietro
          </Button>
        ) : (
          <Link href="/staff-apply" className="venrix-btn-secondary">
            <IconChevronLeft className="h-3.5 w-3.5" /> Posizioni
          </Link>
        )}

        {isLastSection ? (
          <Button type="button" onClick={submit} disabled={status === "loading"}>
            {status === "loading" ? "Invio in corso..." : "Invia candidatura"}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            Avanti
          </Button>
        )}
      </div>
    </div>
  );
}
