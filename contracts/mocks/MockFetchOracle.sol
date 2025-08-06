// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockFetchOracle
 * @dev A mock contract that simulates the behavior of the Fetch Oracle for local testing.
 * It allows the owner to submit price values which are then ABI-encoded to match the real
 * oracle's `bytes` return type, ensuring the consumer contract works identically
 * in local and testnet environments.
 */
contract MockFetchOracle is Ownable {
    mapping(bytes32 => bytes) public values;
    mapping(bytes32 => uint256) public timestamps;

    constructor() Ownable(msg.sender) {}

    function submitValue(bytes32 _queryId, uint256 _price) external onlyOwner {
        values[_queryId] = abi.encode(_price);
        timestamps[_queryId] = block.timestamp;
    }

    function getDataAfter(bytes32 _queryId, uint256 /*_timestamp*/)
        public
        view
        returns (bytes memory _value, uint256 _timestampRetrieved)
    {
        require(values[_queryId].length > 0, "MockFetchOracle: No value for queryId");
        return (values[_queryId], timestamps[_queryId]);
    }
}