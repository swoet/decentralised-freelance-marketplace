# Blockchain Configuration Guide

## 🔗 Blockchain Features Overview

Your marketplace includes comprehensive blockchain integration for:

### Smart Escrow System
- **Milestone-based Payments**: Secure payments released per milestone
- **Dispute Resolution**: On-chain dispute handling with arbitration
- **Multi-token Support**: ETH, MATIC, and ERC-20 token payments
- **Automatic Release**: Time-locked automatic payment release

### Reputation System
- **On-chain Reputation**: Immutable reputation scores stored on blockchain
- **NFT Certificates**: Skill verification certificates as NFTs
- **Cross-platform Verification**: Link GitHub, LinkedIn, Stack Overflow profiles
- **Reputation Staking**: Users stake tokens to guarantee performance

## ⚙️ Environment Configuration

### Backend (.env) Configuration:
```bash
# Blockchain Configuration
BLOCKCHAIN_NETWORK=localhost  # or 'mumbai', 'polygon', 'ethereum'
WEB3_PROVIDER_URI=http://localhost:8545
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Smart Contract Addresses (Update after deployment)
ESCROW_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
ESCROW_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
PAYMENT_TOKEN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Contract ABI Paths
ESCROW_FACTORY_ABI=[]
```

### Frontend (.env) Configuration:
```bash
# Web3 Configuration
NEXT_PUBLIC_WEB3_PROVIDER_URI=http://localhost:8545
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
```

## 🚀 Setup Options

### Option 1: Local Development (Recommended for Testing)

1. **Install Hardhat** (if not already installed):
   ```bash
   cd contracts
   npm install
   npm install -g hardhat
   ```

2. **Start Local Blockchain**:
   ```bash
   npx hardhat node
   ```
   This starts a local Ethereum node on http://localhost:8545

3. **Deploy Contracts**:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Update Contract Addresses**:
   Copy the deployed contract addresses from the deploy script output and update your `.env` files.

### Option 2: Polygon Mumbai Testnet

1. **Get Test MATIC**:
   - Visit [Mumbai Faucet](https://faucet.polygon.technology/)
   - Enter your wallet address to receive test MATIC

2. **Update Configuration**:
   ```bash
   BLOCKCHAIN_NETWORK=mumbai
   WEB3_PROVIDER_URI=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ```

3. **Deploy to Testnet**:
   ```bash
   npx hardhat run scripts/deploy.js --network mumbai
   ```

### Option 3: Polygon Mainnet (Production)

1. **Get Real MATIC**:
   - Purchase MATIC from exchanges
   - Bridge from Ethereum if needed

2. **Update Configuration**:
   ```bash
   BLOCKCHAIN_NETWORK=polygon
   WEB3_PROVIDER_URI=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ```

3. **Deploy to Mainnet**:
   ```bash
   npx hardhat run scripts/deploy.js --network polygon
   ```

## 🛠️ Required Services

### 1. Infura Account (Free)
- Sign up at [Infura](https://infura.io)
- Create a new project
- Get your Project ID
- Update RPC URLs in .env files

### 2. Wallet Setup
- Install MetaMask or similar Web3 wallet
- Create accounts for testing
- Fund with test tokens (Mumbai) or real tokens (mainnet)

### 3. Contract Deployment Wallet
- Create a dedicated deployment wallet
- Fund with enough tokens for deployment gas fees
- Keep private keys secure

## 🚀 API Endpoints

### Escrow Management
```http
POST /api/v1/blockchain/escrows?project_id={id}
GET /api/v1/blockchain/escrows/{escrow_id}
GET /api/v1/blockchain/escrows?user_type=all&state=Active
```

### Milestone Management
```http
POST /api/v1/blockchain/escrows/{escrow_id}/milestones/{milestone_index}/submit
POST /api/v1/blockchain/escrows/{escrow_id}/milestones/{milestone_index}/approve
POST /api/v1/blockchain/escrows/{escrow_id}/milestones/{milestone_index}/reject
```

### Dispute Resolution
```http
POST /api/v1/blockchain/escrows/{escrow_id}/disputes
GET /api/v1/blockchain/disputes
```

### Network Information
```http
GET /api/v1/blockchain/network/status
POST /api/v1/blockchain/gas/estimate
```

## 🎯 Frontend Integration

### Web3 Connection Example:
```javascript
// Connect to user's wallet
const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setWalletAddress(accounts[0]);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }
};

// Create escrow contract
const createEscrow = async (projectId, milestones) => {
  const response = await fetch(`/api/v1/blockchain/escrows?project_id=${projectId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      milestones: milestones,
      payment_token: "0x0000000000000000000000000000000000000000", // ETH
      platform_fee_percent: 250 // 2.5%
    })
  });
  
  const result = await response.json();
  
  // Sign and send transaction
  if (result.unsigned_transaction) {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [result.unsigned_transaction],
    });
    
    // Monitor transaction
    const statusResponse = await fetch(`/api/v1/blockchain/transactions/${txHash}/status`);
    const status = await statusResponse.json();
    
    return status;
  }
};
```

### MetaMask Integration:
```javascript
// Add network to MetaMask (Polygon Mumbai)
const addMumbaiNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x13881',
        chainName: 'Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpcUrls: ['https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
      }]
    });
  } catch (error) {
    console.error('Failed to add network:', error);
  }
};
```

## 💰 Gas and Fee Configuration

### Recommended Gas Settings:
```javascript
// Local development
gasPrice: 20000000000, // 20 gwei
gasLimit: 6000000

// Mumbai testnet
gasPrice: 1000000000,  // 1 gwei
gasLimit: 3000000

// Polygon mainnet
gasPrice: 30000000000, // 30 gwei
gasLimit: 2000000
```

### Platform Fee Configuration:
- Default: 2.5% (250 basis points)
- Configurable per project type
- Split between platform and gas fees

## 🔍 Testing and Monitoring

### Testing Checklist:
- [ ] Local blockchain running
- [ ] Contracts deployed successfully
- [ ] Frontend can connect to wallet
- [ ] Escrow creation works
- [ ] Milestone payments function
- [ ] Dispute resolution works

### Monitoring Tools:
- **Etherscan**: Track transactions and contract interactions
- **Polygonscan**: For Polygon network monitoring
- **Hardhat Console**: For local debugging

### Debug Commands:
```bash
# Check contract deployment
npx hardhat console --network localhost

# Verify contract on testnet
npx hardhat verify --network mumbai CONTRACT_ADDRESS

# Check transaction status
npx hardhat run scripts/check-transaction.js --network localhost
```

## 🚨 Security Considerations

### Best Practices:
1. **Private Key Management**:
   - Never commit private keys to version control
   - Use environment variables for sensitive data
   - Consider using hardware wallets for mainnet

2. **Contract Security**:
   - Audit contracts before mainnet deployment
   - Implement re-entrancy guards
   - Use OpenZeppelin's security libraries

3. **Transaction Validation**:
   - Always verify transaction parameters
   - Implement proper error handling
   - Add transaction confirmation steps

### Emergency Procedures:
- Contract pause functionality for emergencies
- Multi-sig wallets for critical operations
- Upgrade paths for contract improvements

## 🔧 Troubleshooting

### Common Issues:

1. **"Transaction reverted"**:
   - Check gas limits
   - Verify contract addresses
   - Ensure sufficient token balance

2. **"Network not supported"**:
   - Add network to MetaMask
   - Check RPC URL configuration
   - Verify chain ID settings

3. **"Contract not deployed"**:
   - Run deployment script
   - Update contract addresses
   - Check network selection

### Support Resources:
- [Hardhat Documentation](https://hardhat.org/docs)
- [Web3.py Guide](https://web3py.readthedocs.io/)
- [Polygon Developer Docs](https://docs.polygon.technology/)

## 📈 Scaling Considerations

### Performance Optimization:
- Use Layer 2 solutions (Polygon) for lower fees
- Batch multiple operations when possible
- Implement proper caching for blockchain data

### Cost Management:
- Choose appropriate networks based on transaction volume
- Implement dynamic gas pricing
- Consider gas subsidization for small transactions
