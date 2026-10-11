# DealOS final code audit and deployment handoff

Date: 2026-10-11. Source baseline: `140bf26c232b8d93fbdde6336fd7d4618537f9d3`, following `a666cd397885b56ca71fd7c02f2443f4f7911287`.

**Status: implementation and local checks complete; production acceptance remains open. DealOS is not declared finished.** No VPS login, live database inspection, live CRUD, real affiliate destination, or mobile browser verification was possible from this environment. No VPS service, Nginx configuration, database data, or `/root/resether-ai` was modified.

## Operational continuation (2026-10-11)

The owner reports that the reviewed implementation `ee0677bebaf5aa5fd095d4bdd7226b78b2abd5d1` passed typecheck, lint, 55 tests and a production-mode build on the real VPS. The owner also reports readiness with real PostgreSQL/Redis, Web pages, Admin protected routes and isolated CRUD, with verification records archived and existing catalog untouched. These are owner-reported VPS results; the earlier local verification section remains historical.

A read-only self-hosted workflow was added on the reviewed branch. Evidence commit: `96c9e233d3255ceecf05a8d118b6a49bd0e5f40a`. It reads PostgreSQL catalogs and migration history inside a read-only transaction, aggregates sample/image counts, checks DealOS HTTP routes, and lists only relevant socket addresses and DealOS unit names. It never migrates, reconciles history, changes catalog data, installs packages or restarts services. Workflow run https://github.com/eagelsur-jpg/DealOS/actions/runs/38102093819 is awaiting execution; no runner evidence or deployment SHA has yet been independently collected.

Migration `20260925000000_phase2a_data_contracts` is reported missing from applied history. Its exact effects requiring comparison are: NewsletterStatus enum values/order; every NewsletterSubscription column/type/nullability/default/timestamp precision; newsletter primary key, unique email and status/createdAt index; unique CommissionEvent affiliateLinkId/orderId index; validated Review rating CHECK. Duplicate order-pair and invalid-rating counts must also be zero. Compare index validity, uniqueness, predicates and key order, not merely names. History checksum must match repository SQL. Do not run migrate deploy; only consider migrate resolve --applied after exact effects have been evidenced and no unresolved failed history remains. If an effect differs, stop for schema-change approval.

Remaining acceptance: reviewed real active affiliate link with both redirect destination and persisted click verified; browser/mobile at 320/375/768/1024/1440; exact process manager/deployment identity; Redis private bindings and PostgreSQL exposure/dependencies; domain ownership/DNS/HTTPS. The owner has not selected domains, so no reverse proxy changes are authorized by a specific domain decision yet. Ports 3000/resether-ai and 3001/pokemon-store and their files/services remain excluded.

## 1. Architecture and current implementation

| Component           | Actual implementation                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`          | Next.js 15 App Router, React 19, server-side Prisma catalog reads, client search, newsletter double opt-in, SEO/RSS, API-backed affiliate redirect                            |
| `apps/admin`        | Next.js; environment-configured administrator credentials; HS256 JWT cookie; protected dashboard, products, deals, analytics; server actions call authenticated API mutations |
| `apps/api`          | Hono/OpenAPI, Zod validation, repository dependency injection, CRUD, PostgreSQL search, affiliate tracking, Redis cache/readiness/rate buckets                                |
| `packages/database` | Prisma 6/PostgreSQL; catalog repositories; deal service/ranking utility; affiliate engine; newsletter/user/session repositories                                               |
| `packages/utils`    | Currency/discount helpers, scrypt password hashing, logging, pagination, in-memory/Redis stores                                                                               |
| `packages/config`   | Shared environment validation and ESLint/Prettier configuration                                                                                                               |
| `packages/types`    | Domain and pagination contracts                                                                                                                                               |
| `packages/ui`       | Shared Tailwind/React UI, responsive navigation                                                                                                                               |
| `packages/ai`       | Provider abstraction/configuration; not an operating storefront AI assistant or ingestion system                                                                              |
| Root                | pnpm 9.12.0 workspace and Turborepo; retained existing dependency versions and architecture                                                                                   |

The strategy documents describe future warehouses, event pipelines, AI workflows and granular RBAC. Those descriptions are not evidence that the features exist. No Meilisearch, Typesense, worker queue, warehouse, or additional infrastructure was added.

Existing database models cover users/accounts, categories, merchants, products, deals, coupons, price history, affiliate links, clicks, reviews, favorites, alerts, sessions, commissions and newsletter subscriptions. The web member-auth foundation uses NextAuth credentials/JWT and stored scrypt hashes; a member login interface is not complete. Administrator auth is a separate environment-backed mechanism.

## 2. Completed features

- Real database counts replace all four fabricated administrator dashboard numbers. CTR/review moderation counts are explicitly unavailable.
- Products and Deals pages support paginated records, create, edit, and non-destructive removal from public listings. Products are deactivated; deals can be hidden. Forms call API mutations using the server-side administrator session, with error/success states.
- Analytics shows actual recorded click totals and top deals with merchant names. Counts are not represented as unique people or verified conversions.
- Public deals require active status, active merchant/product, visibility, and effective start/end dates. Coupons use effective start/expiry dates and active merchants.
- Keyword/category/merchant/coupon search and autocomplete continue to use PostgreSQL. Category/merchant filters now use catalog choices.
- Storefront prices use each deal's actual currency. Price history excludes a different merchant or currency, and the chart no longer claims an all-time low from absent history.
- Missing/example.com images use an explicit “Image unavailable” fallback. External images load directly in the browser, avoiding wildcard server-side image optimization.
- Homepage and API live-deal reads bypass stale offer caches; Redis remains useful for shared rate limiting and readiness. Index pages retain their existing short-lived caches.
- Sitemap includes actual active deal and merchant/category detail URLs; RSS text and JSON-LD are escaped.
- Production `start` scripts retain Web 3002, Admin 3003, API 3004. Systemd templates and verification helpers are included, but not installed on the VPS.

## 3. Bugs fixed

1. Administrator menu links previously had no Products, Deals, or Analytics implementations.
2. Dashboard displayed static 1,284/92/37/6.4% values.
3. Default public deal queries could include draft/hidden/unavailable records; featured/hot listings did not consistently apply lifecycle dates.
4. Keyword OR conditions could broaden an expired/hidden filter instead of intersecting it.
5. Expired/future coupons could appear active; `hasCoupon=false` was coerced to true.
6. Zero price bounds were ignored.
7. Per-page ranking reordered explicit price/date sorting. Stored database ordering is now preserved.
8. Savings ordering compared unrelated price columns, and clearance filtering occurred after pagination. Discount percentage is now calculated before paging and totals match the eligible result set.
9. `/v1/deals/search` followed `/v1/deals/:id` and was shadowed.
10. Combined search reported pagination metadata without slicing non-deal results.
11. API Zod, malformed JSON, unique/relation, and not-found failures were not consistently mapped to safe client errors.
12. Affiliate clicks were written before validating inactive/unsafe destinations. Validation now precedes insertion.
13. Affiliate parameters could be appended after a fragment; configured Amazon tags could be supplemented with an invented default tag. Configured tags are preserved, with URL-aware query composition.
14. IPv6/internal/example destinations were insufficiently guarded. IPv6 literal redirects are conservatively rejected; partner-network tracking hosts remain allowed when explicitly configured in stored templates.
15. Storefront redirect bypassed API rate protection. It now delegates to the API and handles unavailable/rate-limited links.
16. Logout could reintroduce localhost-based redirects. Route handlers use relative 303 redirects; middleware uses a validated absolute origin/host and ignores forwarded hosts unless explicitly trusted.
17. JWT role/algorithm/expiration claims were not adequately checked in administrator session verification. Authentication is also checked in protected layout/actions, independently of middleware.
18. Login had no origin check, throttling, or visible invalid-credential state. Login/logout reject cross-origin submissions.
19. Edge middleware pulled a Node crypto module through the utils barrel. Environment validation now uses the edge-safe config module directly.
20. Source-tree compiled cache artifacts could shadow TypeScript source. Removed these artifacts and protected against reintroduction.
21. Clean-checkout typecheck lacked built dependency declarations; ESLint referenced an undeclared direct dependency. Build dependencies and `@eslint/eslintrc` are now explicit.
22. Newsletter signup could report success despite a Resend error. Invalid JSON and delivery/configuration failures now return safe errors.
23. Unsupported copy claimed continuous feed scanning, merchant verification, automatic alerts and AI ranking. Principal offer/about/home copy now describes implemented catalog behavior.

## 4. Database status and safety

**No schema change, migration, introspection write, reset, seed, db push, or live data change was executed.** Existing Prisma schema and migration SQL remain untouched.

The previous phase-2a migration creates newsletter structures, adds commission idempotency, and checks review ratings. Its applied state on the VPS requires inspection. Never rerun it blindly on a manually altered database.

API DELETE is archival for products/merchants/deals/coupons. Category deletion is intentionally rejected with 409 pending a reviewed data change. Repository hard-delete methods remain internal but have no current HTTP deletion path for these entities.

The seed script is explicitly disabled in production and requires `ALLOW_DEMO_SEED=true` elsewhere. It must only be used against a disposable isolated database; it resets sample account passwords, updates example prices, and creates example reviews/clicks/commissions.

### Demo data identified in source

| Sample identifier                                                 | Source evidence / action                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `macbook-pro-14-m4`, `sony-wh-1000xm5`, `dyson-v15-detect`        | Seed products with example.com images; retained; fallback display                                                                    |
| `macbook-pro-14-discount`, `sony-xm5-sale`, `dyson-v15-last-week` | Seed offer identifiers and synthetic prices/scores; matches labelled sample listings                                                 |
| `amazon`, `best-buy`                                              | Actual business names used as seed merchants; not evidence of affiliate approval or a production feed                                |
| `SAVE20AUDIO`                                                     | Seed coupon; needs merchant validation                                                                                               |
| `amazon-sonyxm5-link`                                             | Seed destination `/dp/example`; rejected rather than presented as a working product destination                                      |
| `seed-script` click user agent / `ORDER-1001`                     | Source-created sample attribution; audit helper counts matches; do not treat as verified business results                            |
| Sample member/admin accounts                                      | Seed uses a public default password; read-only helper reports whether active sample accounts still match it without revealing hashes |

Production strategy: run the read-only inventory helper, review identifier matches with the owner, replace imagery/links/prices only from approved merchant sources, archive confirmed demo offers through Admin, and deliberately disable/rotate confirmed sample accounts. No threshold-based deletion, blanket cleanup, invented imagery, or silent record mutation is included.

## 5. Redis status

- VPS PONG/active status is **user-reported**, not independently reverified here.
- Existing `REDIS_URL` integration is retained. Production limiter uses atomic Redis INCR/PEXPIRE buckets when Redis is configured; conservative per-process fallback protects during failure.
- `/ready` checks PostgreSQL and configured cache reachability; `/health` is liveness only.
- Rate buckets currently group untrusted clients by endpoint. This is conservative but can throttle legitimate shared traffic; configure trusted peer/proxy identification before public scale.
- Login throttling is a per-process global bucket, not a distributed credential-abuse solution. Multi-worker production needs stronger shared login protection.
- No Redis install, configuration, flush, public exposure or global service action occurred. Verify localhost binding on the VPS.

## 6. API status and endpoint verification

OpenAPI covers 20 paths including CRUD methods. Response shapes and manually registered search query contracts still need refinement before external SDK consumption.

| Endpoint(s)                                                                          | Code/local verification                                                                               | VPS requirement                                                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/health`, `/docs`, `/openapi.json`                                                  | Real local HTTP 200; OpenAPI has 20 paths                                                             | Rerun after deployment                                                                     |
| `/ready`                                                                             | Real local HTTP 503 with intentionally unavailable isolated database                                  | Must return 200 with real PostgreSQL/Redis                                                 |
| `/v1/deals`, `/v1/deals/:id`, `/v1/deals/search`                                     | Injected repository tests: listing/search, routing, not-found, boolean filters, invalid/hidden inputs | Actual persisted catalog and lifecycle verification                                        |
| `/v1/search`, categories/merchants/coupons/autocomplete variants                     | Injected success tests; keyword validation and combined-result pagination regression tests            | Real result accuracy, no results, filters, ordering                                        |
| `/v1/products`, `/v1/merchants`, `/v1/coupons`, `/v1/categories`, their `/:id` reads | Injected success tests                                                                                | Real rows, inactive/hidden detail policy and full pagination/load behavior                 |
| POST/PATCH/DELETE catalog routes                                                     | Authorization checked for all entity groups; authorized deal create/archive tested                    | Full DB mutation acceptance, uniqueness/relation errors; category DELETE intentionally 409 |
| `/r/:affiliateLinkId`                                                                | Safe/unsafe redirect and throttling tests; URL/active checks before clicks                            | Reviewed real link; verify a single actual click record and HTTPS Location                 |
| `/v1/commissions`                                                                    | Always 503; anonymous ingestion test verifies no commission write                                     | Signed provider contract, replay protection and credentials required                       |

Database failures produce generic errors rather than exposing connection details to clients. No fake conversion or commission is created by implemented storefront tracking.

## 7. Web status

Homepage, deals/details, coupons, clearance, categories/details, merchants/details and search query existing PostgreSQL data. Sample identifiers are labelled rather than deleted. Archived/expired/scheduled offers are restricted in active listings; expired detail pages retain historical context with the affiliate CTA disabled.

Real local HTTP `/about` returned 200. Real database-backed pages require VPS verification. Category/merchant counts use active-record filters. Some directory caches can delay visibility changes until their existing revalidation interval; revise that policy before high-frequency merchandising.

Mobile navigation switches at the larger breakpoint to avoid squeezing six navigation links into tablet width. **Mobile visual acceptance is unverified:** Chromium was absent and its download failed. Review 320, 375, 768, 1024 and 1440 widths, menus, search/filter controls, images and long content on the actual browser.

## 8. Admin status

- Dashboard and Analytics are dynamic server queries with no fake numbers.
- Products/Deals have 25-record pagination and authenticated API create/edit/deactivate/hide operations.
- Loading and database failure states are explicit. Saving failures do not masquerade as success.
- Local `/login` returned 200. Login returned 303 plus HttpOnly session cookie; logout returned 303 to `/login` and cleared it.
- Real local middleware request with VPS Host header redirected to `http://157.173.124.25:3003/login`, preserving the host. Loopback URLs can be normalized by Next.js to localhost; this is not evidence of a VPS redirect regression.
- Real dashboard/analytics totals and full form/CRUD behavior still require PostgreSQL-backed VPS acceptance.
- Dedicated coupon/merchant/category editor screens, granular team RBAC and persistent administrative audit logs are not implemented in this pass. Their API contracts exist; category removal is protected.

## 9. Auth/security status

HS256 administrator JWTs expire after eight hours. Cookie is HttpOnly, SameSite=Lax, and Secure in production. Browser logout removes the cookie; existing stateless tokens are not centrally revoked before expiry. There is no MFA or multi-admin identity store.

`ADMIN_ORIGIN` should be the selected HTTPS administrator origin. `TRUST_PROXY` remains false by default. Enable only behind a proxy that overwrites forwarded host/proto headers. The API uses bearer JWTs for mutations; CORS alone is not used as authorization. Administrator server actions verify the session and use Next.js origin protections.

Set strong actual secrets through existing private environment files. Do not copy `.env.example` defaults onto production. Do not print `.env`, credentials, JWTs, cookie values or database URLs in audit outputs.

Remaining security work: distributed login protection/trusted client identification, member-login brute-force protection, token revocation/MFA if required, selected HTTPS origins, private database/cache listeners and firewall policy, source/merchant approval, and consent/retention decisions for analytics. Newsletter has double opt-in but no completed unsubscribe interface or production delivery acceptance; do not activate marketing without finishing that flow.

## 10. Analytics definitions

| Metric                                         | Definition / limitation                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Active deals                                   | ACTIVE, not hidden, current date in effective window, active product and merchant    |
| Expired coupons                                | `expiresAt <= now`; all records matching that timestamp, including demo records      |
| Recorded clicks                                | Count of Click rows, including seed, bots and repeated requests; not unique visitors |
| Products / merchants                           | Stored catalog counts; not claims of real affiliate approvals                        |
| Top deals                                      | Ordered by related Click row counts, with merchant names                             |
| CTR, conversion rate, review moderation totals | Unavailable because required denominator/state/source is absent                      |

GA4/Clarity hooks are optional environment-configured client instrumentation. They do not provide a trustworthy stored impression denominator to the administrator dashboard. No revenue is inferred from seed commissions.

## 11. Affiliate tracking and background tasks

The web redirect calls the API with manual redirect handling; only the API records the click. Active link/merchant/deal checks and URL validation precede the insert. Network tracking parameters use configured templates. The browser then receives a safe HTTPS redirect; no purchase or commission is fabricated.

Safety rejects credentials in URLs, HTTP/non-web schemes, loopback/private IPv4, literal IPv6, internal/example hosts and example product paths. This is not a merchant ownership allowlist or partner approval workflow; third-party affiliate tracking domains require owner review. Template IDs are server-generated, not arbitrary user-supplied outbound URLs.

Expiration is enforced at read/redirect time and needs no queue merely to hide expired offers. No automated score recalculation, affiliate reconciliation, merchant feed sync or alert scheduler exists. Stored scores are preserved; introducing jobs requires a real feed contract and scheduling policy. No unnecessary queue infrastructure was added.

## 12. Tests and build

| Check                                 | Result                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                      | Passed, all nine packages; dependencies built as required                                    |
| `pnpm lint`                           | Passed                                                                                       |
| `pnpm test`                           | Passed: 55 tests = API 37, database 11, admin 5, utils 2                                     |
| `pnpm build`                          | Passed: all nine packages and both optimized Next.js applications                            |
| Verification-script TypeScript checks | Passed for API acceptance helper and read-only data inventory helper                         |
| `git diff --check`                    | Passed                                                                                       |
| Local real HTTP                       | API health/docs/spec, web About and admin login 200; login/logout and host redirect verified |
| PostgreSQL/Redis integration on VPS   | Requires VPS verification; user's baseline reported healthy                                  |
| Browser/mobile                        | Not passed; Chromium unavailable/download failure                                            |

Tests use injected/mock repositories for database behavior. A successful build uses an isolated unavailable database URL and generated test-only secrets; it does not prove live DB readiness. Packages without test files use the existing pass-with-no-tests scripts. No payment occurred.

## 13. Remaining production blockers / TODOs

1. Run the included VPS verification against existing real data, including `/ready`, auth/logout, all public pages, CRUD and a reviewed real affiliate link. Perform SQL inspection of the resulting verification click.
2. Run the read-only inventory and migration-status checks. Review sample credentials/data and rotate/disable only identified demo accounts through an approved non-destructive action.
3. Complete real image/feed/affiliate contracts. Demo merchant names, coupon codes and synthetic prices must not be marketed as verified current offers.
4. Complete browser/mobile acceptance and console/error inspection; no visual pass is asserted.
5. Choose Web/Admin/API domains and HTTPS. No DNS or Nginx was changed.
6. Identify existing DealOS process owners before cutover. Do not interrupt port 3000 or `/root/resether-ai`; do not reboot or run global PostgreSQL changes.
7. Choose trusted proxy/client identification and distributed login controls. Validate rate-limit behavior under realistic traffic.
8. Ensure network service signatures/replay protection before enabling commission ingestion. Current 503 is a deliberate safe blocker.
9. Before scaling, replace full candidate reads used for exact savings sorting and combined entity search with measured database pagination/SQL ranking. Directory lists and some public detail response shapes remain broader than ideal.
10. Finish newsletter unsubscribe/delivery/consent acceptance before enabling production marketing; replace any remaining speculative policy/support copy with owner-confirmed business details.
11. If team operations require it, add reviewed admin audit logging, granular roles and session revocation. These are not falsely claimed complete.

## 14. Source control

Implementation branch: `codex/dealos-production-audit`, based on the verified current main. No force-push, history rewrite or live merge was performed.

GitHub implementation commits:

- `a987b2336c319399f92a69de83a983c6fb6fda9f` — core/database/API/rate/cache safety and test contracts.
- `3b46f5b5fb1ccf372f9d9ef929b31863193751a8` — database-backed Admin operations and auth verification.
- `9e261fb6b162c6145285ed77dc3b2b1828f6f665` — storefront lifecycle/currency/images/search/SEO.

GitHub's connected write path creates its own commit metadata. The local preparatory commits have equivalent trees but different hashes. Use the GitHub hashes above for review/deployment.

## 15. Exact verification and deployment commands

### Read-only baseline on existing VPS

```bash
cd /root/DealOS
git status --short
git log -3 --oneline
command -v node pnpm
redis-cli -h 127.0.0.1 ping
ss -ltnp '( sport = :3002 or sport = :3003 or sport = :3004 or sport = :6379 or sport = :5432 )'
pnpm prisma migrate status
pnpm --filter @dealos/database exec tsx scripts/audit-live.ts
```

Do not print private environment values. If schema drift must be inspected, `pnpm prisma db pull --print` prints the introspected schema without overwriting the source schema. Review differences; do not apply migrations automatically.

### Build a separate review checkout before changing a watched live repository

```bash
cd /root/DealOS
git fetch origin codex/dealos-production-audit
git worktree add --detach /root/DealOS-review origin/codex/dealos-production-audit
cd /root/DealOS-review
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Use Node 22 LTS and the repository's pnpm 9.12.0. Provide build environment through existing private configuration; keep original secrets private and do not overwrite existing files. The review build needs DATABASE_URL and strong Admin environment values. None of these steps applies a database migration. Do not run review dev servers on occupied live ports.

### Cutover gate

Only after review, data inventory, domain/HTTPS and service-owner decisions: integrate the reviewed branch through normal Git history, stop **only the identified DealOS processes**, and use either their existing process manager or the supplied dedicated systemd units. The current manager/PIDs and Node/pnpm installation paths were not visible here; inventing their stop commands would risk unrelated services.

For systemd, first confirm `/root/DealOS/.env` is a private production configuration file, contains the existing required settings, and that the unit PATH finds the actual Node/pnpm installation. Root execution matches the existing `/root/DealOS` location; move to a dedicated service account in a separately reviewed operational change. Templates are proposals, not applied configuration.

After the identified DealOS dev processes have been stopped and ports 3002/3003/3004 are free:

```bash
cd /root/DealOS
install -m 644 deploy/systemd/dealos-api.service /etc/systemd/system/dealos-api.service
install -m 644 deploy/systemd/dealos-web.service /etc/systemd/system/dealos-web.service
install -m 644 deploy/systemd/dealos-admin.service /etc/systemd/system/dealos-admin.service
systemctl daemon-reload
systemctl enable --now dealos-api.service dealos-web.service dealos-admin.service
systemctl status dealos-api.service dealos-web.service dealos-admin.service --no-pager
```

These unit names affect DealOS only. Web/Admin bind localhost under the templates; API retains its existing listener and requires firewall/reverse-proxy policy before public launch. Do not stop/reset Redis, PostgreSQL, unrelated PM2 processes or `resether-ai`.

### Acceptance on the updated running VPS

```bash
cd /root/DealOS
pnpm --filter @dealos/api exec tsx scripts/verify-live.ts
```

The default helper reads routes, tests authentication/logout and rejects anonymous mutations. It reads private Admin credentials from existing environment files and never prints their values. To additionally test CRUD, `VERIFY_CRUD=true` creates its own inactive product and DRAFT deal, updates the draft and archives both; the verification records are deliberately preserved. Existing catalog records are not modified.

```bash
cd /root/DealOS
VERIFY_CRUD=true pnpm --filter @dealos/api exec tsx scripts/verify-live.ts
```

To test affiliate tracking, use a reviewed active real link ID. This records one verification click, inspects Location without visiting the merchant, and creates no commission or payment:

```bash
cd /root/DealOS
VERIFY_AFFILIATE_LINK_ID='<reviewed-real-link-id>' pnpm --filter @dealos/api exec tsx scripts/verify-live.ts
```

The placeholder above is an input requirement, not an executable valid ID. Verify the new click row by link ID and user agent `DealOS-runtime-verification`; do not invent commissions. Browser checks still need separate acceptance.

Proposed domain mapping, after owner selection: apex/www -> Web 3002; admin subdomain -> Admin 3003; api subdomain -> API 3004. Do not install guessed DNS/Nginx configuration.

### Rollback

Record the prior reviewed code SHA and exact DealOS process-manager commands before cutover. If acceptance fails, restore that code revision through a separate worktree/build and restart only DealOS. No database rollback/reset is needed because this change adds no schema migration and archives rather than deletes data.

## Changed files

```text
.env.example
.gitignore
DEALOS-FINAL-AUDIT.md
LOCAL_SETUP.md
apps/admin/app/(protected)/analytics/page.tsx
apps/admin/app/(protected)/deals/page.tsx
apps/admin/app/(protected)/error.tsx
apps/admin/app/(protected)/layout.tsx
apps/admin/app/(protected)/loading.tsx
apps/admin/app/(protected)/page.tsx
apps/admin/app/(protected)/products/page.tsx
apps/admin/app/api/auth/login/route.ts
apps/admin/app/api/auth/logout/route.ts
apps/admin/app/login/page.tsx
apps/admin/lib/actions.ts
apps/admin/lib/auth.test.ts
apps/admin/lib/auth.ts
apps/admin/lib/data.ts
apps/admin/lib/env.ts
apps/admin/lib/request-security.ts
apps/admin/middleware.ts
apps/admin/package.json
apps/api/package.json
apps/api/scripts/verify-live.ts
apps/api/src/app.test.ts
apps/api/src/app.ts
apps/api/src/dependencies.ts
apps/web/app/about/page.tsx
apps/web/app/api/newsletter/subscribe/route.ts
apps/web/app/api/search/autocomplete/route.ts
apps/web/app/api/search/route.ts
apps/web/app/clearance/page.tsx
apps/web/app/deals/[slug]/page.tsx
apps/web/app/deals/page.tsx
apps/web/app/merchants/[slug]/page.tsx
apps/web/app/merchants/page.tsx
apps/web/app/page.tsx
apps/web/app/r/[affiliateLinkId]/route.ts
apps/web/app/rss.xml/route.ts
apps/web/app/search/page.tsx
apps/web/app/sitemap.ts
apps/web/components/deal-card.tsx
apps/web/components/json-ld.tsx
apps/web/components/price-history-chart.tsx
apps/web/components/product-image.tsx
apps/web/components/search-experience.tsx
apps/web/lib/server/catalog.ts
apps/web/lib/server/newsletter.ts
apps/web/lib/site.ts
apps/web/next.config.ts
apps/web/package.json
deploy/systemd/dealos-admin.service
deploy/systemd/dealos-api.service
deploy/systemd/dealos-web.service
docs/VPS_DATABASE_SETUP.md
package.json
packages/config/src/index.ts
packages/database/prisma/seed.ts
packages/database/scripts/audit-live.ts
packages/database/src/affiliate/affiliate-engine.test.ts
packages/database/src/affiliate/affiliate-engine.ts
packages/database/src/deals/deal-repository.test.ts
packages/database/src/deals/deal-repository.ts
packages/database/src/deals/deal-service.ts
packages/database/src/deals/deal-validator.ts
packages/database/src/index.ts
packages/database/src/repositories/coupon-repository.ts
packages/database/src/repositories/merchant-repository.ts
packages/database/src/repositories/product-repository.ts
packages/database/src/visibility.ts
packages/ui/src/components/navbar.tsx
packages/utils/src/cache.d.ts
packages/utils/src/cache.d.ts.map
packages/utils/src/cache.js
packages/utils/src/cache.js.map
packages/utils/src/cache.ts
packages/utils/src/currency.ts
packages/utils/src/pagination.ts
packages/utils/tests/cache.test.ts
pnpm-lock.yaml
turbo.json
```
