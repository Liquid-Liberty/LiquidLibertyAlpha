// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// This is the true interface for the Fetch Oracle contract,
// defining the function we will call to get data.
interface IFetch {
    function getDataAfter(bytes32 _queryId, uint256 _timestamp)
        external
        view
        returns (bytes memory _value, uint256 _timestampRetrieved);
}