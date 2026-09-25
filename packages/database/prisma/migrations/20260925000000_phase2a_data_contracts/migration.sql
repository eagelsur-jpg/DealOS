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
