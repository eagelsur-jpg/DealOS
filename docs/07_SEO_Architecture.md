# 07 — SEO Architecture

## Purpose
Build a compounding organic growth engine around transactional and informational shopping intent.

## Objectives
- Own high-intent SERP clusters (deals, comparisons, history, guides).
- Improve crawl efficiency and index quality at scale.
- Convert search sessions into retained alert/wishlist users.

## Requirements
- Programmatic page generation with strict quality thresholds.
- Structured data coverage for products, offers, reviews, FAQs, guides.
- Internal linking graph based on intent adjacency.

## Architecture
- Intent clusters:
  - “Best deal now”, “price history”, “X vs Y”, “is this a good price”.
- Technical layers:
  - Canonicalization, hreflang, indexation controls.
  - Dynamic sitemap system by freshness/value score.
  - Template-level metadata rules and A/B testing.

## User Flow
1. User lands on intent-targeted SEO page.
2. Page provides immediate answer and evidence (history/comparison).
3. User takes action: click out, save wishlist, set alert.
4. Lifecycle capture pushes user into retention channels.

## Best Practices
- Prune low-value pages aggressively.
- Keep AI-generated text human-reviewed by policy.
- Link from informational pages to conversion surfaces.

## Future Scalability
- Regional keyword clusters and local merchant signals.
- Entity-driven SEO graph across products/brands/retailers.
- Automated technical SEO remediation.

## Risks
- Thin/duplicate programmatic pages.
- Search algorithm volatility.
- Over-optimization reducing user trust.

## KPIs
- Non-brand organic growth.
- Indexation quality ratio.
- Revenue per organic session.

## Implementation Priority
1. Core templates + structured data.
2. Internal linking and sitemap orchestration.
3. Automated optimization loops.

## Technical Notes
- Maintain SEO rule engine with template contract tests.
- Track page-level freshness and confidence metadata.
