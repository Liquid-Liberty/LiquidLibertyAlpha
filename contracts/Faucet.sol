// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title Faucet (Alpha Test Version)
 * @dev Distributes a one-time package of mock collateral tokens to alpha testers.
 * This contract must be the owner of the token contracts it distributes.
 */
contract Faucet is Ownable {
    // --- State Variables ---
    address public mockDaiToken;
    address public mockWethToken;
    address public mockWbtcToken;

    mapping(address => bool) public hasClaimed;

    // --- Constants ---
    uint256 public constant DAI_AMOUNT = 250 * 1e18; // $250 worth
    uint256 public constant WETH_AMOUNT = 1018 * 1e14; // approx 0.1018 WETH, $250 worth
    // uint256 public constant PLS_AMOUNT = 10224948 * 1e18; // $250 worth
    uint256 public constant WBTC_AMOUNT = 231000; // approx 0.00231 WBTC, $250 worth

    // --- Events ---
    event TokensClaimed(address indexed user);

    constructor(
        address _daiAddr,
        address _wethAddr,
        address _wbtcAddr
    ) Ownable(msg.sender) {
        mockDaiToken = _daiAddr;
        mockWethToken = _wethAddr;
        mockWbtcToken = _wbtcAddr;
    }

    /**
     * @notice Allows a user to claim their one-time package of testnet tokens.
     */
    function requestTokens() external {
        require(!hasClaimed[msg.sender], "Faucet: Tokens already claimed");
        hasClaimed[msg.sender] = true;

        // --- CORRECTED: Only mint if the token address is valid ---
        if (mockDaiToken != address(0)) {
            IMintable(mockDaiToken).mint(msg.sender, DAI_AMOUNT);
        }
        if (mockWethToken != address(0)) {
            IMintable(mockWethToken).mint(msg.sender, WETH_AMOUNT);
        }
        if (mockWbtcToken != address(0)) {
            IMintable(mockWbtcToken).mint(msg.sender, WBTC_AMOUNT);
        }

        emit TokensClaimed(msg.sender);
    }

    /**
     * @notice Allows the owner to update the token contract addresses.
     * @param _daiAddr The new address for the Mock DAI token.
     * @param _wethAddr The new address for the Mock WETH token.
     * @param _wbtcAddr The new address for the Mock WBTC token.
     */
    function updateTokenAddresses(
        address _daiAddr,
        address _wethAddr,
        address _wbtcAddr
    ) external onlyOwner {
        mockDaiToken = _daiAddr;
        mockWethToken = _wethAddr;
        mockWbtcToken = _wbtcAddr;
    }
}
