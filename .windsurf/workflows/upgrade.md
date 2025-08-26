---
description: A upgrade to the codebase.
auto_execution_mode: 3
---

Remaining work to fully complete the upgrade, described in detailed, actionable steps

A. Token-based escrow: complete backend persistence and UI integration

Persist escrow records on successful deploy
Backend
On POST /api/v1/web3/deploy success, create an EscrowContract row with:
contract_address, project_id (if available), client_id, freelancer_id, total_amount
payment_mode ('native'|'token'), chain_id, token_address (if token mode)
status='created'
Expose CRUD:
GET /api/v1/escrow?project_id=&chain_id=&status=… (list with filters, pagination)
GET /api/v1/escrow/{id} (details)
Optional PATCH for status updates (e.g., 'in_progress' after first milestone).
Frontend
Add dashboard widgets/pages to list user escrows (client and freelancer views), link to details.
Milestone management UI and endpoints
Backend
Ensure milestones are linked to EscrowContract; add endpoints to fetch milestones and their statuses.
Extend POST /api/v1/web3/release to accept escrow_id (alongside escrow_address) and automatically include chain_id and related data if provided.
Frontend
On escrow details page, list milestones and provide “Release” action (calls /web3/release), then “Confirm” (calls /web3/confirm) or show updated status via worker (see section C).
Wallet/allowance UX polish
Frontend
On escrow create and details pages, compute the needed allowance (sum of remaining milestones) and guide the user to approve the factory spender.
Improve decimal handling: convert human units to wei using token.decimals.
B. OAuth integrations and webhooks hardening 4) OAuth flows for Slack/Jira/Trello

Backend
Add connect/callback endpoints for Slack/Jira/Trello:
Store tokens (and refresh tokens), include scopes and metadata in Integration.config_json.
Add disconnect endpoints.
Respect provider-specific security: state parameter signing, short expiry, and CSRF prevention.
Frontend
Integrations page: “Connect/Disconnect” buttons for each provider with status badges.
Webhooks hardening (requires a worker; see C)
Backend
Implement idempotency by checking event IDs/signatures before processing.
Add retry with exponential backoff; when retries exhausted, put into DLQ (dead-letter queue) table.
Provide admin endpoint(s) to inspect webhook events and DLQ entries and replay.
C. Background worker and confirmations 6) Background jobs and confirmations

Backend
Add a lightweight job runner (RQ/Arq/Celery) connected to Redis.
Jobs:
Periodic poller for pending TokenTransaction records; update to confirmed/failed.
Webhook handling queue (signature verified, idempotent processing).
Compute/recompute AI matching (batch) and reputation updates if needed.
Define retry policies and DLQ for failures.
Health and monitoring for worker
Add health endpoint(s) to report queue sizes / basic worker heartbeat.
Add Prometheus metrics for job successes/failures/durations.
D. Security/privacy hardening and session management 8) Session and device management integration

Backend
On login: create Session with device (parsed UA), IP; issue refresh token (if implementing refresh).
On each request (or scheduled): update last_seen_at for the session.
Implement refresh tokens with rotation and reuse detection:
Store refresh token hash and metadata; on reuse, revoke sessions/tokens.
Encrypt-at-rest:
Use KMS/libsodium to encrypt 2FA secrets, webhook secrets; only store ciphertext.
Frontend
Settings/Security page: show active sessions, revoke session.
CSP/HSTS and cookies (production)
Next.js (next.config.js):
Tighten CSP to remove unsafe-inline/unsafe-eval where possible (use hashed inline or none).
Set HSTS (served by reverse proxy), secure cookies, SameSite=strict in production.
Backend:
Confirm secure cookies and SameSite on any cookie-bearing endpoints.
GDPR/CCPA improvements
Backend
Expand export to include (at least) projects, bids, messages, reviews, community posts, TokenTransactions, integrations metadata.
For delete: anonymize/link-break sensitive user data across joined tables and mark user as inactive.
Consent log retrieval endpoint, versioning for ToS/Privacy changes.
Legal and docs: include ToS/Privacy versioning and user-facing explanations.
E. AI matching, skills, and reputation expansion 11) AI matching v2

Backend
Add embeddings/text features using a lightweight embedding model or external service.
Add filters: budget range, industry tags, time zone, availability.
Cache top results per user (Redis) with TTL; background job recompute.
Frontend
Matching filters UI; add sort by score, recency; infinite scroll/pagination.
Skills verification improvements
Backend
Integrate S3/GCS signed URLs for evidence upload; secure presign endpoints and object policies.
Add quiz engine with question pools and scoring rubric.
OAuth-based verification mapping (e.g., GitHub repo contributions -> coding skills).
Frontend
Evidence upload UI, quiz taking UI; show verification progress.
Reputation v2
Backend
Add events: on-time delivery, dispute outcomes, verified skills milestones; recalculation triggers on events.
Frontend
Badges/levels; highlight improvements and recommendations based on score components.
F. Community and support 14) Community enhancements

Backend
Pagination, full-text search on threads/posts; tag filtering; moderation endpoints (pin, lock, delete).
Realtime updates with websockets (WS endpoints per thread).
Frontend
Live updates on thread pages; moderation UI (for admin users).
24/7 support
Frontend
Embed support widget based on env (Intercom/Zendesk).
Add a support portal page tying user context (id/email) to the provider.
Backend
Optionally provide a support-ticket endpoint to link tickets to projects.
G. Sustainability and social impact 16) Carbon offset integration

Backend
Integrate provider APIs (e.g., Patch/KlimaDAO) or treasury distribution; create CarbonEvent records per offset.
Hook TokenTransaction/milestone releases to create carbon estimates, optional auto-offset on confirmation.
Frontend
Transparency page: monthly ledger of CarbonEvents and SocialAllocations; CSV export.
H. Observability, performance, indexes, and caching 17) Observability

Extend OTEL spans to database queries and external calls; annotate spans with user/project IDs.
Add custom Prometheus gauges/counters:
Escrows created, milestones released, approvals, pending txs, webhook processed/failures.
Create Grafana dashboards and alerts.
Performance and caching
Redis caching for hot endpoints (dashboard summaries, matching feed, reputation score).
Review N+1 queries; ensure appropriate DB indexes are added (user_id, project_id, chain_id, status).
Standardize pagination and use cursor-based pagination where necessary for scale.
I. Frontend UX, dashboards, and accessibility 19) Dashboards integration

Integrate escrow list and details into client and freelancer dashboards.
Add reputation and skills verification widgets to dashboards (with deep links to pages).
Notifications and toasts for key actions (escrow deployed, milestone released, approval confirmed).
Wallet and escrow UI polish
Global chain selector and wallet connect integrated in header (not only wallet page).
Balances and allowances across configured chains (iterate CHAIN_REGISTRY_JSON).
Transaction detail view with receipts and confirmation status.
Navigation and routing
Ensure an app rewrite/proxy for /api to the backend in environments where same-origin is not used (avoid CORS).
Add AppShell links to Wallet and Escrow Create pages.
Accessibility and styling
A11y audit: roles/labels, keyboard navigation, focus management.
Color contrast, skeleton loading states, error boundaries across pages.
J. Infrastructure, CI/CD, tests, and documentation 23) Kubernetes/Helm

Ensure environment variables and secrets for:
SENTRY_DSN, OTEL_EXPORTER_OTLP_ENDPOINT, CHAIN_REGISTRY_JSON
ESCROW_FACTORY_ADDRESS_, TOKEN_ADDRESS_
OAuth credentials (GitHub, Slack, etc.), support widget toggle
Expose /metrics; set resource requests/limits; configure HPA.
CI/CD
Add pipelines to:
Run unit/integration tests and linting
Compile/deploy contracts per environment and export addresses to env
Apply DB migrations automatically
Run smoke tests post-deploy (health, critical endpoints)
Testing
Unit tests for services (matching, skills, reputation, token service).
Integration tests for OAuth and webhooks (mock providers).
Contract tests (Token/Treasury/Escrow interactions), local chain simulations.
E2E tests: from registration to 2FA, skills verification, matching, project creation, escrow deploy, milestone release, and viewing token activity.
Documentation
Update docs/api-reference.md with all new endpoints and flows:
Security (sessions, backup codes, GDPR), Skills, Reputation, Community, Integrations and Developer, Token and Web3.
Architecture docs:
Chain registry design, token/escrow flow diagrams, background job system.
Runbooks:
Webhook failures, tx stuck in pending, rate limits, tracing issues.
K. Data migration/backfills 27) Reputation backfill and skill taxonomy

Backfill ReputationScore from historical reviews.
Seed a baseline skills taxonomy and tags per niche focus; UI to browse and add skills.
Acceptance criteria for “fully done”

Users can:
Register, enable 2FA with backup codes, manage sessions; export/delete data.
Connect GitHub (and at least one more provider) via OAuth; verified webhook handling in place.
View recommended projects, verify skills (evidence/quiz), see reputation with badges.
Create escrows (native and token) with chain selection; approve allowances; release milestones; txs auto-confirmed and shown in wallet/dashboard.
Participate in community threads and events; use embedded 24/7 support widget.
Devs can:
Issue scoped API keys, use them with enforced scopes; view usage analytics.
Ops can:
Monitor health/metrics/traces, see Grafana dashboards and alerts; scale pods; investigate DLQs.
Compliance/security:
Encryption-at-rest for secrets, production-grade CSP/HSTS/cookies, per-route rate limits and robust audit logging (with IP/UA masked as needed).
Rollout sequencing

Finish Batch 3 (escrow persistence + worker confirmations) -> Batch 2 (additional OAuths, webhooks DLQ/retries) -> Batch 4 (AI/skills/reputation v2) -> Batch 5 (community/support live features) -> Batch 6 (sustainability) -> Batch 7 (observability/performance) -> Batch 8 (UX polish) -> Batch 9 (infra/CI/CD/docs/tests).
This checklist provides a complete, production-ready path to fully deliver the platform upgrades with explicit backend, frontend, infra, security, and documentation tasks, along with acceptance criteria and rollout sequencing.