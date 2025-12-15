# Production Readiness & Hardening Checklist for Sendra

This document outlines the critical steps required to prepare Sendra for production launch. It mostly focuses on "Must Fix" items that prevent data loss, security breaches, or major outages.

## 1. Security Hardening

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CORS Configuration** | **MUST FIX** | Configure CORS in `main.ts` to allow only trusted frontend domains. | Prevent unauthorized browser-based API access. | [ ] |
| **Security Headers** | **MUST FIX** | specific `helmet` middleware. | Mitigation for XSS, clickjacking, and other common attacks. | [ ] |
| **Rate Limiting** | **MUST FIX** | Enable `ThrottlerModule` (global) and specific limits on sensitive routes (Auth, Send). | Prevent abuse/DoS. | [ ] |
| **Input Validation** | **MUST FIX** | Enable global `ValidationPipe({ whitelist: true })`. | Prevent mass assignment vulnerabilities. | [ ] |
| **API Key Hashing** | **MUST FIX** | Ensure `ApiKeyGuard` hashes incoming keys before comparing. | If DB leaks, raw API keys remain safe. | [ ] |

## 2. Data Integrity & Isolation

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace Scoping** | **MUST FIX** | Audit all Controllers to ensure `where: { workspaceId }` is present in ALL queries. | Prevent tenants seeing each other's data (Critical). | [ ] |
| **Foreign Keys** | **MUST FIX** | Ensure `onDelete: Cascade` or `Restrict` is correctly set in Prisma. | Prevent orphaned records (e.g., leads without campaigns). | [ ] |

## 3. Queue & Worker Safety

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Graceful Shutdown** | **MUST FIX** | Ensure BullMQ workers handle `SIGTERM` to finish current job. | Prevent data loss during deployments. | [ ] |
| **Idempotency** | **MUST FIX** | `MailerProcessor` must handle re-delivery of same job without double sending. | Queues verify "at least once" delivery, email must be "exactly once". | [ ] |
| **Poison Jobs** | POST-LAUNCH | Configured Dead Letter Queue (DLQ). | Prevent bad jobs from blocking queues forever. | [ ] |

## 4. Email Safety

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Race Condition** | **MUST FIX** | `MailerProcessor` checks `CampaignLead` status *immediately* before send. | Reply might arrive *while* job is in queue. | [ ] |
| **Bounce Handling** | POST-LAUNCH | Webhook handler for SNS/SES bounces to update `LeadStatus`. | Maintain sender reputation. | [ ] |

## 5. Observability & Logging

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Structured Logs** | **MUST FIX** | Use JSON logger (e.g. `winston`/`pino`) in Prod. | Enable querying/filtering logs in tools (Datadog/CloudWatch). | [ ] |
| **Correlation IDs** | POST-LAUNCH | Pass `X-Request-ID` through logs. | Trace requests across services. | [ ] |

## 6. Configuration

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Env Validation** | **MUST FIX** | Validate all required env vars on startup (Joi/Zod). | Fail fast if config is missing (e.g., API keys). | [ ] |

## 7. Performance

| Item | Priority | Description | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Indexes** | **MUST FIX** | Review `schema.prisma` for indexes on commonly queried fields (`email`, `status`, `nextStepId`). | Prevent full table scans as data grows. | [ ] |
