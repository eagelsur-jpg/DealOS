# 03 — User Personas

## Purpose
Define priority user segments, motivations, and behavior to guide product, AI, content, and growth decisions.

## Objectives
- Build segment-specific journeys with shared trust foundations.
- Optimize retention through personalization and alerts.
- Support global audiences with local relevance.

## Requirements
- Persona-linked onboarding and profile preferences.
- Segment-specific recommendation templates.
- Lifecycle messaging by intent maturity.

## Architecture
- Core personas:
  - Smart Saver: maximizes value with alerts/history.
  - Busy Professional: wants fast “best now” decisions.
  - Family Planner: optimizes recurring household spend.
  - Enthusiast Researcher: deep comparisons/reviews.
  - Community Curator: shares deals and validates claims.

## User Flow
1. Persona inferred from onboarding + behavior.
2. AI adapts ranking, explanation depth, and alert cadence.
3. Persona dashboards expose relevant modules and actions.
4. Feedback loop updates preference profile.

## Best Practices
- Explicit preference controls (frequency, categories, thresholds).
- Avoid dark patterns and urgency manipulation.
- Keep recommendation rationale concise and clear.

## Future Scalability
- Persona variants by region/culture.
- Household/shared account modes.
- Voice and messaging channel adaptations.

## Risks
- Incorrect persona inference.
- Alert fatigue.
- Bias in model personalization.

## KPIs
- Persona-specific retention and conversion.
- Alert open-to-action rates.
- Satisfaction score for recommendation relevance.

## Implementation Priority
1. Smart Saver + Busy Professional flows.
2. Family Planner + Enthusiast tools.
3. Community Curator gamification.

## Technical Notes
- Store persona confidence score and recency timestamp.
- Separate explicit preferences from inferred attributes.
