// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Escrow
 * @dev A simple escrow contract to hold funds for a project between a client and a freelancer.
 * The contract owner (the factory) can mediate disputes.
 */
contract Escrow is ReentrancyGuard, Ownable {
    address public client;
    address payable public freelancer;
    
    enum Status { Created, Funded, InProgress, Completed, Disputed, Canceled }
    Status public status;

    uint256 public totalAmount;

    struct Milestone {
        string description;
        uint256 amount;
        bool funded;
        bool released;
    }

    Milestone[] public milestones;
    uint256 public completedMilestones;

    event FundLocked(address indexed client, uint256 amount);
    event MilestoneCompleted(uint256 milestoneId, uint256 amount);
    event FundsReleased(address indexed freelancer, uint256 totalAmount);
    event ContractCanceled(address indexed initiator);
    event Disputed(address indexed initiator);

    modifier onlyClient() {
        require(msg.sender == client, "Only the client can call this function.");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only the freelancer can call this function.");
        _;
    }
    
    modifier atStatus(Status _status) {
        require(status == _status, "Invalid status for this action.");
        _;
    }

    constructor(address _client, address payable _freelancer, string[] memory _milestoneDescriptions, uint256[] memory _milestoneAmounts) {
        require(_milestoneDescriptions.length == _milestoneAmounts.length, "Mismatched milestone data");
        client = _client;
        freelancer = _freelancer;
        status = Status.Created;

        uint256 sum = 0;
        for (uint i = 0; i < _milestoneDescriptions.length; i++) {
            milestones.push(Milestone({
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                funded: false,
                released: false
            }));
            sum += _milestoneAmounts[i];
        }
        totalAmount = sum;
    }

    /**
     * @dev Client deposits the total project funds into the escrow.
     */
    function deposit() external payable onlyClient atStatus(Status.Created) {
        require(msg.value == totalAmount, "Must deposit the exact total amount.");
        status = Status.Funded;
        
        // Mark all milestones as funded
        for(uint i=0; i < milestones.length; i++){
            milestones[i].funded = true;
        }

        emit FundLocked(client, msg.value);
    }

    /**
     * @dev Client approves the completion of a milestone, releasing a partial payment.
     */
    function releaseMilestone(uint256 _milestoneId) external onlyClient nonReentrant {
        require(status == Status.Funded || status == Status.InProgress, "Contract not in a releasable state.");
        require(_milestoneId < milestones.length, "Invalid milestone ID.");
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.funded, "Milestone not funded.");
        require(!milestone.released, "Milestone already released.");
        
        status = Status.InProgress;
        milestone.released = true;
        completedMilestones++;

        (bool success, ) = freelancer.call{value: milestone.amount}("");
        require(success, "Failed to send funds.");

        emit MilestoneCompleted(_milestoneId, milestone.amount);

        // If all milestones are completed, update status and emit final event
        if (completedMilestones == milestones.length) {
            status = Status.Completed;
            emit FundsReleased(freelancer, totalAmount);
        }
    }

    /**
     * @dev Allows the freelancer to cancel if no deposit is made.
     */
    function cancelByFreelancer() external onlyFreelancer atStatus(Status.Created) {
        status = Status.Canceled;
        emit ContractCanceled(msg.sender);
    }

    /**
     * @dev Allows the client to get a refund if the project is not started.
     */
    function cancelByClientAndRefund() external onlyClient atStatus(Status.Funded) nonReentrant {
        status = Status.Canceled;
        (bool success, ) = client.call{value: address(this).balance}("");
        require(success, "Failed to send refund.");
        emit ContractCanceled(msg.sender);
    }

    /**
     * @dev Puts the contract in a disputed state. Only the owner (factory) can resolve it.
     */
    function raiseDispute() external {
        require(msg.sender == client || msg.sender == freelancer, "Only parties can raise dispute");
        status = Status.Disputed;
        emit Disputed(msg.sender);
    }

    /**
     * @dev Owner (factory) resolves a dispute, paying the freelancer a certain amount and refunding the rest.
     */
    function resolveDispute(uint256 freelancerPayout) external onlyOwner atStatus(Status.Disputed) nonReentrant {
        uint256 clientRefund = address(this).balance - freelancerPayout;
        
        (bool successFreelancer, ) = freelancer.call{value: freelancerPayout}("");
        require(successFreelancer, "Failed to pay freelancer.");

        (bool successClient, ) = client.call{value: clientRefund}("");
        require(successClient, "Failed to refund client.");

        status = Status.Completed;
        emit FundsReleased(freelancer, freelancerPayout);
    }
} 