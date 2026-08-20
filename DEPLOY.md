# Deploy — VenrixMC

Stack di produzione: 3 container Docker (app Next.js + MySQL + Redis, tutti
sulla stessa rete privata) dietro un Nginx installato direttamente sul VPS,
che fa da reverse proxy e termina l'SSL. Il deploy è manuale: lanci
`deploy/deploy.sh` dal tuo PC quando vuoi pubblicare, non c'è nessuna CI/CD.

## 1. Setup del VPS (una tantum)

Sul server (Ubuntu/Debian):

```bash
# Docker + plugin compose
curl -fsSL https://get.docker.com | sh

# Nginx + certbot per l'SSL
apt update && apt install -y nginx certbot python3-certbot-nginx

mkdir -p /opt/venrixmc-website
```

Punta il DNS del dominio (es. `venrixmc.uk`) all'IP del VPS prima di
continuare (serve per certbot).

## 2. Config sul server

```bash
cd /opt/venrixmc-website
cp .env.production.example .env   # dopo il primo rsync, vedi passo 3
nano .env                          # riempi con valori veri (password, SESSION_SECRET, ecc.)
```

`SESSION_SECRET` va generato con `openssl rand -base64 32`. Non riusare mai
il valore di sviluppo.

## 3. Primo deploy dal tuo PC

```bash
cp deploy/deploy.config.sh.example deploy/deploy.config.sh
nano deploy/deploy.config.sh   # SERVER_HOST, SERVER_USER, SERVER_PATH, porta SSH
bash deploy/deploy.sh
```

Lo script:
1. sincronizza i file (rsync, esclude `node_modules`/`.next`/segreti — vedi
   `deploy/rsync-exclude.txt`) sul server;
2. builda l'immagine Docker dell'app;
3. avvia MySQL e Redis;
4. applica le migrazioni Prisma (`prisma migrate deploy`) in un container
   usa-e-getta;
5. avvia/riavvia l'app;
6. pulisce le immagini Docker vecchie.

Se il primo `deploy.sh` fallisce perché `.env` non esiste ancora sul server,
è normale: i file arrivano col primo rsync, quindi rifai il passo 2 dopo la
prima esecuzione (anche parziale) dello script, poi rilancialo.

## 4. Nginx + SSL

```bash
cp deploy/nginx.conf.example /etc/nginx/sites-available/venrixmc
nano /etc/nginx/sites-available/venrixmc   # correggi server_name
ln -s /etc/nginx/sites-available/venrixmc /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

certbot --nginx -d venrixmc.uk -d www.venrixmc.uk
```

Certbot riscrive il file aggiungendo i certificati e il redirect HTTP→HTTPS,
e configura il rinnovo automatico da solo.

## 5. Deploy successivi

Ogni volta che vuoi pubblicare una modifica:

```bash
bash deploy/deploy.sh
```

Nessun altro passaggio manuale, a meno che tu non abbia cambiato variabili
in `.env` sul server (in quel caso modificale lì prima di rilanciare) o una
delle `NEXT_PUBLIC_*` (quelle richiedono comunque un rebuild dell'immagine,
che `deploy.sh` fa già sempre).

## Comandi utili sul server

```bash
cd /opt/venrixmc-website

# log dell'app in tempo reale
docker compose -f docker-compose.prod.yml logs -f app

# stato dei container
docker compose -f docker-compose.prod.yml ps

# shell dentro il container dell'app
docker compose -f docker-compose.prod.yml exec app sh

# riavvio rapido senza rebuildare
docker compose -f docker-compose.prod.yml restart app
```

## Rollback

Non c'è versioning automatico delle immagini. Per tornare indietro: sul tuo
PC fai `git checkout` (o ripristina i file) alla versione precedente, poi
rilancia `bash deploy/deploy.sh` — rsync + rebuild riportano il server a
quello stato.

## Note

- MySQL e Redis **non** sono esposti fuori dal server: solo l'app lo è, e
  solo su `127.0.0.1:3000` (Nginx ci arriva da lì, internet no).
- `REDIS_MOCK` deve restare `false` in produzione — l'app stampa un warning
  se non lo è.
- L'integrazione LiteBans (`LITEBANS_DATABASE_URL`) punta al database del
  plugin sul server Minecraft, non a quello dell'app: è un host/DB diverso,
  vedi commenti in `.env.production.example`.
