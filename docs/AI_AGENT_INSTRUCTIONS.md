# AI-Agent Instruction Guidelines (Design Patterns)

Provide these prompts to your AI assistant in Cursor to help scaffold contracts, generate API boilerplate, and offer inline design suggestions.

---

### 1. Smart Contract Pattern

> *"Generate a modular Solidity escrow contract using the Factory pattern. Include events for `FundLocked`, `MilestoneCompleted`, and `FundsReleased`. Use OpenZeppelin for access control and ensure reentrancy protection."*

**Follow-up:**
> *"Based on the `Escrow.sol` contract, write a Hardhat test suite that covers successful fund deposit, milestone release, and contract cancellation scenarios. Use Chai and ethers.js for assertions and interactions."*

---

### 2. API Layer Pattern

> *"Scaffold FastAPI endpoints for `projects` and `bids`. Use dependency injection for database sessions and protect the creation endpoints with OAuth2 authentication. Show how to apply the Repository pattern (as a Service) for data access."*

**Follow-up:**
> *"Create Pydantic schemas for the `Project` and `Bid` models. Include `Create`, `Update`, and `InDB` variations to handle request validation and response serialization."*

---

### 3. Frontend State Management

> *"In Next.js with React Context, create a reusable `AuthContext` to manage user authentication state, including login, logout, and token persistence. Provide a `useAuth` hook for components to access the context."*

**Follow-up:**
> *"Create a reusable hook `usePaginatedProjects` for fetching project lists from the backend API. The hook should handle loading states, errors, and pagination logic."*

---

### 4. Event-Driven Architecture

> *"Design a pub/sub system using Redis streams to propagate smart contract events to WebSocket clients. Provide Python code examples for a listener service that subscribes to contract events and publishes them to a Redis stream, and a FastAPI WebSocket endpoint that subscribes to the stream and pushes updates to connected clients."*

---

### 5. Testing & CI

> *"Setup GitHub Actions to run contract tests (Hardhat), backend tests (pytest), and frontend tests (Jest). Use matrix builds to test across Node.js and Python versions. Add a step to lint the code with Flake8 and ESLint."*

---

### 6. Web3 Integration

> *"Create a React component that uses `ethers.js` to connect to MetaMask, retrieve the user's wallet address, and display their ETH balance. Handle cases where MetaMask is not installed."*

**Follow-up:**
> *"Write a service function for the backend using `web3.py` to listen for the `EscrowCreated` event from the `EscrowFactory` contract and save the new escrow's address to the database."* 