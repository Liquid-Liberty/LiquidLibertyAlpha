// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TWAP Chainlink-Compatible Price Feed
 * @notice Fetches TWAP prices from Uniswap V2-style DEX and exposes them in Chainlink AggregatorV3Interface + latestAnswer format.
 */

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

interface AggregatorInterface {
    function latestAnswer() external view returns (int256);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
}

contract MockPriceFeed is AggregatorV3Interface, AggregatorInterface {
    IUniswapV2Pair public immutable pair;
    address public immutable token0;
    address public immutable token1;

    uint8 public immutable override decimals;
    string public override description;
    uint256 public immutable override version = 1;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint32 public blockTimestampLast;

    uint256 public price0Average; // Q112 fixed point
    uint256 public price1Average;

    address public pairPriceFeed;

    uint80 private roundId;

    constructor(address _pair, string memory _description, uint8 _decimals, address _pairPriceFeed) {
        pair = IUniswapV2Pair(_pair);
        token0 = pair.token0();
        token1 = pair.token1();
        decimals = _decimals;
        description = _description;
        pairPriceFeed = _pairPriceFeed;
        require(_pairPriceFeed != address(0), "Invalid pair price feed address");
        price0CumulativeLast = pair.price0CumulativeLast();
        price1CumulativeLast = pair.price1CumulativeLast();
        (, , blockTimestampLast) = pair.getReserves();
        roundId = 1;
    }

    /**
     * @notice Updates TWAP and increments roundId
     */
    function update() external {
        uint256 price0Cumulative = pair.price0CumulativeLast();
        uint256 price1Cumulative = pair.price1CumulativeLast();

        (, , uint32 blockTimestamp) = pair.getReserves();
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;

        require(timeElapsed > 0, "No time elapsed");

        price0Average = (price0Cumulative - price0CumulativeLast) / timeElapsed;
        price1Average = (price1Cumulative - price1CumulativeLast) / timeElapsed;

        price0CumulativeLast = price0Cumulative;
        price1CumulativeLast = price1Cumulative;
        blockTimestampLast = blockTimestamp;

        roundId++;
    }

    /**
     * @dev Chainlink-style latest round data
     */
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 _roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        uint256 price = (price0Average * 1e18) >> 112; // always compute with 18 decimals
        price = price / (10 ** (18 - decimals)); // scale down to Chainlink decimals
        uint256 pairPrice = uint256(AggregatorInterface(pairPriceFeed).latestAnswer());
        price = pairPrice * price / 1e8;

        _roundId = roundId;
        answer = int256(price);
        startedAt = blockTimestampLast;
        updatedAt = blockTimestampLast;
        answeredInRound = roundId;
    }

    /**
     * @dev Legacy Chainlink latestAnswer() support
     */
    function latestAnswer() external view override returns (int256) {
        uint256 price = (price0Average * 1e18) >> 112; // always compute with 18 decimals
        price = price / (10 ** (18 - decimals)); // scale down to Chainlink decimals
        uint256 pairPrice = uint256(AggregatorInterface(pairPriceFeed).latestAnswer());
        price = pairPrice * price / 1e8;
        return int256(price);
    }
}
