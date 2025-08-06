// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenericERC20 is ERC20, Ownable {
    uint8 private _decimals;
    mapping(address => bool) public isMinter;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _decimals = decimals_;
        isMinter[msg.sender] = true; // The deployer is a minter by default
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    modifier onlyMinter() {
        require(isMinter[msg.sender], "GenericERC20: caller is not a minter");
        _;
    }

    function addMinter(address _minter) public onlyOwner {
        isMinter[_minter] = true;
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }
}