// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Escrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EscrowFactory
 * @dev A factory contract to deploy and manage Escrow contracts.
 */
contract EscrowFactory is Ownable {
    address[] public deployedEscrows;
    mapping(uint256 => address) public projectToEscrow; // Mapping project ID to escrow contract address

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed freelancer,
        uint256 projectId
    );

    /**
     * @dev Deploys a new Escrow contract and transfers ownership to this factory.
     * @param _client The address of the client.
     * @param _freelancer The address of the freelancer.
     * @param _projectId The off-chain project ID for mapping.
     * @param _milestoneDescriptions Descriptions for each milestone.
     * @param _milestoneAmounts Payout amounts for each milestone.
     */
    function createEscrow(
        address _client,
        address payable _freelancer,
        uint256 _projectId,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts
    ) external onlyOwner returns (address) {
        require(projectToEscrow[_projectId] == address(0), "Escrow already exists for this project");

        Escrow newEscrow = new Escrow(_client, _freelancer, _milestoneDescriptions, _milestoneAmounts);
        
        // Transfer ownership of the new Escrow contract to this factory
        // so it can manage disputes.
        newEscrow.transferOwnership(address(this));

        address newEscrowAddress = address(newEscrow);
        deployedEscrows.push(newEscrowAddress);
        projectToEscrow[_projectId] = newEscrowAddress;

        emit EscrowCreated(newEscrowAddress, _client, _freelancer, _projectId);
        
        return newEscrowAddress;
    }

    /**
     * @dev Returns the list of all deployed Escrow contracts.
     */
    function getDeployedEscrows() external view returns (address[] memory) {
        return deployedEscrows;
    }
} 