import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("PlatformToken");
  const token = await Token.deploy("FreelanceX", "FLX", deployer.address);
  await token.waitForDeployment();
  console.log("Token:", await token.getAddress());

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(
    deployer.address,
    deployer.address,
    deployer.address,
    2500, // 25% offset
    500 // 5% social
  );
  await treasury.waitForDeployment();
  console.log("Treasury:", await treasury.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
