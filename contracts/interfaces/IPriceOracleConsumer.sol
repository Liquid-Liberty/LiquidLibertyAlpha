// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPriceOracleConsumer {
    function getPrice(bytes32 _queryId) external view returns (uint256);
    function updatePrice(bytes32 _queryId) external;
}