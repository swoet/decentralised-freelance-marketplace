// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SmartEscrow
 * @dev Decentralized escrow contract for freelance marketplace with milestone-based payments
 */
contract SmartEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Escrow states
    enum EscrowState {
        Created,
        Active,
        Disputed,
        Completed,
        Cancelled,
        Refunded
    }

    // Milestone states
    enum MilestoneState {
        Pending,
        Submitted,
        Approved,
        Rejected,
        Released,
        Disputed
    }

    // Dispute states
    enum DisputeState {
        None,
        Raised,
        UnderReview,
        Resolved,
        Escalated
    }

    struct Milestone {
        uint256 amount;
        string description;
        uint256 dueDate;
        MilestoneState state;
        string deliverableHash; // IPFS hash of deliverable
        uint256 submittedAt;
        uint256 approvedAt;
        string feedback;
        bool autoRelease; // Auto-release after timeout
        uint256 autoReleaseDelay; // Delay in seconds
    }

    struct Dispute {
        DisputeState state;
        address initiator;
        string reason;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        string resolution;
        uint256[] affectedMilestones;
    }

    struct EscrowData {
        uint256 projectId;
        address client;
        address freelancer;
        address paymentToken; // Address(0) for ETH, ERC20 address for tokens
        uint256 totalAmount;
        uint256 platformFeePercent; // Basis points (100 = 1%)
        EscrowState state;
        uint256 createdAt;
        uint256 completedAt;
        Milestone[] milestones;
        Dispute dispute;
        mapping(address => bool) authorizedArbitrators;
        uint256 emergencyWithdrawDelay;
        uint256 lastActivity;
    }

    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed projectId,
        address indexed client,
        address freelancer,
        uint256 totalAmount
    );

    event MilestoneSubmitted(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string deliverableHash
    );

    event MilestoneApproved(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        uint256 amount
    );

    event MilestoneRejected(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string feedback
    );

    event PaymentReleased(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        address to,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed resolver,
        string resolution
    );

    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId);
    event EmergencyWithdraw(uint256 indexed escrowId, address to, uint256 amount);

    // State variables
    uint256 public nextEscrowId = 1;
    mapping(uint256 => EscrowData) public escrows;
    mapping(address => bool) public authorizedArbitrators;
    mapping(address => uint256[]) public clientEscrows;
    mapping(address => uint256[]) public freelancerEscrows;
    
    uint256 public constant MAX_MILESTONES = 20;
    uint256 public constant MIN_EMERGENCY_DELAY = 30 days;
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%
    uint256 public constant AUTO_RELEASE_MAX_DELAY = 30 days;

    address public platformTreasury;
    uint256 public defaultPlatformFee = 250; // 2.5%

    modifier onlyEscrowParties(uint256 escrowId) {
        require(
            msg.sender == escrows[escrowId].client ||
            msg.sender == escrows[escrowId].freelancer,
            "Not authorized"
        );
        _;
    }

    modifier onlyArbitrator() {
        require(authorizedArbitrators[msg.sender], "Not authorized arbitrator");
        _;
    }

    modifier escrowExists(uint256 escrowId) {
        require(escrowId < nextEscrowId && escrowId > 0, "Escrow does not exist");
        _;
    }

    constructor(address _platformTreasury) {
        platformTreasury = _platformTreasury;
        authorizedArbitrators[msg.sender] = true;
    }

    /**
     * @dev Create a new escrow contract
     */
    function createEscrow(
        uint256 _projectId,
        address _freelancer,
        address _paymentToken,
        uint256[] calldata _milestoneAmounts,
        string[] calldata _milestoneDescriptions,
        uint256[] calldata _milestoneDueDates,
        bool[] calldata _milestoneAutoRelease,
        uint256[] calldata _autoReleaseDelays,
        uint256 _platformFeePercent
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Client cannot be freelancer");
        require(_milestoneAmounts.length <= MAX_MILESTONES, "Too many milestones");
        require(_milestoneAmounts.length > 0, "At least one milestone required");
        require(
            _milestoneAmounts.length == _milestoneDescriptions.length &&
            _milestoneAmounts.length == _milestoneDueDates.length &&
            _milestoneAmounts.length == _milestoneAutoRelease.length &&
            _milestoneAmounts.length == _autoReleaseDelays.length,
            "Array length mismatch"
        );
        require(_platformFeePercent <= MAX_PLATFORM_FEE, "Platform fee too high");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be positive");
            require(_milestoneDueDates[i] > block.timestamp, "Due date must be in future");
            if (_milestoneAutoRelease[i]) {
                require(
                    _autoReleaseDelays[i] <= AUTO_RELEASE_MAX_DELAY,
                    "Auto-release delay too long"
                );
            }
            totalAmount += _milestoneAmounts[i];
        }

        uint256 escrowId = nextEscrowId++;
        EscrowData storage escrow = escrows[escrowId];

        escrow.projectId = _projectId;
        escrow.client = msg.sender;
        escrow.freelancer = _freelancer;
        escrow.paymentToken = _paymentToken;
        escrow.totalAmount = totalAmount;
        escrow.platformFeePercent = _platformFeePercent > 0 ? _platformFeePercent : defaultPlatformFee;
        escrow.state = EscrowState.Created;
        escrow.createdAt = block.timestamp;
        escrow.lastActivity = block.timestamp;
        escrow.emergencyWithdrawDelay = MIN_EMERGENCY_DELAY;

        // Create milestones
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            escrow.milestones.push(Milestone({
                amount: _milestoneAmounts[i],
                description: _milestoneDescriptions[i],
                dueDate: _milestoneDueDates[i],
                state: MilestoneState.Pending,
                deliverableHash: "",
                submittedAt: 0,
                approvedAt: 0,
                feedback: "",
                autoRelease: _milestoneAutoRelease[i],
                autoReleaseDelay: _autoReleaseDelays[i]
            }));
        }

        // Handle payment
        if (_paymentToken == address(0)) {
            // ETH payment
            require(msg.value == totalAmount, "Incorrect ETH amount");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "ETH not accepted for token payments");
            IERC20(_paymentToken).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        // Update mappings
        clientEscrows[msg.sender].push(escrowId);
        freelancerEscrows[_freelancer].push(escrowId);

        escrow.state = EscrowState.Active;

        emit EscrowCreated(escrowId, _projectId, msg.sender, _freelancer, totalAmount);

        return escrowId;
    }

    /**
     * @dev Submit a milestone for approval
     */
    function submitMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string calldata _deliverableHash
    ) external nonReentrant escrowExists(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.freelancer, "Only freelancer can submit");
        require(escrow.state == EscrowState.Active, "Escrow not active");
        require(_milestoneIndex < escrow.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = escrow.milestones[_milestoneIndex];
        require(milestone.state == MilestoneState.Pending, "Milestone not in pending state");
        require(bytes(_deliverableHash).length > 0, "Deliverable hash required");

        milestone.state = MilestoneState.Submitted;
        milestone.deliverableHash = _deliverableHash;
        milestone.submittedAt = block.timestamp;

        escrow.lastActivity = block.timestamp;

        emit MilestoneSubmitted(_escrowId, _milestoneIndex, _deliverableHash);
    }

    /**
     * @dev Approve a submitted milestone
     */
    function approveMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string calldata _feedback
    ) external nonReentrant escrowExists(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.client, "Only client can approve");
        require(escrow.state == EscrowState.Active, "Escrow not active");
        require(_milestoneIndex < escrow.milestones.length, "Invalid milestone index");

        Milestone storage milestone = escrow.milestones[_milestoneIndex];
        require(milestone.state == MilestoneState.Submitted, "Milestone not submitted");

        milestone.state = MilestoneState.Approved;
        milestone.feedback = _feedback;
        milestone.approvedAt = block.timestamp;

        escrow.lastActivity = block.timestamp;

        emit MilestoneApproved(_escrowId, _milestoneIndex, milestone.amount);

        // Auto-release payment
        _releaseMilestonePayment(_escrowId, _milestoneIndex);
    }

    /**
     * @dev Reject a submitted milestone
     */
    function rejectMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string calldata _feedback
    ) external nonReentrant escrowExists(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.client, "Only client can reject");
        require(escrow.state == EscrowState.Active, "Escrow not active");
        require(_milestoneIndex < escrow.milestones.length, "Invalid milestone index");

        Milestone storage milestone = escrow.milestones[_milestoneIndex];
        require(milestone.state == MilestoneState.Submitted, "Milestone not submitted");
        require(bytes(_feedback).length > 0, "Feedback required for rejection");

        milestone.state = MilestoneState.Rejected;
        milestone.feedback = _feedback;

        escrow.lastActivity = block.timestamp;

        emit MilestoneRejected(_escrowId, _milestoneIndex, _feedback);
    }

    /**
     * @dev Auto-release milestone payment after delay
     */
    function autoReleaseMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex
    ) external nonReentrant escrowExists(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(escrow.state == EscrowState.Active, "Escrow not active");
        require(_milestoneIndex < escrow.milestones.length, "Invalid milestone index");

        Milestone storage milestone = escrow.milestones[_milestoneIndex];
        require(milestone.state == MilestoneState.Submitted, "Milestone not submitted");
        require(milestone.autoRelease, "Auto-release not enabled");
        require(
            block.timestamp >= milestone.submittedAt + milestone.autoReleaseDelay,
            "Auto-release delay not met"
        );

        milestone.state = MilestoneState.Approved;
        milestone.feedback = "Auto-released after delay";
        milestone.approvedAt = block.timestamp;

        escrow.lastActivity = block.timestamp;

        emit MilestoneApproved(_escrowId, _milestoneIndex, milestone.amount);

        // Release payment
        _releaseMilestonePayment(_escrowId, _milestoneIndex);
    }

    /**
     * @dev Internal function to release milestone payment
     */
    function _releaseMilestonePayment(uint256 _escrowId, uint256 _milestoneIndex) internal {
        EscrowData storage escrow = escrows[_escrowId];
        Milestone storage milestone = escrow.milestones[_milestoneIndex];
        
        require(milestone.state == MilestoneState.Approved, "Milestone not approved");

        milestone.state = MilestoneState.Released;

        uint256 platformFee = (milestone.amount * escrow.platformFeePercent) / 10000;
        uint256 freelancerAmount = milestone.amount - platformFee;

        if (escrow.paymentToken == address(0)) {
            // ETH payment
            if (platformFee > 0) {
                payable(platformTreasury).transfer(platformFee);
            }
            payable(escrow.freelancer).transfer(freelancerAmount);
        } else {
            // ERC20 token payment
            IERC20 token = IERC20(escrow.paymentToken);
            if (platformFee > 0) {
                token.safeTransfer(platformTreasury, platformFee);
            }
            token.safeTransfer(escrow.freelancer, freelancerAmount);
        }

        emit PaymentReleased(_escrowId, _milestoneIndex, escrow.freelancer, freelancerAmount);

        // Check if all milestones are completed
        _checkEscrowCompletion(_escrowId);
    }

    /**
     * @dev Check if escrow is completed
     */
    function _checkEscrowCompletion(uint256 _escrowId) internal {
        EscrowData storage escrow = escrows[_escrowId];
        
        for (uint256 i = 0; i < escrow.milestones.length; i++) {
            if (escrow.milestones[i].state != MilestoneState.Released) {
                return; // Not all milestones completed
            }
        }

        // All milestones completed
        escrow.state = EscrowState.Completed;
        escrow.completedAt = block.timestamp;

        emit EscrowCompleted(_escrowId);
    }

    /**
     * @dev Raise a dispute
     */
    function raiseDispute(
        uint256 _escrowId,
        string calldata _reason,
        uint256[] calldata _affectedMilestones
    ) external nonReentrant escrowExists(_escrowId) onlyEscrowParties(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(escrow.state == EscrowState.Active, "Escrow not active");
        require(escrow.dispute.state == DisputeState.None, "Dispute already exists");
        require(bytes(_reason).length > 0, "Reason required");

        escrow.dispute = Dispute({
            state: DisputeState.Raised,
            initiator: msg.sender,
            reason: _reason,
            createdAt: block.timestamp,
            resolvedAt: 0,
            resolver: address(0),
            resolution: "",
            affectedMilestones: _affectedMilestones
        });

        escrow.state = EscrowState.Disputed;
        escrow.lastActivity = block.timestamp;

        emit DisputeRaised(_escrowId, msg.sender, _reason);
    }

    /**
     * @dev Resolve a dispute (arbitrator only)
     */
    function resolveDispute(
        uint256 _escrowId,
        string calldata _resolution,
        uint256[] calldata _refundAmounts, // Amount to refund to client for each milestone
        uint256[] calldata _releaseAmounts // Amount to release to freelancer for each milestone
    ) external nonReentrant escrowExists(_escrowId) onlyArbitrator {
        EscrowData storage escrow = escrows[_escrowId];
        require(escrow.state == EscrowState.Disputed, "No active dispute");
        require(escrow.dispute.state == DisputeState.Raised, "Dispute not in raised state");

        escrow.dispute.state = DisputeState.Resolved;
        escrow.dispute.resolver = msg.sender;
        escrow.dispute.resolution = _resolution;
        escrow.dispute.resolvedAt = block.timestamp;

        escrow.state = EscrowState.Active;
        escrow.lastActivity = block.timestamp;

        // Process refunds and releases
        for (uint256 i = 0; i < _refundAmounts.length && i < escrow.milestones.length; i++) {
            if (_refundAmounts[i] > 0) {
                _processRefund(_escrowId, i, _refundAmounts[i]);
            }
            if (_releaseAmounts[i] > 0) {
                _processRelease(_escrowId, i, _releaseAmounts[i]);
            }
        }

        emit DisputeResolved(_escrowId, msg.sender, _resolution);

        // Check if escrow should be completed
        _checkEscrowCompletion(_escrowId);
    }

    /**
     * @dev Process refund to client
     */
    function _processRefund(uint256 _escrowId, uint256 _milestoneIndex, uint256 _amount) internal {
        EscrowData storage escrow = escrows[_escrowId];
        
        if (escrow.paymentToken == address(0)) {
            payable(escrow.client).transfer(_amount);
        } else {
            IERC20(escrow.paymentToken).safeTransfer(escrow.client, _amount);
        }
    }

    /**
     * @dev Process release to freelancer
     */
    function _processRelease(uint256 _escrowId, uint256 _milestoneIndex, uint256 _amount) internal {
        EscrowData storage escrow = escrows[_escrowId];
        
        uint256 platformFee = (_amount * escrow.platformFeePercent) / 10000;
        uint256 freelancerAmount = _amount - platformFee;

        if (escrow.paymentToken == address(0)) {
            if (platformFee > 0) {
                payable(platformTreasury).transfer(platformFee);
            }
            payable(escrow.freelancer).transfer(freelancerAmount);
        } else {
            IERC20 token = IERC20(escrow.paymentToken);
            if (platformFee > 0) {
                token.safeTransfer(platformTreasury, platformFee);
            }
            token.safeTransfer(escrow.freelancer, freelancerAmount);
        }

        emit PaymentReleased(_escrowId, _milestoneIndex, escrow.freelancer, freelancerAmount);
    }

    /**
     * @dev Cancel escrow (only before any milestone submissions)
     */
    function cancelEscrow(uint256 _escrowId) external nonReentrant escrowExists(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.client, "Only client can cancel");
        require(escrow.state == EscrowState.Active, "Escrow not active");

        // Check that no milestones have been submitted
        for (uint256 i = 0; i < escrow.milestones.length; i++) {
            require(
                escrow.milestones[i].state == MilestoneState.Pending,
                "Cannot cancel after milestone submission"
            );
        }

        escrow.state = EscrowState.Cancelled;
        escrow.lastActivity = block.timestamp;

        // Refund full amount to client
        if (escrow.paymentToken == address(0)) {
            payable(escrow.client).transfer(escrow.totalAmount);
        } else {
            IERC20(escrow.paymentToken).safeTransfer(escrow.client, escrow.totalAmount);
        }

        emit EscrowCancelled(_escrowId);
    }

    /**
     * @dev Emergency withdraw (only after long inactivity)
     */
    function emergencyWithdraw(uint256 _escrowId) external nonReentrant escrowExists(_escrowId) {
        EscrowData storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.client || msg.sender == escrow.freelancer,
            "Not authorized"
        );
        require(
            block.timestamp >= escrow.lastActivity + escrow.emergencyWithdrawDelay,
            "Emergency delay not met"
        );
        require(
            escrow.state == EscrowState.Active || escrow.state == EscrowState.Disputed,
            "Invalid escrow state"
        );

        escrow.state = EscrowState.Refunded;

        // Calculate remaining funds
        uint256 remainingAmount = 0;
        for (uint256 i = 0; i < escrow.milestones.length; i++) {
            if (escrow.milestones[i].state != MilestoneState.Released) {
                remainingAmount += escrow.milestones[i].amount;
            }
        }

        if (remainingAmount > 0) {
            // Refund to client in emergency situations
            if (escrow.paymentToken == address(0)) {
                payable(escrow.client).transfer(remainingAmount);
            } else {
                IERC20(escrow.paymentToken).safeTransfer(escrow.client, remainingAmount);
            }

            emit EmergencyWithdraw(_escrowId, escrow.client, remainingAmount);
        }
    }

    // View functions
    function getEscrow(uint256 _escrowId) external view escrowExists(_escrowId) returns (
        uint256 projectId,
        address client,
        address freelancer,
        address paymentToken,
        uint256 totalAmount,
        EscrowState state,
        uint256 createdAt,
        uint256 completedAt
    ) {
        EscrowData storage escrow = escrows[_escrowId];
        return (
            escrow.projectId,
            escrow.client,
            escrow.freelancer,
            escrow.paymentToken,
            escrow.totalAmount,
            escrow.state,
            escrow.createdAt,
            escrow.completedAt
        );
    }

    function getMilestone(uint256 _escrowId, uint256 _milestoneIndex) external view escrowExists(_escrowId) returns (
        uint256 amount,
        string memory description,
        uint256 dueDate,
        MilestoneState state,
        string memory deliverableHash,
        uint256 submittedAt,
        uint256 approvedAt,
        string memory feedback
    ) {
        require(_milestoneIndex < escrows[_escrowId].milestones.length, "Invalid milestone index");
        Milestone storage milestone = escrows[_escrowId].milestones[_milestoneIndex];
        return (
            milestone.amount,
            milestone.description,
            milestone.dueDate,
            milestone.state,
            milestone.deliverableHash,
            milestone.submittedAt,
            milestone.approvedAt,
            milestone.feedback
        );
    }

    function getMilestoneCount(uint256 _escrowId) external view escrowExists(_escrowId) returns (uint256) {
        return escrows[_escrowId].milestones.length;
    }

    function getDispute(uint256 _escrowId) external view escrowExists(_escrowId) returns (
        DisputeState state,
        address initiator,
        string memory reason,
        uint256 createdAt,
        uint256 resolvedAt,
        address resolver,
        string memory resolution
    ) {
        Dispute storage dispute = escrows[_escrowId].dispute;
        return (
            dispute.state,
            dispute.initiator,
            dispute.reason,
            dispute.createdAt,
            dispute.resolvedAt,
            dispute.resolver,
            dispute.resolution
        );
    }

    function getClientEscrows(address _client) external view returns (uint256[] memory) {
        return clientEscrows[_client];
    }

    function getFreelancerEscrows(address _freelancer) external view returns (uint256[] memory) {
        return freelancerEscrows[_freelancer];
    }

    // Admin functions
    function setAuthorizedArbitrator(address _arbitrator, bool _authorized) external onlyOwner {
        authorizedArbitrators[_arbitrator] = _authorized;
    }

    function setPlatformTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        platformTreasury = _treasury;
    }

    function setDefaultPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= MAX_PLATFORM_FEE, "Fee too high");
        defaultPlatformFee = _feePercent;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyPause() external onlyArbitrator {
        _pause();
    }

    receive() external payable {
        revert("Direct payments not accepted");
    }
}
