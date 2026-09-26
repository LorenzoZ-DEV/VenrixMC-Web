import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { cached, TTL } from "./cache";
import { keys } from "./redis";

export type LiteBansType = "ban" | "mute" | "warn" | "kick";

export type LiteBansRecord = {
  id: number;
  type: LiteBansType;
  uuid: string;
  player: string;
  reason: string | null;
  staff: string | null;
  removedBy: string | null;
  removedReason: string | null;
  time: number; // epoch ms
  until: number | null; // epoch ms, null = permanent / not applicable
  active: boolean;
};

export type LiteBansQuery = {
  player?: string;
  type?: LiteBansType | "all";
  staff?: string;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
  page?: number;
  pageSize?: number;
};

const DATABASE_URL = process.env.LITEBANS_DATABASE_URL;
const TABLE_PREFIX = process.env.LITEBANS_TABLE_PREFIX ?? "litebans_";

// Basic guard: the prefix is interpolated into SQL identifiers below, so
// only allow the characters a real MySQL table-name fragment can contain.
const SAFE_PREFIX = /^[a-zA-Z0-9_]*$/.test(TABLE_PREFIX) ? TABLE_PREFIX : "litebans_";

export function isLiteBansConfigured(): boolean {
  return Boolean(DATABASE_URL);
}

// This server shows players a formatted ban code instead of the raw
// litebans_bans.id — a letter prefix + the id zero-padded (e.g. id 6494 →
// "F06494"). Both parts are configurable in case the format changes.
const BAN_ID_PREFIX = (process.env.LITEBANS_BAN_ID_PREFIX ?? "F").toUpperCase();
const BAN_ID_PAD = Number(process.env.LITEBANS_BAN_ID_PAD ?? "5");

/** Formats a raw litebans_bans.id the way it's shown to players (e.g. "F06494"). */
export function formatBanDisplayId(id: number): string {
  return `${BAN_ID_PREFIX}${String(id).padStart(BAN_ID_PAD, "0")}`;
}

/**
 * Parses a player-facing ban code (e.g. "F06494", also accepts a bare
 * numeric id like "6494") back into the numeric litebans_bans.id. Returns
 * null if the code doesn't look like a valid ban id in either form.
 */
export function parseBanDisplayId(code: string): number | null {
  const trimmed = code.trim().toUpperCase();
  const withoutPrefix = trimmed.startsWith(BAN_ID_PREFIX)
    ? trimmed.slice(BAN_ID_PREFIX.length)
    : trimmed;

  if (!/^\d+$/.test(withoutPrefix)) return null;
  const id = Number(withoutPrefix);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Accept both a plain mysql:// URI and a Java/JDBC-style "jdbc:mysql://..."
// URL (common in hosting-panel database credential pages) by stripping the
// "jdbc:" prefix if present.
const NORMALIZED_URL = DATABASE_URL?.replace(/^jdbc:/, "");

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      uri: NORMALIZED_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

// LiteBans stores only the offending player's UUID on ban/mute/warn/kick
// rows — the human-readable name has to be resolved from litebans_history
// (name/IP snapshots taken on join), keyed to whichever name was seen most
// recently for that UUID.
const LATEST_NAME_JOIN = (t: string) => `
  LEFT JOIN (
    SELECT h1.uuid, h1.name
    FROM ${SAFE_PREFIX}history h1
    INNER JOIN (
      SELECT uuid, MAX(date) AS max_date FROM ${SAFE_PREFIX}history GROUP BY uuid
    ) h2 ON h1.uuid = h2.uuid AND h1.date = h2.max_date
  ) history ON history.uuid = ${t}.uuid
`;

type TableConfig = {
  type: LiteBansType;
  table: string;
  hasUntil: boolean;
  hasRemoved: boolean;
};

const TABLES: TableConfig[] = [
  { type: "ban", table: `${SAFE_PREFIX}bans`, hasUntil: true, hasRemoved: true },
  { type: "mute", table: `${SAFE_PREFIX}mutes`, hasUntil: true, hasRemoved: true },
  { type: "warn", table: `${SAFE_PREFIX}warnings`, hasUntil: false, hasRemoved: true },
  { type: "kick", table: `${SAFE_PREFIX}kicks`, hasUntil: false, hasRemoved: false },
];

function selectForTable(cfg: TableConfig): string {
  const t = cfg.table;
  return `
    SELECT
      ${t}.id AS id,
      '${cfg.type}' AS type,
      ${t}.uuid AS uuid,
      COALESCE(history.name, ${t}.uuid) AS player,
      ${t}.reason AS reason,
      ${t}.banned_by_name AS staff,
      ${cfg.hasRemoved ? `${t}.removed_by_name` : "NULL"} AS removedBy,
      ${cfg.hasRemoved ? `${t}.removed_by_reason` : "NULL"} AS removedReason,
      ${t}.time AS time,
      ${cfg.hasUntil ? `${t}.until` : "NULL"} AS until,
      ${cfg.hasUntil ? `${t}.active` : "1"} AS active
    FROM ${t}
    ${LATEST_NAME_JOIN(t)}
    WHERE
      (? IS NULL OR history.name LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR ${t}.banned_by_name LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR ${t}.time >= ?)
      AND (? IS NULL OR ${t}.time <= ?)
  `;
}

function toEpochMs(dateStr: string | undefined, endOfDay = false): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Queries the LiteBans plugin's own MySQL tables directly (bans, mutes,
 * warnings, kicks) — this is the same database the LiteBans plugin writes
 * to on the Minecraft server, connected to read-only via LITEBANS_DATABASE_URL.
 * Results are cached in Redis for 1 minute. Returns an empty page (not an
 * error) when LiteBans isn't configured or the query fails, so callers can
 * degrade gracefully.
 */
export async function fetchLiteBansRecords(
  query: LiteBansQuery
): Promise<{ records: LiteBansRecord[]; total: number; totalPages: number }> {
  if (!isLiteBansConfigured()) return { records: [], total: 0, totalPages: 1 };

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, query.pageSize ?? 25);
  const cacheKey = keys.cache("litebans", JSON.stringify({ ...query, page, pageSize }));

  return cached(cacheKey, TTL.LITEBANS, async () => {
    const player = query.player?.trim() || null;
    const staff = query.staff?.trim() || null;
    const from = toEpochMs(query.from);
    const to = toEpochMs(query.to, true);

    const tables = query.type && query.type !== "all" ? TABLES.filter((t) => t.type === query.type) : TABLES;

    const selects = tables.map(selectForTable);
    const params: unknown[] = [];
    // Each table's WHERE clause repeats the same 4 filter pairs.
    for (let i = 0; i < tables.length; i++) {
      params.push(player, player, staff, staff, from, from, to, to);
    }

    const unionSql = selects.join(" UNION ALL ");

    try {
      const conn = getPool();

      const [countRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM (${unionSql}) AS combined`,
        params
      );
      const total = Number(countRows[0]?.total ?? 0);

      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM (${unionSql}) AS combined ORDER BY time DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, (page - 1) * pageSize]
      );

      const records: LiteBansRecord[] = rows.map((r) => ({
        id: Number(r.id),
        type: r.type,
        uuid: String(r.uuid),
        player: String(r.player),
        reason: r.reason,
        staff: r.staff,
        removedBy: r.removedBy,
        removedReason: r.removedReason,
        time: Number(r.time),
        // LiteBans scrive until = 0 per le sanzioni permanenti: va trattato
        // come null, altrimenti il sito le mostrerebbe come "Scaduta".
        until: r.until === null || r.until === undefined || Number(r.until) <= 0 ? null : Number(r.until),
        active: Boolean(r.active),
      }));

      return { records, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[litebans] query failed:", err);
      return { records: [], total: 0, totalPages: 1 };
    }
  });
}

/** Direct lookup of a single ban by its numeric LiteBans ID (litebans_bans.id). */
export async function getBanById(id: number): Promise<LiteBansRecord | null> {
  if (!isLiteBansConfigured()) return null;

  const cacheKey = keys.cache("litebans-ban", id);

  return cached(cacheKey, TTL.LITEBANS, async () => {
    const t = `${SAFE_PREFIX}bans`;
    try {
      const conn = getPool();
      const [rows] = await conn.query<RowDataPacket[]>(
        `
        SELECT
          ${t}.id AS id, 'ban' AS type, ${t}.uuid AS uuid,
          COALESCE(history.name, ${t}.uuid) AS player,
          ${t}.reason AS reason, ${t}.banned_by_name AS staff,
          ${t}.removed_by_name AS removedBy, ${t}.removed_by_reason AS removedReason,
          ${t}.time AS time, ${t}.until AS until, ${t}.active AS active
        FROM ${t}
        ${LATEST_NAME_JOIN(t)}
        WHERE ${t}.id = ?
        LIMIT 1
        `,
        [id]
      );
      const r = rows[0];
      if (!r) return null;
      return {
        id: Number(r.id),
        type: "ban",
        uuid: String(r.uuid),
        player: String(r.player),
        reason: r.reason,
        staff: r.staff,
        removedBy: r.removedBy,
        removedReason: r.removedReason,
        time: Number(r.time),
        // until = 0 significa permanente in LiteBans (vedi sopra).
        until: r.until === null || r.until === undefined || Number(r.until) <= 0 ? null : Number(r.until),
        active: Boolean(r.active),
      } satisfies LiteBansRecord;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[litebans] getBanById failed:", err);
      return null;
    }
  });
}

/** Looks up a ban by the code shown to players (e.g. "F06494"). */
export async function getBanByDisplayId(code: string): Promise<LiteBansRecord | null> {
  const id = parseBanDisplayId(code);
  if (id === null) return null;
  return getBanById(id);
}
