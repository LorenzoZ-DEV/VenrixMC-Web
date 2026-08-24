"use client";

import { IconCheck } from "@/components/icons";
import { RESULT_LABELS, outcomeIsClean, type NotifyOutcome } from "@/lib/notifyResult";

export type Notice = { tone: "ok" | "warn"; text: string };

/**
 * Turns the `notify` block an API returns after a decision into a one-line
 * banner, so staff immediately knows whether the player actually got the DM
 * instead of finding out days later.
 */
export function noticeFromOutcome(outcome: NotifyOutcome | null): Notice | null {
  if (!outcome) return null;
  if (outcome.dm === "disabled" && outcome.channel === "disabled") return null;

  const parts: string[] = [];
  parts.push(outcome.dm === "sent" ? "DM inviato" : `DM non inviato (${RESULT_LABELS[outcome.dm]})`);
  if (outcome.channel !== "disabled") {
    parts.push(outcome.channel === "sent" ? "pubblicato nel canale" : `canale: ${RESULT_LABELS[outcome.channel]}`);
  }

  return { tone: outcomeIsClean(outcome) ? "ok" : "warn", text: parts.join(" · ") };
}

export function NotifyNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;

  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
        notice.tone === "ok"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      {notice.tone === "ok" && <IconCheck className="h-3.5 w-3.5 shrink-0" />}
      <span>{notice.text}</span>
    </div>
  );
}
