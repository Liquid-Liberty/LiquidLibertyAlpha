// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// CORRECTED: Constructor updated for new deployment pattern.
contract LMKT is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("Liberty Market Token", "LMKT") Ownable(msg.sender) {
        // Mint the initial 200 Trillion tokens to the deployer.
        _mint(msg.sender, 200_000_000_000_000 * (10**decimals()));
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
