// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenericERC20 is ERC20, Ownable {
    uint8 private _customDecimals; // ADDED: State variable to hold decimals
    mapping(address => bool) public isMinter;

    event MinterAdded(address indexed newMinter);
    event MinterRemoved(address indexed removedMinter);

    modifier onlyMinter() {
        require(isMinter[msg.sender], "GenericERC20: caller is not a minter");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _customDecimals = decimals_; // CHANGED: Set the state variable
        isMinter[msg.sender] = true;
        emit MinterAdded(msg.sender);
    }
    
    // ADDED: Override the decimals function to return our custom value
    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }

    function addMinter(address _minter) public onlyOwner {
        require(!isMinter[_minter], "GenericERC20: address is already a minter");
        isMinter[_minter] = true;
        emit MinterAdded(_minter);
    }

    function removeMinter(address _minter) public onlyOwner {
        require(isMinter[_minter], "GenericERC20: address is not a minter");
        isMinter[_minter] = false;
        emit MinterRemoved(_minter);
    }

    function mint(address to, uint256 amount) public virtual onlyMinter {
        _mint(to, amount);
    }
}