// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITreasury {
    function depositCommerceFee(address token, uint256 amount) external;
    function getLmktPriceInUsd() external view returns (uint256);
    function getCollateralTokenValue(uint256 amount, address token) external view returns (uint256);
}