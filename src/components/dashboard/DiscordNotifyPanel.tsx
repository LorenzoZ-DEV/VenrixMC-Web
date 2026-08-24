"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconChat } from "@/components/icons";
import type { DiscordNotifyConfig } from "@/lib/discordNotify";

type Guild = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string };

const SNOWFLAKE = /^\d{17,20}$/;

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate-300">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

/**
 * Channel picker: a dropdown of the channels the bot can see, with a manual
 * ID box as an escape hatch (private categories the bot can't list, or a
 * channel created after the last refresh).
 */
function ChannelField({
  label,
  hint,
  value,
  channels,
  disabled,
  onChange,
  onTest,
}: {
  label: string;
  hint: string;
  value: string;
  channels: Channel[];
  disabled: boolean;
  onChange: (id: string) => void;
  onTest: (id: string) => void;
}) {
  const known = channels.some((c) => c.id === value);

  return (
    <div>
      <label className="venrix-label">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="venrix-input flex-1"
          value={known ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Nessuno (non pubblicare) —</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!SNOWFLAKE.test(value)}
          onClick={() => onTest(value)}
        >
          Test
        </Button>
      </div>
      <input
        className="venrix-input mt-2 font-mono text-xs"
        placeholder="…oppure incolla il Channel ID"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function DiscordNotifyPanel({ initial }: { initial: DiscordNotifyConfig }) {
  const [config, setConfig] = useState<DiscordNotifyConfig>(initial);
  const [botConfigured, setBotConfigured] = useState<boolean | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const loadTargets = useCallback(async (guildId: string) => {
    setLoading(true);
    try {
      const params = SNOWFLAKE.test(guildId) ? `?guildId=${guildId}` : "";
      const res = await fetch(`/api/discord/targets${params}`);
      const data = await res.json();

      setBotConfigured(Boolean(data.configured));
      setGuilds(data.guilds ?? []);
      setChannels(data.channels ?? []);
      if (data.error) setMessage({ tone: "error", text: data.error });
    } catch {
      setMessage({ tone: "error", text: "Impossibile contattare Discord." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTargets(initial.guildId);
  }, [loadTargets, initial.guildId]);

  function patch(update: Partial<DiscordNotifyConfig>) {
    setConfig((current) => ({ ...current, ...update }));
    setMessage(null);
  }

  function selectGuild(guildId: string) {
    // Channels belong to a guild — dropping them avoids saving an ID that
    // lives in a server we're no longer pointing at.
    patch({ guildId, applicationsChannelId: "", appealsChannelId: "" });
    setChannels([]);
    if (SNOWFLAKE.test(guildId)) loadTargets(guildId);
  }

  async function save() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "discord_notify", value: JSON.stringify(config) }),
    });

    if (res.ok) {
      setMessage({ tone: "ok", text: "Configurazione salvata." });
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ tone: "error", text: data?.error ?? "Salvataggio fallito." });
    }
  }

  async function test(channelId: string) {
    setMessage(null);
    const res = await fetch("/api/discord/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    });

    if (res.ok) {
      setMessage({ tone: "ok", text: "Messaggio di test inviato nel canale." });
    } else {
      const data = await res.json().catch(() => null);
      setMessage({ tone: "error", text: data?.error ?? "Invio del test fallito." });
    }
  }

  const guildKnown = guilds.some((g) => g.id === config.guildId);

  return (
    <div className="venrix-card space-y-5 p-6">
      <div className="flex items-center gap-2">
        <IconChat className="h-4 w-4 text-venrix-300" />
        <h3 className="font-display text-xs text-white">Notifiche Discord</h3>
      </div>

      {botConfigured === false && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          <code>DISCORD_BOT_TOKEN</code> non è impostato nell'ambiente: senza bot il sito non può
          inviare DM né scrivere nei canali. Crea un bot su Discord Developer Portal, invitalo nel
          server e incolla il token nel <code>.env</code>.
        </p>
      )}

      <Toggle checked={config.enabled} onChange={(enabled) => patch({ enabled })}>
        Invia l'esito di candidature e appeal su Discord
      </Toggle>

      <div>
        <label className="venrix-label">Server (guild)</label>
        <select
          className="venrix-input"
          value={guildKnown ? config.guildId : ""}
          disabled={loading || guilds.length === 0}
          onChange={(e) => selectGuild(e.target.value)}
        >
          <option value="">{loading ? "Caricamento..." : "— Seleziona un server —"}</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <input
          className="venrix-input mt-2 font-mono text-xs"
          placeholder="…oppure incolla il Server ID"
          value={config.guildId}
          onChange={(e) => selectGuild(e.target.value.trim())}
        />
        <p className="mt-1 text-xs text-slate-500">
          Compaiono solo i server in cui il bot è stato invitato. Il server serve anche a risolvere
          l'username Discord scritto nel form nel suo ID reale.
        </p>
      </div>

      <ChannelField
        label="Canale esiti candidature staff"
        hint="Qui viene pubblicato l'esito di ogni candidatura approvata o rifiutata."
        value={config.applicationsChannelId}
        channels={channels}
        disabled={loading || !config.guildId}
        onChange={(applicationsChannelId) => patch({ applicationsChannelId })}
        onTest={test}
      />

      <ChannelField
        label="Canale esiti ban appeal"
        hint="Lascia vuoto se non vuoi pubblicare gli appeal in un canale."
        value={config.appealsChannelId}
        channels={channels}
        disabled={loading || !config.guildId}
        onChange={(appealsChannelId) => patch({ appealsChannelId })}
        onTest={test}
      />

      <div className="space-y-2 border-t border-white/10 pt-4">
        <Toggle
          checked={config.dmApplications}
          onChange={(dmApplications) => patch({ dmApplications })}
        >
          Manda un DM al candidato con l'esito della candidatura
        </Toggle>
        <Toggle checked={config.dmAppeals} onChange={(dmAppeals) => patch({ dmAppeals })}>
          Manda un DM al giocatore con l'esito dell'appeal
        </Toggle>
        <Toggle
          checked={config.includeStaffNotes}
          onChange={(includeStaffNotes) => patch({ includeStaffNotes })}
        >
          Includi le note staff nel DM dell'appeal{" "}
          <span className="text-slate-500">(sono interne: attivalo solo se le scrivi per il giocatore)</span>
        </Toggle>
      </div>

      <p className="text-xs text-slate-500">
        Il DM parte solo se il giocatore è nel server Discord e ha i messaggi privati aperti.
        Quando non ci riusciamo lo staff lo vede subito nel pannello e resta traccia nell'audit log.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save}>Salva notifiche</Button>
        <Button variant="secondary" onClick={() => loadTargets(config.guildId)}>
          Ricarica server e canali
        </Button>
        {message && (
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${
              message.tone === "ok" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message.tone === "ok" && <IconCheck className="h-3.5 w-3.5" />}
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
