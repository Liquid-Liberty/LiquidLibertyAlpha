// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

contract Faucet is Ownable {
    address public mockDaiToken;
    mapping(address => bool) public hasClaimed;
    uint256 public constant DAI_AMOUNT = 250 * 1e18;
    event TokensClaimed(address indexed user);

    constructor(address _daiAddr) Ownable(msg.sender) {
        mockDaiToken = _daiAddr;
    }

    function requestTokens() external {
        require(!hasClaimed[msg.sender], "Faucet: Tokens already claimed");
        hasClaimed[msg.sender] = true;

        if (mockDaiToken != address(0)) {
            IMintable(mockDaiToken).mint(msg.sender, DAI_AMOUNT);
        }
        emit TokensClaimed(msg.sender);
    }
    
    // --- Optional Utility Functions ---

    function updateTokenAddress(address _daiAddr) external onlyOwner {
        mockDaiToken = _daiAddr;
    }

    function resetClaim(address _user) external onlyOwner {
        hasClaimed[_user] = false;
    }

    function withdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}