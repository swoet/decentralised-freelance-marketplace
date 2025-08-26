# API Reference (New/Extended Endpoints)

Base: /api/v1

- GET /health/liveness
- GET /health/readiness
- GET /matching/feed
- POST /web3/deploy (body: { client, freelancer, milestone_descriptions, milestone_amounts, private_key, chain_id? })
- GET /web3/status/{address}?chain_id=137
- GET /sustainability/estimate-tx?chain_id=137&tx_hash=0x...
- POST /sustainability/offset (body: { amount_kg })
- GET /integrations
- POST /integrations/webhooks/{provider}
- POST /developers/api-keys
- GET /developers/api-keys

Auth: endpoints require authentication unless noted.
