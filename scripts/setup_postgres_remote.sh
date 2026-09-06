#!/usr/bin/env bash
set -euo pipefail

# Production-safe, idempotent PostgreSQL hardening + DealOS database bootstrap.
# This script modifies postgresql.conf and pg_hba.conf and then applies SQL setup.
#
# Usage (example):
#   sudo ALLOWED_APP_CIDR="203.0.113.10/32" LISTEN_ADDRESSES="127.0.0.1,10.10.0.5" \
#     ./scripts/setup_postgres_remote.sh
#
# Optional overrides:
#   POSTGRES_SUPERUSER=postgres
#   DEALOS_DB=dealos
#   DEALOS_DB_USER=dealos_user
#   DEALOS_DB_PASSWORD=<strong-password>   # if omitted, generated once and persisted
#   CREDENTIALS_FILE=/root/dealos_db_credentials.env

POSTGRES_SUPERUSER="${POSTGRES_SUPERUSER:-postgres}"
DEALOS_DB="${DEALOS_DB:-dealos}"
DEALOS_DB_USER="${DEALOS_DB_USER:-dealos_user}"
ALLOWED_APP_CIDR="${ALLOWED_APP_CIDR:-}"
LISTEN_ADDRESSES="${LISTEN_ADDRESSES:-127.0.0.1}"
CREDENTIALS_FILE="${CREDENTIALS_FILE:-/root/dealos_db_credentials.env}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SQL_SETUP_FILE="${SCRIPT_DIR}/setup_dealos_database.sql"

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: run as root (or via sudo)." >&2
  exit 1
fi

if [[ -z "${ALLOWED_APP_CIDR}" ]]; then
  echo "ERROR: ALLOWED_APP_CIDR is required (example: 203.0.113.10/32)." >&2
  exit 1
fi

if [[ ! -f "${SQL_SETUP_FILE}" ]]; then
  echo "ERROR: SQL setup file not found at ${SQL_SETUP_FILE}" >&2
  exit 1
fi

if [[ -f "${CREDENTIALS_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${CREDENTIALS_FILE}"
fi

if [[ -z "${DEALOS_DB_PASSWORD:-}" ]]; then
  DEALOS_DB_PASSWORD="$(openssl rand -hex 32)"
fi

install -m 600 /dev/null "${CREDENTIALS_FILE}"
cat > "${CREDENTIALS_FILE}" <<EOF
DEALOS_DB=${DEALOS_DB}
DEALOS_DB_USER=${DEALOS_DB_USER}
DEALOS_DB_PASSWORD=${DEALOS_DB_PASSWORD}
ALLOWED_APP_CIDR=${ALLOWED_APP_CIDR}
LISTEN_ADDRESSES=${LISTEN_ADDRESSES}
EOF
chmod 600 "${CREDENTIALS_FILE}"

PSQL_BASE=(sudo -u "${POSTGRES_SUPERUSER}" psql -X -v ON_ERROR_STOP=1 -qAt)

CONFIG_FILE="$("${PSQL_BASE[@]}" -c "SHOW config_file;")"
HBA_FILE="$("${PSQL_BASE[@]}" -c "SHOW hba_file;")"

if [[ -z "${CONFIG_FILE}" || -z "${HBA_FILE}" ]]; then
  echo "ERROR: unable to discover PostgreSQL config paths." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d%H%M%S)"
cp -a "${CONFIG_FILE}" "${CONFIG_FILE}.bak.${timestamp}"
cp -a "${HBA_FILE}" "${HBA_FILE}.bak.${timestamp}"

if grep -Eiq "^[[:space:]]*hostssl?[[:space:]]+all[[:space:]]+all[[:space:]]+(0\\.0\\.0\\.0/0|::/0)[[:space:]]+(trust|md5|password|scram-sha-256)[[:space:]]*$" "${HBA_FILE}"; then
  echo "ERROR: insecure broad pg_hba rule detected (all/all from 0.0.0.0/0 or ::/0)." >&2
  echo "Refusing to continue. Remove broad rules first, then rerun." >&2
  exit 1
fi

set_conf_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -Eq "^[[:space:]]*#?[[:space:]]*${key}[[:space:]]*=" "${file}"; then
    sed -Ei "s|^[[:space:]]*#?[[:space:]]*(${key})[[:space:]]*=.*|\\1 = '${value}'|g" "${file}"
  else
    printf "\n%s = '%s'\n" "${key}" "${value}" >> "${file}"
  fi
}

set_conf_value "${CONFIG_FILE}" "listen_addresses" "${LISTEN_ADDRESSES}"
set_conf_value "${CONFIG_FILE}" "password_encryption" "scram-sha-256"
set_conf_value "${CONFIG_FILE}" "ssl" "on"
set_conf_value "${CONFIG_FILE}" "ssl_min_protocol_version" "TLSv1.2"
set_conf_value "${CONFIG_FILE}" "log_connections" "on"
set_conf_value "${CONFIG_FILE}" "log_disconnections" "on"
set_conf_value "${CONFIG_FILE}" "log_line_prefix" "%m [%p] %u@%d %r "

tmp_hba="$(mktemp)"
awk '
  BEGIN {skip=0}
  /^# BEGIN DEALOS MANAGED BLOCK$/ {skip=1; next}
  /^# END DEALOS MANAGED BLOCK$/ {skip=0; next}
  skip==0 {print}
' "${HBA_FILE}" > "${tmp_hba}"

cat >> "${tmp_hba}" <<EOF

# BEGIN DEALOS MANAGED BLOCK
# Allow TLS-only client auth for DealOS app host/network.
hostssl ${DEALOS_DB} ${DEALOS_DB_USER} ${ALLOWED_APP_CIDR} scram-sha-256
# END DEALOS MANAGED BLOCK
EOF

install -m 600 "${tmp_hba}" "${HBA_FILE}"
rm -f "${tmp_hba}"

# Reload PostgreSQL config.
sudo -u "${POSTGRES_SUPERUSER}" psql -X -v ON_ERROR_STOP=1 -c "SELECT pg_reload_conf();"

# Apply idempotent database+role setup.
sudo -u "${POSTGRES_SUPERUSER}" psql -X -v ON_ERROR_STOP=1 \
  -v dealos_password="${DEALOS_DB_PASSWORD}" \
  -f "${SQL_SETUP_FILE}"

echo "Done."
echo "Credentials saved to ${CREDENTIALS_FILE} (mode 600)."
echo "Database: ${DEALOS_DB}"
echo "User: ${DEALOS_DB_USER}"
