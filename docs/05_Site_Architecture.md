# 05 — Site Architecture

## Purpose
Define front-end and information architecture for scalable discovery, decision support, and conversion.

## Objectives
- Support millions of indexed pages with clean navigation.
- Optimize for speed, accessibility, and SEO intent coverage.
- Enable modular rollout of intelligence features.

## Requirements
- Structured routes for deals, coupons, clearance, drops, guides, reviews, comparisons.
- User modules: wishlist, alerts, assistant, account preferences.
- Admin and moderation paths separated from public experience.

## Architecture
- IA layers:
  - Intent hubs (category, brand, merchant, product type)
  - Decision pages (comparison, history, review aggregation)
  - Action pages (deal detail, coupon redemption, merchant handoff)
- Rendering:
  - Hybrid SSR/SSG/ISR with edge caching.
- Search:
  - Semantic + faceted filtering with relevance blending.

## User Flow
1. Entry via search/social/email/direct.
2. User lands on intent hub and narrows by filters.
3. User opens decision surfaces (history/comparison/review).
4. User saves/alerts or converts to merchant.

## Best Practices
- Keep core information above fold: savings, confidence, validity.
- Minimize click depth for top-intent paths.
- Ensure keyboard and screen-reader navigability.

## Future Scalability
- Regionalized domains/subfolders and language negotiation.
- Multi-tenant architecture for white-label partners.
- Progressive web app for repeat power users.

## Risks
- URL sprawl and crawl inefficiency.
- Inconsistent schema metadata across templates.
- Performance regressions from dynamic widgets.

## KPIs
- Core Web Vitals.
- Organic sessions by intent cluster.
- Conversion-assisted navigation depth.

## Implementation Priority
1. Core IA and template system.
2. Search/filter framework.
3. Personalization modules.

## Technical Notes
- Keep canonical URL logic centralized.
- Use a component registry with versioned contracts.
