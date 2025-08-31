// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILMKT.sol";

contract LMKT is ERC20, Ownable, ILMKT {
    constructor() ERC20("Liberty Market Token", "LMKT") Ownable(msg.sender) {
        // Mint the full 2.5 million initial supply to establish a sane starting price.
        _mint(msg.sender, 2_500_000 * (10**18));
    }

    function burn(uint256 amount) public override onlyOwner {
        _burn(msg.sender, amount);
    }

    function mint(address to, uint256 amount) public override onlyOwner {
        _mint(to, amount);
    }
}