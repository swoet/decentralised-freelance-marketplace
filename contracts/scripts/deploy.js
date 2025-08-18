const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy();

  await escrowFactory.deployed();

  console.log(`EscrowFactory deployed to: ${escrowFactory.address}`);

  // Save the contract's address and ABI to the frontend and backend
  saveContractFiles(escrowFactory);
}

function saveContractFiles(contract) {
  const contractDir = path.join(__dirname, "..", "..");

  // Path for backend
  const backendArtifactsPath = path.join(contractDir, "backend", "app", "contracts");
  if (!fs.existsSync(backendArtifactsPath)) {
    fs.mkdirSync(backendArtifactsPath, { recursive: true });
  }

  // Path for frontend
  const frontendArtifactsPath = path.join(contractDir, "frontend", "contracts");
  if (!fs.existsSync(frontendArtifactsPath)) {
    fs.mkdirSync(frontendArtifactsPath, { recursive: true });
  }

  const escrowFactoryArtifact = hre.artifacts.readArtifactSync("EscrowFactory");
  const escrowArtifact = hre.artifacts.readArtifactSync("Escrow");

  const contractData = {
    EscrowFactory: {
      address: contract.address,
      abi: escrowFactoryArtifact.abi,
    },
    Escrow: {
      abi: escrowArtifact.abi,
    }
  };

  fs.writeFileSync(
    path.join(backendArtifactsPath, "contract-data.json"),
    JSON.stringify(contractData, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendArtifactsPath, "contract-data.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("Saved contract artifacts to backend and frontend directories.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 