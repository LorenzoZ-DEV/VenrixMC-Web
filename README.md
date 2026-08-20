# VenrixMC — Website

Sito ufficiale del server Minecraft **VenrixMC**. Next.js 14 (App Router) + TypeScript +
Tailwind CSS, MySQL via Prisma, sessioni/cache/rate-limiting su Redis.

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Database:** MySQL via Prisma ORM
- **Cache/Sessioni/Rate limiting:** Redis (ioredis)
- **Auth:** sessione custom con `iron-session` (cookie sigillato, opaco) + payload sessione
  salvato in Redis con TTL 24h (`src/lib/session.ts`)
- **Validazione:** Zod
- **Password hashing:** bcryptjs

## Struttura del progetto

```
venrixmc-website/
├── prisma/
│   ├── schema.prisma        # Modelli MySQL (User, News, Appeal, StaffApply, StaffPosition, AuditLog, SiteSettings)
│   └── seed.ts               # Utenti demo + regolamento/impostazioni iniziali
├── public/imgs/               # Tutte le risorse grafiche (/imgs/nomefile.ext)
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Home
│   │   ├── news/                        # Lista + dettaglio news
│   │   ├── rules/                       # Regolamento (contenuto da DB, cache 1h)
│   │   ├── appeals/                     # Form ban appeal (rate limit 3/h per IP)
│   │   ├── staff-apply/                 # Form candidatura staff (rate limit 3/h per IP)
│   │   ├── login/                       # Login staff
│   │   ├── debug/                       # Debug mode con dati mock (Staff+/Developer)
│   │   ├── dashboard/                   # Area riservata per ruolo
│   │   │   ├── layout.tsx               # Guardia sessione + Sidebar
│   │   │   ├── page.tsx                 # Overview/statistiche
│   │   │   ├── appeals/                 # Staff+
│   │   │   ├── applications/            # Head+
│   │   │   ├── positions/               # Head+ (apri/chiudi posizioni, gestisci posti)
│   │   │   ├── news/                    # Admin+
│   │   │   ├── rules/                   # Admin+
│   │   │   ├── users/                   # Admin+
│   │   │   ├── audit-log/               # Admin+
│   │   │   ├── settings/                # Developer (colori, social, toggle sezioni)
│   │   │   └── profile/                 # Chiunque loggato: credenziali + link Discord
│   │   └── api/
│   │       ├── auth/login|logout        # Login/logout con sessione Redis
│   │       ├── auth/discord/start|callback  # OAuth2 Discord per il collegamento profilo
│   │       ├── profile[...]             # Self-service: cambio credenziali, unlink Discord
│   │       ├── players                  # Proxy mcsrvstat.us (cache 30s)
│   │       ├── news[...]                # CRUD news (Admin+), cache 5min
│   │       ├── appeals[...]             # Submit pubblico + gestione staff
│   │       ├── staff-apply[...]         # Submit pubblico + gestione Head+
│   │       ├── staff-positions[...]     # CRUD posizioni staff (Head+), cache 5min
│   │       ├── users[...]               # CRUD utenti (Admin+)
│   │       ├── rules                    # Aggiorna regolamento (Admin+)
│   │       ├── settings                 # Variabili globali (Developer)
│   │       ├── litebans                 # Query dirette al DB LiteBans (opzionale, cache 1min)
│   │       └── stats                    # Statistiche dashboard (cache 5min)
│   ├── components/            # Navbar, Footer, CopyIP, PlayerCount, DiscordWidget,
│   │                           # NewsCard, Pagination, forms/*, dashboard/*, ui/*
│   ├── lib/
│   │   ├── prisma.ts           # Singleton Prisma Client
│   │   ├── redis.ts            # Singleton ioredis (o shim in-memory, vedi sotto) + naming chiavi venrix:*
│   │   ├── memoryRedis.ts      # Shim in-memory per bypassare Redis in sviluppo (REDIS_MOCK=true)
│   │   ├── session.ts          # Sessioni iron-session + Redis (TTL 24h)
│   │   ├── auth.ts             # RBAC (requireApiRole, hasRole)
│   │   ├── cache.ts            # Helper cache read-through + invalidazione
│   │   ├── rateLimit.ts        # Rate limiting Redis (fixed window)
│   │   ├── lock.ts             # Lock distribuito (SET NX PX) anti double-submit
│   │   ├── pubsub.ts           # Redis Pub/Sub per notifiche real-time staff
│   │   ├── litebans.ts         # Query dirette al DB MySQL di LiteBans via mysql2 (cache 1min)
│   │   ├── mcsrvstat.ts        # Client mcsrvstat.us (cache 30s)
│   │   ├── discord.ts          # Client Discord widget.json
│   │   ├── discordOAuth.ts     # OAuth2 Discord (authorize URL, exchange code, fetch user)
│   │   ├── news.ts / settings.ts / audit.ts / validators.ts / constants.ts
│   └── middleware.ts          # Redirect edge-level per /dashboard e /debug
├── docker-compose.yml         # MySQL + Redis per sviluppo locale
└── .env.example
```

## Setup — passo per passo

### 1. Installare le dipendenze

```bash
npm install
# oppure
pnpm install
```

### 2. Avviare MySQL e Redis (sviluppo locale)

```bash
docker compose up -d
```

Questo avvia MySQL (`localhost:3306`, db `venrixmc`, utente `venrix`/`venrix`) e Redis
(`localhost:6379`). In alternativa puoi usare istanze cloud (PlanetScale, Upstash, ecc.).

### 3. Configurare le variabili d'ambiente

```bash
cp .env.example .env
```

Poi valorizza almeno:

- `DATABASE_URL` — connessione MySQL
- `REDIS_URL` — connessione Redis
- `SESSION_SECRET` — genera con `openssl rand -base64 32`
- `NEXT_PUBLIC_SERVER_IP` — IP del server (default `play.venrixmc.uk`)
- `NEXT_PUBLIC_STORE_URL` — URL dello store
- `NEXT_PUBLIC_DISCORD_SERVER_ID` — Guild ID Discord (serve il "Server Widget" attivo)
- `LITEBANS_DATABASE_URL` — opzionale: connessione **diretta** (sola lettura) al database MySQL
  del plugin LiteBans sul server Minecraft (database separato da `DATABASE_URL`). Se vuota,
  l'integrazione resta disattivata e il pannello mostra "LiteBans non configurato".
- `LITEBANS_TABLE_PREFIX` — prefisso tabelle LiteBans, default `litebans_` (cambialo solo se
  l'hai personalizzato nella config del plugin)
- `LITEBANS_BAN_ID_PREFIX` / `LITEBANS_BAN_ID_PAD` — il Ban ID mostrato ai giocatori (es. nel
  form Appeals) è un codice formattato — lettera + id numerico con zeri davanti (es. `F06494`
  per l'id `6494`) — non l'id grezzo di `litebans_bans`. Questi due valori controllano
  rispettivamente la lettera (default `F`) e il numero di cifre del padding (default `5`);
  regolali se il formato usato dal tuo server è diverso.
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — opzionali, per il collegamento account Discord
  da `/dashboard/profile`. Crea un'app su
  [discord.com/developers/applications](https://discord.com/developers/applications), aggiungi
  nelle impostazioni OAuth2 il redirect `{APP_URL}/api/auth/discord/callback` (deve combaciare
  esattamente, es. `http://localhost:3000/api/auth/discord/callback` in sviluppo) e copia qui
  Client ID e Client Secret. Se vuoti, il pulsante "Collega con Discord" resta disattivato.

### 4. Migrazioni Prisma su MySQL

```bash
npm run prisma:migrate      # crea le tabelle (dev)
npm run db:seed             # utenti demo + regolamento iniziale
```

Utenti creati dal seed (**da cambiare in produzione**):

| Ruolo     | Email                | Password         |
|-----------|-----------------------|-------------------|
| DEVELOPER | dev@venrixmc.uk        | VenrixDev123!     |
| ADMIN     | admin@venrixmc.uk      | VenrixAdmin123!   |

In produzione esegui invece `npm run prisma:deploy` (applica le migrazioni senza prompt
interattivi).

### 4bis. Sviluppare senza Redis (opzionale)

Se non vuoi tenere su Docker/Redis mentre sviluppi, imposta nel `.env`:

```
REDIS_MOCK="true"
```

Sessioni, cache, rate limiting, lock distribuito e pub/sub continuano a funzionare
esattamente allo stesso modo, ma appoggiandosi a uno store **in memoria del processo**
Node (`src/lib/memoryRedis.ts`) invece che a un vero Redis. Serve solo per lo sviluppo:
i dati si perdono ad ogni riavvio e non sono condivisi tra più istanze — **non
impostarlo mai in produzione** (viene anche stampato un warning se `NODE_ENV=production`).
MySQL resta comunque necessario: se non hai Prisma/MySQL disponibili, solo le pagine e
le API che non toccano il database (es. login form, contatore giocatori, rate limit)
funzioneranno.

### 5. Avviare in sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

### 6. Build di produzione

```bash
npm run build
npm run start
```

Per il deploy vero e proprio (Docker su VPS + Nginx/SSL + script di
pubblicazione) vedi [DEPLOY.md](./DEPLOY.md).

## Note architetturali

- **Sessioni:** il cookie del browser contiene solo un id di sessione sigillato
  (`iron-session`); i dati reali (userId, ruolo) vivono in Redis
  (`venrix:session:{id}`, TTL 24h scorrevole) — così un cambio ruolo o un ban possono
  invalidare la sessione istantaneamente cancellando la chiave Redis.
- **Cache:** ogni query costosa passa da `cached()` (`src/lib/cache.ts`), che legge/scrive
  su Redis con TTL dedicati (news 5min, regolamento 1h, statistiche 5min, LiteBans 1min,
  conteggi candidature 2min). Le mutazioni invalidano il prefisso `venrix:cache:{entity}:*`.
- **Rate limiting:** `src/lib/rateLimit.ts` implementa un fixed-window counter Redis,
  usato su login, appeals (3/h per IP) e staff-apply (3/h per IP).
- **Lock distribuito:** `src/lib/lock.ts` usa `SET NX PX` + script Lua per il rilascio
  sicuro, per evitare submit duplicati sugli endpoint pubblici.
- **Pub/Sub:** ogni nuovo appeal/candidatura pubblica un evento su Redis
  (`venrix:events:new-appeal`, `venrix:events:new-application`) per un futuro pannello
  staff realtime (es. WebSocket/SSE che si sottoscrive con `subscribe()`).
- **RBAC:** i ruoli sono gerarchici (`STAFF < HEAD < ADMIN < DEVELOPER`,
  `src/lib/auth.ts`). Le route API usano `requireApiRole(minRole)`, le pagine dashboard
  usano `requireDashboardRole(minRole)`.
- **Middleware:** a livello edge controlla solo la presenza del cookie di sessione (Redis
  non è raggiungibile dall'Edge Runtime); l'autenticazione/autorizzazione reale avviene
  server-side in ogni layout/route.

## Docker Compose (sviluppo)

Il file `docker-compose.yml` fornisce MySQL 8 e Redis 7 con volumi persistenti, pensato
solo per lo sviluppo locale (password di default). Per la produzione c'è uno stack
Docker separato (`docker-compose.prod.yml`, app inclusa) — vedi [DEPLOY.md](./DEPLOY.md).
