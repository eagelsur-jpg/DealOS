# 12 — Email System

## Purpose
Define lifecycle and alert email architecture that drives repeat usage and trusted purchase decisions.

## Objectives
- Convert anonymous visitors into owned audience.
- Deliver timely, relevant alerts with low fatigue.
- Create compounding retention and reactivation loops.

## Requirements
- Triggered and scheduled campaigns.
- Preference center for category, frequency, and threshold control.
- Deliverability governance and consent compliance.

## Architecture
- Streams:
  - Transactional (verification, account, settings).
  - Triggered alerts (price drop, restock, coupon expiry).
  - Editorial newsletters (weekly intelligence).
- Components:
  - Audience segmentation engine.
  - Template system with dynamic blocks.
  - Send optimization and suppression management.

## User Flow
1. User subscribes during wishlist/alert flow.
2. Preference setup captures categories and timing.
3. Relevant events trigger personalized emails.
4. User clicks through to decision pages and converts/saves.

## Best Practices
- Use value-first subject lines, not clickbait urgency.
- Include clear unsubscribe and preference links.
- Track engagement decay and throttle automatically.

## Future Scalability
- Multilingual regional campaigns.
- AI-generated digest personalization.
- Cross-channel journey orchestration with push/SMS.

## Risks
- Deliverability degradation.
- Over-mailing leading to churn/spam complaints.
- Inaccurate alerts harming trust.

## KPIs
- Open, click, and conversion rates by campaign type.
- Unsubscribe and complaint rates.
- Revenue and retention lift from email cohorts.

## Implementation Priority
1. Alert + transactional foundation.
2. Segmented lifecycle journeys.
3. AI personalization and send-time optimization.

## Technical Notes
- Maintain per-user communication policy state.
- Store event-to-email lineage for debugging.

