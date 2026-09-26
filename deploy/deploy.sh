#!/usr/bin/env bash
# Manual deploy: rsyncs the project to the server, then builds and restarts
# the Docker stack there over SSH. Run this from your own machine (Git Bash
# on Windows works fine) whenever you want to publish a change.
#
# Usage: bash deploy/deploy.sh
#
# First time: copy deploy/deploy.config.sh.example -> deploy/deploy.config.sh
# and fill in your server details. Also see DEPLOY.md for one-time server
# setup (Docker, Nginx, .env) that this script assumes is already done.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

CONFIG_FILE="deploy/deploy.config.sh"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Missing $CONFIG_FILE — copy deploy/deploy.config.sh.example to it and fill in your server details first."
  exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_FILE"

for var in SERVER_USER SERVER_HOST SERVER_PORT SERVER_PATH; do
  if [[ -z "${!var:-}" ]]; then
    echo "deploy.config.sh is missing $var."
    exit 1
  fi
done

SSH_TARGET="${SERVER_USER}@${SERVER_HOST}"
# Chiave dedicata opzionale (SSH_KEY in deploy.config.sh): senza, ssh usa le
# chiavi di default o chiede la password.
SSH_CMD="ssh -p ${SERVER_PORT}"
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_CMD="${SSH_CMD} -i ${SSH_KEY} -o IdentitiesOnly=yes"
fi

echo "==> Syncing files to ${SSH_TARGET}:${SERVER_PATH}"
if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete \
    --exclude-from=deploy/rsync-exclude.txt \
    -e "${SSH_CMD}" \
    ./ "${SSH_TARGET}:${SERVER_PATH}/"
else
  # Git Bash su Windows non ha rsync: si manda un tar sullo stesso canale SSH.
  # Stesse esclusioni (.env del server compreso), ma niente --delete: i file
  # rimossi in locale restano sul server finche non li si cancella a mano.
  echo "    (rsync non trovato, uso tar su ssh)"
  tar -czf - --exclude-from=deploy/rsync-exclude.txt . \
    | ${SSH_CMD} "${SSH_TARGET}" "mkdir -p '${SERVER_PATH}' && tar -xzf - -C '${SERVER_PATH}'"
fi

echo "==> Building and restarting the stack on the server"
# shellcheck disable=SC2029
${SSH_CMD} "${SSH_TARGET}" bash -s <<EOF
set -euo pipefail
cd "${SERVER_PATH}"

if [[ ! -f .env ]]; then
  echo "No .env found on the server at ${SERVER_PATH}/.env — copy .env.production.example there and fill it in first."
  exit 1
fi

# `migrate` va buildato esplicitamente insieme ad `app`: `compose run` non
# ribuilda da solo e riuserebbe l'immagine del deploy precedente, che contiene
# la vecchia cartella prisma/migrations. Il risultato e un "No pending
# migrations to apply" rassicurante mentre la migrazione nuova resta a terra.
docker compose -f docker-compose.prod.yml build app migrate
docker compose -f docker-compose.prod.yml up -d mysql redis
# </dev/null: lo script arriva a bash su stdin, e senza questo `run` se lo
# mangia — i comandi dopo non partono e il deploy sembra riuscito lo stesso.
docker compose -f docker-compose.prod.yml run --rm -T migrate </dev/null
docker compose -f docker-compose.prod.yml up -d app
docker image prune -f
EOF

echo "==> Done. Tail logs with: ssh -p ${SERVER_PORT} ${SSH_TARGET} 'cd ${SERVER_PATH} && docker compose -f docker-compose.prod.yml logs -f app'"
