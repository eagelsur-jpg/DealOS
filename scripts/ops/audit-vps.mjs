// Read-only operational evidence. Never logs environment values or customer rows.
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = '/root/DealOS';
const require = createRequire(`${root}/packages/database/package.json`);
const { config } = require('dotenv');
for (const file of [`${root}/.env.local`, `${root}/.env`]) {
  if (existsSync(file)) config({ path: file, override: false, quiet: true });
}
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ log: [] });
try {
  const evidence = await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const historyExists = await tx.$queryRawUnsafe(`SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS present`);
    const history = historyExists[0].present ? await tx.$queryRawUnsafe(`SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count FROM public._prisma_migrations ORDER BY started_at`) : [];
    const columns = await tx.$queryRawUnsafe(`SELECT column_name, data_type, udt_name, is_nullable, column_default, datetime_precision FROM information_schema.columns WHERE table_schema='public' AND table_name='NewsletterSubscription' ORDER BY ordinal_position`);
    const enums = await tx.$queryRawUnsafe(`SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='NewsletterStatus' ORDER BY e.enumsortorder`);
    const indexes = await tx.$queryRawUnsafe(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('NewsletterSubscription','CommissionEvent') ORDER BY indexname`);
    const constraints = await tx.$queryRawUnsafe(`SELECT c.conname, c.convalidated, pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname IN ('Review','NewsletterSubscription') ORDER BY c.conname`);
    const duplicates = await tx.$queryRawUnsafe(`SELECT count(*)::int AS duplicate_groups FROM (SELECT 1 FROM "CommissionEvent" WHERE "orderId" IS NOT NULL GROUP BY "affiliateLinkId","orderId" HAVING count(*)>1) d`);
    const ratings = await tx.$queryRawUnsafe(`SELECT count(*)::int AS invalid_ratings FROM "Review" WHERE "rating"<1 OR "rating">5`);
    const catalog = await tx.$queryRawUnsafe(`SELECT count(*)::int AS products, count(*) FILTER (WHERE "imageUrl" ILIKE '%example.com%')::int AS example_images FROM "Product"`);
    const links = await tx.$queryRawUnsafe(`SELECT count(*)::int AS active_links FROM "AffiliateLink" WHERE "isActive"=true`);
    const duplicateEvidence = await tx.$queryRawUnsafe(`SELECT count(*)::int AS row_count,
      count(DISTINCT c.amount)::int AS distinct_amounts, count(DISTINCT c.currency)::int AS distinct_currencies,
      count(DISTINCT c.status)::int AS distinct_statuses,
      bool_and(c."orderId"='ORDER-1001') AS seed_order_identifier_match,
      bool_and(c.amount=12.50 AND c.currency='USD' AND c.status::text='PENDING') AS seed_payment_fields_match,
      bool_and(k."userAgent"='seed-script' AND k."ipAddress"='127.0.0.1') AS all_seed_clicks,
      bool_and(c."clickId" IS NOT NULL) AS all_have_clicks
      FROM "CommissionEvent" c LEFT JOIN "Click" k ON k.id=c."clickId"
      WHERE (c."affiliateLinkId",c."orderId") IN
        (SELECT "affiliateLinkId","orderId" FROM "CommissionEvent" WHERE "orderId" IS NOT NULL GROUP BY 1,2 HAVING count(*)>1)
      GROUP BY c."affiliateLinkId",c."orderId"`);
    const networkDependencies = await tx.$queryRawUnsafe(`SELECT (datname='dealos') AS is_dealos,
      (client_addr IS NULL OR client_addr <<= inet '127.0.0.0/8' OR client_addr=inet '::1') AS local_connection,
      count(*)::int AS connections FROM pg_stat_activity WHERE backend_type='client backend' GROUP BY 1,2`);
    const linkReview = await tx.affiliateLink.findMany({ where: { isActive: true }, select: {
      destinationUrl: true, trackingTemplate: true, merchant: { select: { isActive: true } },
      deal: { select: { status: true, isHidden: true, startsAt: true, expiresAt: true } }
    } });
    const affiliateCandidates = linkReview.map(link => {
      try { const url = new URL(link.destinationUrl); return { destinationHost: url.hostname,
        protocol: url.protocol, examplePath: /example/i.test(url.pathname),
        hasCredentials: Boolean(url.username || url.password), merchantActive: link.merchant.isActive,
        dealStatus: link.deal?.status, hidden: link.deal?.isHidden,
        startsInFuture: Boolean(link.deal?.startsAt && link.deal.startsAt > new Date()),
        expired: Boolean(link.deal?.expiresAt && link.deal.expiresAt <= new Date()),
        templateConfigured: Boolean(link.trackingTemplate) }; }
      catch { return { invalidDestination: true }; }
    });
    return { history, columns, enums, indexes, constraints, duplicates, duplicateEvidence,
      ratings, catalog, links, affiliateCandidates, networkDependencies };
  });
  const migration = new URL('../../packages/database/prisma/migrations/20260925000000_phase2a_data_contracts/migration.sql', import.meta.url);
  console.log(JSON.stringify({ readOnly: true, migrationSqlSha256: createHash('sha256').update(readFileSync(migration)).digest('hex'), evidence }, null, 2));
  for (const port of [3002, 3003, 3004]) {
    for (const path of port === 3004 ? ['/health','/ready','/docs','/openapi.json'] : port === 3003 ? ['/login'] : ['/','/deals','/search']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      console.log(JSON.stringify({ port, path, status: response.status }));
    }
  }
  // Socket addresses and unit names only; never process arguments or environment.
  console.log(execFileSync('ss', ['-lntH'], { encoding: 'utf8' }).split('\n').filter(line => /:(3002|3003|3004|5432|6379)\s/.test(line)).join('\n'));
  console.log(execFileSync('systemctl', ['list-units','--all','--no-pager','--plain','dealos*'], { encoding: 'utf8' }));
  const sockets = execFileSync('ss', ['-lntpH'], { encoding: 'utf8' }).split('\n').filter(line => /:(3002|3003|3004)\s/.test(line));
  for (const line of sockets) for (const match of line.matchAll(/pid=(\d+)/g)) {
    const pid = match[1];
    const { readlinkSync } = await import('node:fs');
    const cwd = readlinkSync(`/proc/${pid}/cwd`);
    console.log(JSON.stringify({ dealosProcess: { pid, cwd, executable: readlinkSync(`/proc/${pid}/exe`),
      controlGroup: readFileSync(`/proc/${pid}/cgroup`, 'utf8').trim() } }));
  }
  for (const directory of ['/root/DealOS', '/root/DealOS-review']) {
    if (existsSync(`${directory}/.git`)) console.log(JSON.stringify({ directory,
      sha: execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      dirty: Boolean(execFileSync('git', ['-C', directory, 'status', '--porcelain'], { encoding: 'utf8' }).trim()),
      hasRootEnv: existsSync(`${directory}/.env`), hasLocalEnv: existsSync(`${directory}/.env.local`) }));
  }
} catch {
  console.error('Read-only VPS audit failed; details suppressed to avoid leaking credentials. Check package/environment availability and schema locally.');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
