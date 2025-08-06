// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Matched to other contracts

import "./UsingFetch.sol";

contract PriceOracleConsumer is UsingFetch {
    mapping(bytes32 => uint256) public prices;
    mapping(bytes32 => uint256) public timestamps;

    event PriceFetched(bytes32 indexed queryId, uint256 price, uint256 timestamp);

    constructor(address payable _fetchAddress)
        UsingFetch(_fetchAddress)
    {}

    // This function was missing from the version of the file your test was using.
    function fetchLatestPrice(bytes32 _queryId) public {
        (uint256 value, uint256 timestampRetrieved) = getDataAfter(_queryId, 0);

        prices[_queryId] = value;
        timestamps[_queryId] = timestampRetrieved;

        emit PriceFetched(_queryId, value, timestampRetrieved);
    }

    function getPrice(bytes32 _queryId) public view returns (uint256) {
        return prices[_queryId];
    }

    function getLastUpdatedTimestamp(bytes32 _queryId) public view returns (uint256) {
        return timestamps[_queryId];
    }
}