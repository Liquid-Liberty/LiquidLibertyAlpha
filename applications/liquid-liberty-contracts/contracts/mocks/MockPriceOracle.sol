// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPriceOracle {
    function getPrice(bytes32 _queryId) external view returns (uint256);
}

contract MockPriceOracle is Ownable, IPriceOracle {
    mapping(bytes32 => uint256) public prices;

    event PriceSet(bytes32 indexed queryId, uint256 price);

    constructor() Ownable(msg.sender) {}

    function getPrice(bytes32 _queryId) external view override returns (uint256) {
        uint256 price = prices[_queryId];
        require(price > 0, "MockOracle: Price not set for this ID");
        return price;
    }

    function setPrice(bytes32 _queryId, uint256 _price) external onlyOwner {
        prices[_queryId] = _price;
        emit PriceSet(_queryId, _price);
    }
}