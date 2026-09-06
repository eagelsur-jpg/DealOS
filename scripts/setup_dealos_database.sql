\set ON_ERROR_STOP on

-- Required psql variable:
--   -v dealos_password='strong-password'
\if :{?dealos_password}
\else
  \echo 'ERROR: missing required variable dealos_password'
  \echo 'Usage: psql -v dealos_password=<strong-password> -f scripts/setup_dealos_database.sql'
  \quit 1
\endif

\set dealos_db 'dealos'
\set dealos_user 'dealos_user'

\echo 'Ensuring role exists with least-privilege role attributes...'
SELECT format(
  'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION',
  :'dealos_user',
  :'dealos_password'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'dealos_user'
);
\gexec

-- Idempotently enforce role attributes and password.
SELECT format(
  'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION',
  :'dealos_user',
  :'dealos_password'
);
\gexec

\echo 'Ensuring database exists and is owned by dealos_user...'
SELECT format(
  'CREATE DATABASE %I OWNER %I TEMPLATE template0 ENCODING ''UTF8''',
  :'dealos_db',
  :'dealos_user'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = :'dealos_db'
);
\gexec

SELECT format('ALTER DATABASE %I OWNER TO %I', :'dealos_db', :'dealos_user');
\gexec

\echo 'Restricting connect privileges on database level...'
SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'dealos_db');
\gexec

SELECT format('GRANT CONNECT, TEMPORARY ON DATABASE %I TO %I', :'dealos_db', :'dealos_user');
\gexec

-- Explicitly keep role out of built-in databases.
SELECT format('REVOKE CONNECT ON DATABASE postgres FROM %I', :'dealos_user');
\gexec

\echo 'Configuring schema and default privileges inside target database...'
\connect :dealos_db

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE USAGE ON SCHEMA public FROM PUBLIC;
SELECT format('GRANT USAGE, CREATE ON SCHEMA public TO %I', :'dealos_user');
\gexec

SELECT format('ALTER ROLE %I IN DATABASE %I SET search_path = public', :'dealos_user', :'dealos_db');
\gexec
SELECT format('ALTER ROLE %I IN DATABASE %I SET timezone = ''UTC''', :'dealos_user', :'dealos_db');
\gexec
SELECT format('ALTER ROLE %I IN DATABASE %I SET statement_timeout = ''30s''', :'dealos_user', :'dealos_db');
\gexec
SELECT format(
  'ALTER ROLE %I IN DATABASE %I SET idle_in_transaction_session_timeout = ''30s''',
  :'dealos_user',
  :'dealos_db'
);
\gexec

\echo 'Database and role setup completed successfully.'
