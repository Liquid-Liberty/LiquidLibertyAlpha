// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ILMKT Interface
 * @dev Defines the external functions for the LMKT token contract,
 * including standard ERC20 functions and custom protocol functions.
 */
interface ILMKT is IERC20 {
    /**
     * @notice Burns a specific amount of tokens from the caller's balance.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) external;

    /**
     * @notice Creates new tokens and assigns them to a specified account.
     * @dev This function is expected to have restricted access (e.g., onlyOwner).
     * @param to The account that will receive the new tokens.
     * @param amount The amount of new tokens to create.
     */
    function mint(address to, uint256 amount) external;
}
