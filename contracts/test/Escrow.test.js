const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory and Escrow", function () {
  let EscrowFactory, escrowFactory, Escrow, escrow;
  let owner, client, freelancer;
  const projectId = 1;

  beforeEach(async function () {
    [owner, client, freelancer] = await ethers.getSigners();

    // Deploy EscrowFactory
    EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactory.deploy();
    await escrowFactory.deployed();

    // Create a new Escrow contract instance through the factory
    const milestoneDescriptions = ["Milestone 1", "Milestone 2"];
    const milestoneAmounts = [ethers.utils.parseEther("1"), ethers.utils.parseEther("2")];
    
    const tx = await escrowFactory.connect(owner).createEscrow(
      client.address,
      freelancer.address,
      projectId,
      milestoneDescriptions,
      milestoneAmounts
    );
    await tx.wait();

    const escrowAddress = await escrowFactory.projectToEscrow(projectId);
    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.attach(escrowAddress);
  });

  it("Should deploy the factory and create a new escrow", async function () {
    const escrowAddress = await escrowFactory.projectToEscrow(projectId);
    expect(escrowAddress).to.not.equal(ethers.constants.AddressZero);
    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.freelancer()).to.equal(freelancer.address);
    expect(await escrow.owner()).to.equal(escrowFactory.address);
  });

  it("Should allow the client to deposit funds", async function () {
    const totalAmount = ethers.utils.parseEther("3");
    
    await expect(escrow.connect(client).deposit({ value: totalAmount }))
      .to.emit(escrow, "FundLocked")
      .withArgs(client.address, totalAmount);

    expect(await ethers.provider.getBalance(escrow.address)).to.equal(totalAmount);
    expect(await escrow.status()).to.equal(1); // Status.Funded
  });

  it("Should not allow deposit of incorrect amount", async function () {
    const incorrectAmount = ethers.utils.parseEther("2");
    await expect(escrow.connect(client).deposit({ value: incorrectAmount }))
      .to.be.revertedWith("Must deposit the exact total amount.");
  });

  it("Should allow the client to release a milestone", async function () {
    const totalAmount = ethers.utils.parseEther("3");
    await escrow.connect(client).deposit({ value: totalAmount });

    const milestoneId = 0;
    const milestoneAmount = ethers.utils.parseEther("1");

    const freelancerInitialBalance = await ethers.provider.getBalance(freelancer.address);
    
    await expect(escrow.connect(client).releaseMilestone(milestoneId))
        .to.emit(escrow, "MilestoneCompleted")
        .withArgs(milestoneId, milestoneAmount);
        
    const freelancerFinalBalance = await ethers.provider.getBalance(freelancer.address);
    expect(freelancerFinalBalance.sub(freelancerInitialBalance)).to.equal(milestoneAmount);
    
    const milestone = await escrow.milestones(milestoneId);
    expect(milestone.released).to.be.true;
    expect(await escrow.status()).to.equal(2); // Status.InProgress
  });

  it("Should complete the contract when the last milestone is released", async function() {
    const totalAmount = ethers.utils.parseEther("3");
    await escrow.connect(client).deposit({ value: totalAmount });

    await escrow.connect(client).releaseMilestone(0);
    await escrow.connect(client).releaseMilestone(1);

    expect(await escrow.status()).to.equal(3); // Status.Completed
    await expect(escrow.connect(client).releaseMilestone(1)).to.be.revertedWith("Contract not in a releasable state.");
  });

  it("Should not allow non-client to release milestones", async function () {
    const totalAmount = ethers.utils.parseEther("3");
    await escrow.connect(client).deposit({ value: totalAmount });

    await expect(escrow.connect(freelancer).releaseMilestone(0))
      .to.be.revertedWith("Only the client can call this function.");
  });
}); 