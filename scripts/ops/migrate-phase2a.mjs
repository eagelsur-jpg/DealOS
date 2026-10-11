// Apply only the reviewed pending migration after exact non-destructive preflight.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, chmodSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = '/root/DealOS';
const require = createRequire(`${root}/packages/database/package.json`);
require('dotenv').config({ path: `${root}/.env.local`, override: false });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ log: [] });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const run = (program, args, env = process.env, input) => {
  const result = spawnSync(program, args, { env, input, encoding: 'utf8', timeout: 120000 });
  assert(result.status === 0, `${program} failed; output withheld to protect private configuration`);
  return result;
};
try {
  run('pnpm', ['--dir', `${root}/packages/database`, 'exec', 'prisma', 'validate', '--schema', resolve('packages/database/prisma/schema.prisma')]);
  const history = await db.$queryRawUnsafe('SELECT migration_name,checksum,finished_at,rolled_back_at FROM "_prisma_migrations" ORDER BY started_at');
  for (const name of ['20260806032000_sprint2_core_engine','20260809000000_sprint6_auth_foundation']) {
    const entry = history.find(row => row.migration_name === name);
    assert(entry?.finished_at && !entry.rolled_back_at && entry.checksum === hash(resolve(`packages/database/prisma/migrations/${name}/migration.sql`)), 'Existing migration history mismatch; no deployment allowed');
  }
  assert(history.length === 2, 'Unexpected migration history: inspect before applying');
  const objects = await db.$queryRawUnsafe(`SELECT to_regclass('public."NewsletterSubscription"')::text AS newsletter, to_regclass('public."CommissionReconciliation"')::text AS archive, EXISTS(SELECT 1 FROM pg_type WHERE typname='NewsletterStatus') AS enum_present`);
  assert(!objects[0].newsletter && !objects[0].archive && !objects[0].enum_present, 'Partial migration effects require owner review');
  const invalid = await db.$queryRawUnsafe('SELECT count(*)::int AS count FROM "Review" WHERE rating<1 OR rating>5');
  assert(invalid[0].count === 0, 'Invalid reviews require owner review');
  const ambiguous = await db.$queryRawUnsafe(`SELECT count(*)::int AS count FROM "CommissionEvent" c LEFT JOIN "Click" k ON k.id=c."clickId" JOIN "AffiliateLink" a ON a.id=c."affiliateLinkId"
    WHERE (c."affiliateLinkId",c."orderId") IN (SELECT "affiliateLinkId","orderId" FROM "CommissionEvent" WHERE "orderId" IS NOT NULL GROUP BY 1,2 HAVING count(*)>1)
    AND (c."orderId"='ORDER-1001' AND c.amount=12.50 AND c.currency='USD' AND c.status::text='PENDING' AND k."userAgent"='seed-script' AND k."ipAddress"='127.0.0.1' AND a."destinationUrl" LIKE 'https://www.amazon.com/%example%') IS NOT TRUE`);
  assert(ambiguous[0].count === 0, 'Non-seed commission duplicate requires owner decision');
  const before = await db.$queryRawUnsafe('SELECT count(*)::int AS rows,sum(amount)::text AS amount FROM "CommissionEvent"');
  const backupDir = '/root/DealOS-backups';
  mkdirSync(backupDir, { recursive: true, mode: 0o700 }); chmodSync(backupDir, 0o700);
  const url = new URL(process.env.DATABASE_URL);
  assert(url.pathname === '/dealos', 'Unexpected database: refusing mutation');
  const file = `${backupDir}/before-phase2a-${Date.now()}.dump`;
  const pgEnv = { ...process.env,
    PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: 'dealos' };
  run('pg_dump', ['--format=custom', '--file', file], pgEnv); chmodSync(file, 0o600);
  console.log('PASS private PostgreSQL backup created; no data uploaded');
  const sql = readFileSync(resolve('packages/database/prisma/migrations/20260925000000_phase2a_data_contracts/migration.sql'), 'utf8');
  const rehearsal = `BEGIN;
    CREATE SCHEMA dealos_migration_rehearsal;
    SET LOCAL search_path TO dealos_migration_rehearsal;
    CREATE TABLE "AffiliateLink" (id text PRIMARY KEY,"destinationUrl" text);
    CREATE TABLE "Click" (id text PRIMARY KEY,"userAgent" text,"ipAddress" text);
    CREATE TABLE "CommissionEvent" (id text PRIMARY KEY,"affiliateLinkId" text,"clickId" text,"orderId" text,amount numeric,currency text,status text,"createdAt" timestamp);
    CREATE TABLE "Review" (rating integer);
    INSERT INTO "AffiliateLink" VALUES ('rehearsal-link','https://www.amazon.com/dp/example');
    INSERT INTO "Click" VALUES ('rehearsal-click','seed-script','127.0.0.1');
    INSERT INTO "CommissionEvent" VALUES ('rehearsal-1','rehearsal-link','rehearsal-click','ORDER-1001',12.50,'USD','PENDING',now()),('rehearsal-2','rehearsal-link','rehearsal-click','ORDER-1001',12.50,'USD','PENDING',now());
    ${sql.replace(/^BEGIN;/, '').replace(/COMMIT;\s*$/, '')}
    DO $$ BEGIN
      IF (SELECT count(*) FROM "CommissionEvent")<>2 OR (SELECT sum(amount) FROM "CommissionEvent")<>25 OR (SELECT count(*) FROM "CommissionReconciliation")<>1 THEN RAISE EXCEPTION 'Rehearsal preservation failed'; END IF;
    END $$;
    ROLLBACK;`;
  run('psql', ['-X','--set','ON_ERROR_STOP=1','--quiet'], pgEnv, rehearsal);
  console.log('PASS migration SQL rehearsal and seed preservation assertions; temporary schema rolled back');
  run('pnpm', ['--dir', `${root}/packages/database`, 'exec', 'prisma', 'migrate', 'deploy', '--schema', resolve('packages/database/prisma/schema.prisma')]);
  run('pnpm', ['--dir', `${root}/packages/database`, 'exec', 'prisma', 'migrate', 'status', '--schema', resolve('packages/database/prisma/schema.prisma')]);
  const after = await db.$queryRawUnsafe('SELECT count(*)::int AS rows,sum(amount)::text AS amount FROM "CommissionEvent"');
  assert(before[0].rows === after[0].rows && before[0].amount === after[0].amount, 'Commission preservation verification failed');
  const snapshots = await db.$queryRawUnsafe('SELECT count(*)::int AS count FROM "CommissionReconciliation"');
  const applied = await db.$queryRawUnsafe(`SELECT checksum,finished_at,rolled_back_at FROM "_prisma_migrations" WHERE migration_name='20260925000000_phase2a_data_contracts'`);
  assert(applied.length === 1 && applied[0].finished_at && !applied[0].rolled_back_at && applied[0].checksum === hash(resolve('packages/database/prisma/migrations/20260925000000_phase2a_data_contracts/migration.sql')), 'Applied migration evidence mismatch');
  assert((await fetch('http://127.0.0.1:3004/ready')).status === 200, 'Post-migration readiness failed');
  console.log(JSON.stringify({ migrationApplied: true, migrateStatusPassed: true, commissionRowsPreserved: true, commissionAmountsPreserved: true, reconciliationSnapshots: snapshots[0].count, readiness: 200 }));
} catch (error) {
  // All intentional errors contain only operational instructions, never raw SQL values.
  console.error(JSON.stringify({ failed: true, type: error.name, code: error.code ?? null, sqlState: error.meta?.code ?? null, instruction: error.constructor === Error ? error.message : undefined }));
  process.exitCode = 1;
} finally { await db.$disconnect(); }
