BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- This migration was confirmed unapplied on the VPS before this amendment.
-- Preserve every commission row and an immutable snapshot of each changed seed row.
CREATE TABLE "CommissionReconciliation" (
    "id" TEXT NOT NULL,
    "commissionEventId" TEXT NOT NULL,
    "originalRecord" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommissionReconciliation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommissionReconciliation_commissionEventId_key"
    ON "CommissionReconciliation"("commissionEventId");

LOCK TABLE "CommissionEvent" IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (
      SELECT 1 FROM "CommissionEvent" c LEFT JOIN "Click" k ON k.id=c."clickId"
      JOIN "AffiliateLink" a ON a.id=c."affiliateLinkId"
      WHERE (c."affiliateLinkId",c."orderId") IN
        (SELECT "affiliateLinkId","orderId" FROM "CommissionEvent" WHERE "orderId" IS NOT NULL GROUP BY 1,2 HAVING count(*)>1)
      AND (c."orderId"='ORDER-1001' AND c.amount=12.50 AND c.currency='USD'
        AND c.status::text='PENDING' AND k."userAgent"='seed-script'
        AND k."ipAddress"='127.0.0.1' AND a."destinationUrl" LIKE 'https://www.amazon.com/%example%') IS NOT TRUE
    ) THEN
      RAISE EXCEPTION 'Ambiguous commission duplicates: owner review required; no records changed';
    END IF;
END $$;

WITH ranked AS (
    SELECT id, row_number() OVER (PARTITION BY "affiliateLinkId","orderId" ORDER BY "createdAt",id) AS position
    FROM "CommissionEvent" WHERE "orderId" IS NOT NULL
)
INSERT INTO "CommissionReconciliation" (id,"commissionEventId","originalRecord",reason)
SELECT 'seed-duplicate-' || c.id,c.id,to_jsonb(c),
  'Repeated seed-script ORDER-1001: original order key preserved here; duplicate orderId cleared, financial fields retained'
FROM "CommissionEvent" c JOIN ranked r ON r.id=c.id WHERE r.position>1;

UPDATE "CommissionEvent" c SET "orderId"=NULL
FROM "CommissionReconciliation" r WHERE r."commissionEventId"=c.id;

-- Restore the newsletter persistence contract used by NewsletterRepository and the web
-- verification flow. This model was present in application code but absent from the
-- migration history.
CREATE TYPE "NewsletterStatus" AS ENUM ('PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED');

CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'PENDING',
    "verificationHash" TEXT,
    "verificationSentAt" TIMESTAMP(3),
    "verificationExpiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");
CREATE INDEX "NewsletterSubscription_status_createdAt_idx" ON "NewsletterSubscription"("status", "createdAt");

-- Do not silently discard historical records to make these constraints apply. A
-- deployment with legacy duplicates must resolve them deliberately before retrying.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "CommissionEvent"
        WHERE "orderId" IS NOT NULL
        GROUP BY "affiliateLinkId", "orderId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add CommissionEvent idempotency constraint: duplicate affiliateLinkId/orderId pairs exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "Review"
        WHERE "rating" < 1 OR "rating" > 5
    ) THEN
        RAISE EXCEPTION 'Cannot add Review rating constraint: ratings outside the supported 1-5 range exist';
    END IF;
END
$$;

CREATE UNIQUE INDEX "CommissionEvent_affiliateLinkId_orderId_key"
    ON "CommissionEvent"("affiliateLinkId", "orderId");

-- PriceHistory intentionally remains non-unique. The current domain has no stable
-- external observation/event identifier, and observations for the same product and
-- merchant may legitimately share a timestamp. Add idempotency only with an
-- explicit ingestion/event key in a future migration.

ALTER TABLE "Review"
    ADD CONSTRAINT "Review_rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5);

COMMIT;
