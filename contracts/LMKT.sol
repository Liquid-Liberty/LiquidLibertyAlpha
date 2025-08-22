// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LMKT is ERC20, Ownable {
    constructor() ERC20("Liberty Market Token", "LMKT") Ownable(msg.sender) {
        // Mint the initial 200 Trillion tokens to the deployer.
        _mint(msg.sender, 2_500_000 * (10**decimals()));
    }

    /**
     * @notice Burns a specific amount of tokens from the caller's account.
     * @dev This function is restricted to the owner of the contract, which should be the Treasury.
     * This replaces the public burn functionality from ERC20Burnable.
     */
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
