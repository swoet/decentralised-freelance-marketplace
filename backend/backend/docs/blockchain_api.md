# Blockchain API Documentation

## Overview

The Blockchain API provides endpoints for interacting with smart contracts for escrow management, milestone tracking, and dispute resolution in the decentralized freelance marketplace.

## Base URL
```
/api/v1/blockchain
```

## Authentication

All endpoints require Bearer token authentication. Users must have verified wallet addresses to perform blockchain operations.

## Endpoints

### Escrow Management

#### Create Escrow
```http
POST /escrows?project_id={id}
```

Creates a new smart escrow contract for a project.

**Request Body:**
```json
{
  "milestones": [
    {
      "amount": 100.0,
      "description": "Initial design",
      "due_date": "2024-02-01T12:00:00Z",
      "auto_release": false,
      "auto_release_delay": 86400
    }
  ],
  "payment_token": "0x0000000000000000000000000000000000000000",
  "platform_fee_percent": 250,
  "gas_price_gwei": 20
}
```

**Response:**
```json
{
  "success": true,
  "transaction_hash": "0x...",
  "gas_estimate": 350000,
  "message": "Escrow creation transaction sent successfully"
}
```

#### Get Escrow Details
```http
GET /escrows/{escrow_id}
```

Returns complete escrow information including milestones and disputes.

#### List User Escrows
```http
GET /escrows?user_type=all&state=Active&page=1&per_page=20
```

Returns paginated list of escrows for the current user.

### Milestone Management

#### Submit Milestone
```http
POST /escrows/{escrow_id}/milestones/{milestone_index}/submit
```

Submit milestone deliverable for client review.

**Request Body:**
```json
{
  "deliverable_hash": "QmXdsjkf...",
  "notes": "Milestone completed as requested"
}
```

#### Approve Milestone
```http
POST /escrows/{escrow_id}/milestones/{milestone_index}/approve
```

Approve milestone and release payment to freelancer.

**Request Body:**
```json
{
  "feedback": "Great work!",
  "rating": 5
}
```

#### Reject Milestone
```http
POST /escrows/{escrow_id}/milestones/{milestone_index}/reject
```

Reject milestone with feedback for improvement.

**Request Body:**
```json
{
  "feedback": "Please address the following issues...",
  "requested_changes": ["Fix bug in login", "Update styling"]
}
```

### Dispute Management

#### Create Dispute
```http
POST /escrows/{escrow_id}/disputes
```

Raise a dispute for an escrow.

**Request Body:**
```json
{
  "reason": "Freelancer not responding to feedback",
  "affected_milestones": [0, 1],
  "evidence": ["QmEvidence1...", "QmEvidence2..."]
}
```

### Transaction Monitoring

#### Get Transaction Status
```http
GET /transactions/{tx_hash}/status
```

Returns transaction status, confirmations, and parsed event logs.

**Response:**
```json
{
  "transaction_hash": "0x...",
  "status": "success",
  "block_number": 12345678,
  "gas_used": 85000,
  "confirmations": 12,
  "logs": []
}
```

### Network Information

#### Network Status
```http
GET /network/status
```

Returns current blockchain network status.

**Response:**
```json
{
  "network": "https://mainnet.infura.io/...",
  "connected": true,
  "block_number": 12345678,
  "gas_price": 25,
  "contract_address": "0x..."
}
```

#### Gas Estimation
```http
POST /gas/estimate
```

Estimate gas costs for blockchain operations.

**Request Body:**
```json
{
  "operation_type": "create_escrow",
  "escrow_data": {...}
}
```

### User Profile

#### Blockchain Profile
```http
GET /profile/blockchain
```

Returns user's blockchain profile including wallet address and escrow statistics.

**Response:**
```json
{
  "wallet_address": "0x...",
  "is_verified": true,
  "active_escrows": 3,
  "completed_escrows": 15,
  "total_earned": 5000.0,
  "total_paid": 2000.0
}
```

### Admin Endpoints

#### Escrow Metrics (Admin Only)
```http
GET /admin/metrics
```

Returns platform-wide escrow metrics. Requires admin or arbitrator role.

## Error Responses

All endpoints return standardized error responses:

```json
{
  "detail": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing required fields, invalid data)
- `401` - Unauthorized (invalid or missing authentication token)
- `403` - Forbidden (insufficient permissions, wallet not verified)
- `404` - Not Found (escrow/project not found)
- `500` - Internal Server Error (blockchain connection issues, contract errors)

## Security Considerations

1. **Wallet Verification**: Users must have verified wallet addresses to perform blockchain operations
2. **Role-Based Access**: Certain operations require specific roles (client, freelancer, admin)
3. **Transaction Signing**: Most operations return unsigned transactions for client-side signing
4. **Gas Estimation**: Always estimate gas costs before sending transactions

## Integration Examples

### Creating an Escrow (Frontend)

```javascript
// 1. Create escrow via API
const response = await fetch('/api/v1/blockchain/escrows?project_id=123', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    milestones: [
      {
        amount: 500.0,
        description: "Website development",
        due_date: "2024-03-01T12:00:00Z",
        auto_release: false
      }
    ],
    payment_token: "0x0000000000000000000000000000000000000000", // ETH
    platform_fee_percent: 250 // 2.5%
  })
});

const result = await response.json();

// 2. Sign and send transaction using Web3
if (result.unsigned_transaction) {
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [result.unsigned_transaction],
  });
  
  // 3. Monitor transaction status
  const statusResponse = await fetch(`/api/v1/blockchain/transactions/${txHash}/status`);
  const status = await statusResponse.json();
}
```

## Configuration Requirements

The following environment variables must be configured:

```env
# Blockchain Network
BLOCKCHAIN_NETWORK=mainnet
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/...
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/...

# Smart Contract
ESCROW_CONTRACT_ADDRESS=0x...
ESCROW_CONTRACT_ABI_PATH=./contracts/SmartEscrow.json
PAYMENT_TOKEN_CONTRACT_ADDRESS=0x...
PAYMENT_TOKEN_ABI_PATH=./contracts/ERC20.json
```
