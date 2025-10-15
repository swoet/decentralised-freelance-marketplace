// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    address public offsetWallet;
    address public socialWallet;
    uint256 public offsetBps; // basis points (0-10000)
    uint256 public socialBps; // basis points (0-10000)

    event Distributed(uint256 total, uint256 toOffset, uint256 toSocial);

    constructor(address _owner, address _offsetWallet, address _socialWallet, uint256 _offsetBps, uint256 _socialBps) {
        _transferOwnership(_owner);
        offsetWallet = _offsetWallet;
        socialWallet = _socialWallet;
        require(_offsetBps + _socialBps <= 10000, "bps too high");
        offsetBps = _offsetBps;
        socialBps = _socialBps;
    }

    receive() external payable {}

    function setSplits(uint256 _offsetBps, uint256 _socialBps) external onlyOwner {
        require(_offsetBps + _socialBps <= 10000, "bps too high");
        offsetBps = _offsetBps;
        socialBps = _socialBps;
    }

    function setWallets(address _offset, address _social) external onlyOwner {
        offsetWallet = _offset;
        socialWallet = _social;
    }

    function distribute() external {
        uint256 bal = address(this).balance;
        require(bal > 0, "nothing to distribute");
        uint256 toOffset = (bal * offsetBps) / 10000;
        uint256 toSocial = (bal * socialBps) / 10000;
        if (toOffset > 0) {
            (bool s, ) = offsetWallet.call{value: toOffset}("");
            require(s, "offset transfer failed");
        }
        if (toSocial > 0) {
            (bool s2, ) = socialWallet.call{value: toSocial}("");
            require(s2, "social transfer failed");
        }
        emit Distributed(bal, toOffset, toSocial);
    }
}
