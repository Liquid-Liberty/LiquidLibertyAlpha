// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPriceFeed
 * @dev A mock contract that simulates a price feed for local testing.
 * It allows the owner to submit price values, making it easy to test contracts
 * that depend on external price data.
 */
contract MockPriceFeed is Ownable {
    uint256 public value;
    uint256 public decimals;

    constructor(uint256 _initialValue, uint256 _decimals) Ownable(msg.sender) {
        value = _initialValue;
        decimals = _decimals;
    }

    function updateValue(uint256 _value) external onlyOwner {
        value = _value;
    }

    function getPrice(bytes32 _queryId) external view returns(uint256){
        return value;
    }

    // Function to return the value directly.  No encoding is needed for this mock.
    function getDataAfter(bytes32 _queryId, uint256 _timestamp)
        external
        view
        returns (uint256 _value, uint256 _timestampRetrieved)
    {
        return (value, block.timestamp);
    }
}