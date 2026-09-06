# 06 — Database Architecture

## Purpose
Design a resilient data foundation for product intelligence, real-time pricing, user signals, and attribution.

## Objectives
- Support high-write price/deal events and low-latency reads.
- Preserve data lineage and trust auditability.
- Enable analytics, AI training, and operational reporting.

## Requirements
- Entities: products, merchants, offers, coupons, prices, alerts, users, sessions, clicks, conversions.
- Event-sourced history for all price and availability changes.
- Data quality flags and confidence scoring.

## Architecture
- Storage split:
  - OLTP relational DB for transactional workloads.
  - Time-series/event store for price history.
  - Search index for retrieval and ranking.
  - Warehouse/lake for analytics and model training.
- Key models:
  - Product normalization graph.
  - Offer-to-product matching with confidence.
  - Attribution event chain.

## User Flow
1. Ingestion pipelines collect merchant/network data.
2. Deduplication and matching engines normalize records.
3. Confidence and anomaly detection annotate events.
4. APIs serve enriched results to UI and AI layers.

## Best Practices
- Use immutable event logs with correction events.
- Partition by region/category/time for scale.
- Implement strict schema versioning.

## Future Scalability
- Multi-region active-active replication.
- CDC pipelines for near-real-time downstream sync.
- Federated data products for team autonomy.

## Risks
- Bad merchant feeds corrupting rankings.
- Cross-region consistency complexity.
- Storage growth from high-frequency price events.

## KPIs
- Ingestion freshness SLA.
- Match accuracy rate.
- Query p95 latency on key endpoints.

## Implementation Priority
1. Core product/offer/price schema + event pipeline.
2. Attribution and alert data models.
3. Warehouse and model feature store.

## Technical Notes
- Use idempotency keys in ingestion jobs.
- Track source reliability score per merchant/feed.
