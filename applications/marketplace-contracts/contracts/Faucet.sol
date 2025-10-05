// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

contract Faucet is Ownable {
    address public mockDaiToken;
    // --- CHANGE: Replaced the bool mapping with a timestamp mapping ---
    mapping(address => uint256) public lastClaimedTimestamp;
    uint256 public constant DAI_AMOUNT = 250 * 1e18;
    event TokensClaimed(address indexed user);

    constructor(address _daiAddr) Ownable(msg.sender) {
        mockDaiToken = _daiAddr;
    }

    function requestTokens() external {
        // --- CHANGE: Check if 24 hours have passed since the last claim ---
        require(
            block.timestamp >= lastClaimedTimestamp[msg.sender] + 24 hours,
            "Faucet: You can only claim once every 24 hours"
        );
        // --- CHANGE: Update the user's last claim timestamp to the current time ---
        lastClaimedTimestamp[msg.sender] = block.timestamp;

        if (mockDaiToken != address(0)) {
            IMintable(mockDaiToken).mint(msg.sender, DAI_AMOUNT);
        }
        emit TokensClaimed(msg.sender);
    }
    
    // --- Optional Utility Functions ---

    function updateTokenAddress(address _daiAddr) external onlyOwner {
        mockDaiToken = _daiAddr;
    }

    // --- CHANGE: Renamed function and updated logic for the new timestamp system ---
    function resetTimestamp(address _user) external onlyOwner {
        lastClaimedTimestamp[_user] = 0;
    }

    function withdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}