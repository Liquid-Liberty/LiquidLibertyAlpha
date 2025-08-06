// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UsingFetch {
    address payable public fetchAddress;

    constructor(address payable _fetchAddress) {
        fetchAddress = _fetchAddress;
    }

    function getDataAfter(bytes32 _queryId, uint256 _timestamp)
        public
        view
        returns (uint256 _value, uint256 _timestampRetrieved)
    {
        // CORRECTED: The mock price for our stablecoin collateral is now $1.
        // This value is $1 with 8 decimals of precision.
        _value = 1 * 10**8; 
        _timestampRetrieved = block.timestamp;
    }
}