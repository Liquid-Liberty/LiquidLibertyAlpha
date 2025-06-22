// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title Faucet (Alpha Test Version)
 * @dev Distributes a one-time package of mock collateral tokens to alpha testers.
 * This contract must be the owner of the token contracts it distributes.
 */
contract Faucet {
    // --- State Variables ---
    address public mockDaiToken;
    address public mockWethToken;
    address public mockWbtcToken;
    address public mockPlsToken;

    mapping(address => bool) public hasClaimed;

    // --- Constants ---
    uint256 public constant DAI_AMOUNT = 250 * 1e18;
    uint256 public constant WETH_AMOUNT = 250 * 1e18;
    uint256 public constant PLS_AMOUNT = 250 * 1e18;
    uint256 public constant WBTC_AMOUNT = 250 * 1e8;

    // --- Events ---
    event TokensClaimed(address indexed user);

    constructor(
        address _daiAddr,
        address _wethAddr,
        address _wbtcAddr,
        address _plsAddr
    ) {
        mockDaiToken = _daiAddr;
        mockWethToken = _wethAddr;
        mockWbtcToken = _wbtcAddr;
        mockPlsToken = _plsAddr;
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
        if (mockPlsToken != address(0)) {
            IMintable(mockPlsToken).mint(msg.sender, PLS_AMOUNT);
        }

        emit TokensClaimed(msg.sender);
    }
}
