# VPS PostgreSQL Setup for DealOS (Production-Safe, Idempotent)

This runbook provisions a dedicated DealOS database and user on your **existing VPS PostgreSQL** instance (single source of truth), with secure remote access controls.

## Generated artifacts

- SQL provisioning script: [scripts/setup_dealos_database.sql](/Users/macgr/DealOS/scripts/setup_dealos_database.sql)
- Remote hardening script: [scripts/setup_postgres_remote.sh](/Users/macgr/DealOS/scripts/setup_postgres_remote.sh)

---

## What this setup does

1. Creates (if missing):
   - Database: `dealos`
   - User: `dealos_user`
2. Generates a strong password (32-byte hex) if one is not already present.
3. Stores credentials in `/root/dealos_db_credentials.env` with mode `600`.
4. Enforces least-privilege role attributes:
   - `NOSUPERUSER`
   - `NOCREATEDB`
   - `NOCREATEROLE`
   - `NOINHERIT`
   - `NOREPLICATION`
5. Grants only required DB privileges for app + migrations:
   - DB connect/temp on `dealos`
   - `USAGE, CREATE` on `public` schema in `dealos`
6. Hardens PostgreSQL remote access:
   - `password_encryption = scram-sha-256`
   - `ssl = on`
   - `ssl_min_protocol_version = TLSv1.2`
   - Scoped `hostssl` entry in `pg_hba.conf` for app CIDR only
7. Backs up `postgresql.conf` and `pg_hba.conf` before editing.

---

## Prerequisites on VPS

- PostgreSQL already installed and running.
- Shell access with `sudo` (root preferred).
- `openssl` available.

---

## Execution commands (do not run from this document unless ready)

From repository root:

```bash
chmod +x scripts/setup_postgres_remote.sh
sudo ALLOWED_APP_CIDR="YOUR_APP_SERVER_PUBLIC_IP/32" \
     LISTEN_ADDRESSES="127.0.0.1,YOUR_POSTGRES_VPS_PRIVATE_OR_PUBLIC_IP" \
     ./scripts/setup_postgres_remote.sh
```

Optional overrides:

```bash
sudo ALLOWED_APP_CIDR="203.0.113.10/32" \
     LISTEN_ADDRESSES="127.0.0.1,10.0.0.12" \
     POSTGRES_SUPERUSER="postgres" \
     DEALOS_DB="dealos" \
     DEALOS_DB_USER="dealos_user" \
     DEALOS_DB_PASSWORD="OVERRIDE_WITH_YOUR_STRONG_PASSWORD" \
     ./scripts/setup_postgres_remote.sh
```

---

## Idempotency guarantees

- Re-running scripts does **not** duplicate role or database.
- Managed `pg_hba.conf` block is replaced in-place (single block only).
- Password is stable across reruns unless you explicitly override `DEALOS_DB_PASSWORD`.
- Config backups are timestamped on each run.

---

## Validation commands

Run on PostgreSQL VPS:

```bash
sudo -u postgres psql -X -c "\du dealos_user"
sudo -u postgres psql -X -c "\l+ dealos"
sudo -u postgres psql -X -d dealos -c "\dn+ public"
sudo -u postgres psql -X -c "SHOW password_encryption;"
sudo -u postgres psql -X -c "SHOW ssl;"
sudo -u postgres psql -X -c "SHOW ssl_min_protocol_version;"
```

Connectivity test from app host:

```bash
psql "postgresql://dealos_user:<PASSWORD>@<POSTGRES_HOST>:5432/dealos?sslmode=require" -c "SELECT now();"
```

---

## Security notes

- Keep `ALLOWED_APP_CIDR` as narrow as possible (`/32` preferred).
- Never commit `/root/dealos_db_credentials.env`.
- Prefer private networking between app and DB when possible.
- Combine this with VPS firewall rules (allow 5432 only from app host CIDR).
- Rotate `DEALOS_DB_PASSWORD` periodically by re-running script with override.

---

## Rollback

If you need to revert config changes:

1. Restore latest backups created by script:
   - `<postgresql.conf>.bak.<timestamp>`
   - `<pg_hba.conf>.bak.<timestamp>`
2. Reload config:

```bash
sudo -u postgres psql -X -c "SELECT pg_reload_conf();"
```

For database/user rollback (destructive, manual approval recommended):

```sql
-- Run as postgres superuser only if rollback is required:
DROP DATABASE IF EXISTS dealos;
DROP ROLE IF EXISTS dealos_user;
```
