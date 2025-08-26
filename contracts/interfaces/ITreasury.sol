// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITreasury Interface
 * @dev Defines the external functions for the Treasury contract that other
 * contracts within the protocol need to interact with.
 */
interface ITreasury {
    /**
     * @notice Receives commerce fee revenue from the PaymentProcessor.
     * @dev This function is expected to have restricted access.
     * @param token The address of the token being deposited.
     * @param amount The amount of the token being deposited.
     */
    function depositCommerceFee(address token, uint256 amount) external;

    function getLMKTPrice() external view returns (uint256);
}
