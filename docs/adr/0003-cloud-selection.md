# ADR 0003: Cloud selection process

- **Status:** Proposed
- **Date:** 2026-09-01

## Context

The provider is intentionally not selected yet. MT5 worker requirements, launch
jurisdictions, data residency, managed KMS/database availability, team skills,
and cost must be validated before committing the platform to a cloud.

## Decision process

Run a one-week proof and score AWS, Azure, and GCP against the same weighted
matrix. Azure and AWS should receive explicit MT5/Windows-worker proofs; all
three should receive the Linux platform API, managed PostgreSQL, Redis/queue,
KMS, private networking, monitoring, backup/restore, and regional-failover proof.

| Criterion | Weight |
| --- | ---: |
| Security, IAM, KMS, audit and private networking | 20% |
| MT5 worker/Windows lifecycle and account isolation | 20% |
| Required regions, residency and regulated-service controls | 15% |
| Managed PostgreSQL, cache/queue and recovery capability | 15% |
| Reliability, observability and operational simplicity | 10% |
| Team capability and support | 10% |
| Three-year total cost, including data/market traffic | 10% |

## Required proof

Deploy one isolated MT5 demo account and prove provisioning, secret retrieval,
login, health monitoring, restart/reconnect, order idempotency, reconciliation,
credential rotation, kill switch, logs, backup restore, and teardown. Record
measured recovery times and monthly cost assumptions. Select the provider only
after security and engineering approve the evidence and legal confirms regions.
