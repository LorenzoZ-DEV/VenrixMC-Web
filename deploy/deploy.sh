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

echo "==> Syncing files to ${SSH_TARGET}:${SERVER_PATH}"
rsync -az --delete \
  --exclude-from=deploy/rsync-exclude.txt \
  -e "ssh -p ${SERVER_PORT}" \
  ./ "${SSH_TARGET}:${SERVER_PATH}/"

echo "==> Building and restarting the stack on the server"
# shellcheck disable=SC2029
ssh -p "${SERVER_PORT}" "${SSH_TARGET}" bash -s <<EOF
set -euo pipefail
cd "${SERVER_PATH}"

if [[ ! -f .env ]]; then
  echo "No .env found on the server at ${SERVER_PATH}/.env — copy .env.production.example there and fill it in first."
  exit 1
fi

docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d mysql redis
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d app
docker image prune -f
EOF

echo "==> Done. Tail logs with: ssh -p ${SERVER_PORT} ${SSH_TARGET} 'cd ${SERVER_PATH} && docker compose -f docker-compose.prod.yml logs -f app'"
