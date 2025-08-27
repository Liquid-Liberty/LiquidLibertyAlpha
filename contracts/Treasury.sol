// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/ILMKT.sol";

interface IPriceOracle {
    function getPrice(bytes32 _queryId) external view returns (uint256);
}

contract Treasury is Ownable, ReentrancyGuard {
    event MKTSwap(address indexed sender, address indexed collateralToken, uint256 collateralAmount, uint256 lmktAmount, uint256 totalCollateral, uint256 circulatingSupply, bool isBuy);
    event CollateralWhitelisted(address indexed token, bool isWhitelisted);
    event CommerceFeeReceived(address indexed token, uint256 amount);
    event PriceFeedSet(address indexed token, address indexed feed);
    event TokenQueryIdSet(address indexed token, bytes32 indexed queryId);

    ILMKT public lmktToken;
    mapping(address => bool) public isWhitelistedCollateral;
    address[] public whitelistedCollateralTokens;
    mapping(address => address) public tokenPriceFeeds;
    mapping(address => bytes32) public tokenQueryIds;

    uint256 public SELL_PREMIUM = 100;
    uint256 public BUY_DISCOUNT = 100;
    uint256 public BURN_RATE = 10000;
    uint256 public constant SPREAD_BASE = 10000;
    uint8 public constant ORACLE_PRICE_DECIMALS = 8;

    constructor() Ownable(msg.sender) {}

    // --- Admin Functions ---
    function setFeeRate(uint256 _sellFee, uint256 _buyFee, uint256 _burnFee) external onlyOwner {
        SELL_PREMIUM = _sellFee;
        BUY_DISCOUNT = _buyFee;
        BURN_RATE = _burnFee;
    }
    
    function setLmktAddress(address _lmktTokenAddress) external onlyOwner {
        lmktToken = ILMKT(_lmktTokenAddress);
    }

    function setPriceFeed(address _token, address _feedAddress) external onlyOwner {
        require(isWhitelistedCollateral[_token], "Treasury: Token not whitelisted");
        tokenPriceFeeds[_token] = _feedAddress;
        emit PriceFeedSet(_token, _feedAddress);
    }

    function setTokenQueryId(address _token, bytes32 _queryId) external onlyOwner {
        require(isWhitelistedCollateral[_token], "Treasury: Token not whitelisted");
        tokenQueryIds[_token] = _queryId;
        emit TokenQueryIdSet(_token, _queryId);
    }

    function setWhitelistedCollateral(address token, bool isWhitelisted) external onlyOwner {
        isWhitelistedCollateral[token] = isWhitelisted;
        if (isWhitelisted) {
            for (uint i = 0; i < whitelistedCollateralTokens.length; i++) {
                if (whitelistedCollateralTokens[i] == token) return;
            }
            whitelistedCollateralTokens.push(token);
        } else {
            for (uint i = 0; i < whitelistedCollateralTokens.length; i++) {
                if (whitelistedCollateralTokens[i] == token) {
                    whitelistedCollateralTokens[i] = whitelistedCollateralTokens[whitelistedCollateralTokens.length - 1];
                    whitelistedCollateralTokens.pop();
                    break;
                }
            }
        }
        emit CollateralWhitelisted(token, isWhitelisted);
    }

    // --- Core Functions ---
    function buyMkt(uint256 collateralAmount, address collateralToken) external nonReentrant {
        require(isWhitelistedCollateral[collateralToken], "Treasury: Token not whitelisted");
        
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        // --- NOTE --- lmktToken must be minted to this contract address for this to work.
        uint256 lmktToSend = getLmktAmountForCollateral(collateralAmount, collateralToken);
        lmktToken.transfer(msg.sender, lmktToSend);
        
        uint256 totalCollateral = getTotalCollateralValue();
        uint256 circulatingSupply = _getLmktCirculatingSupply();
        emit MKTSwap(msg.sender, collateralToken, collateralAmount, lmktToSend, totalCollateral, circulatingSupply, true);
    }

    function sellMkt(uint256 lmktAmount, address collateralToken) external nonReentrant {
        require(isWhitelistedCollateral[collateralToken], "Treasury: Token not whitelisted");

        lmktToken.transferFrom(msg.sender, address(this), lmktAmount);

        uint256 burnAmount = (lmktAmount * BURN_RATE) / SPREAD_BASE;
        uint256 remainingAmount = lmktAmount - burnAmount;

        if (burnAmount > 0) {
            lmktToken.burn(burnAmount);
        }
        
        uint256 collateralToSend = 0;
        if (remainingAmount > 0) {
            // Price is calculated AFTER the burn, using the new smaller total supply
            collateralToSend = getCollateralAmountForLmkt(remainingAmount, collateralToken);
        }

        require(IERC20(collateralToken).balanceOf(address(this)) >= collateralToSend, "Treasury: Insufficient reserves");
        if (collateralToSend > 0) {
            IERC20(collateralToken).transfer(msg.sender, collateralToSend);
        }

        uint256 totalCollateral = getTotalCollateralValue();
        uint256 circulatingSupply = _getLmktCirculatingSupply();
        emit MKTSwap(msg.sender, collateralToken, collateralToSend, lmktAmount, totalCollateral, circulatingSupply, false);
    }

    function depositCommerceFee(address token, uint256 amount) external {
        require(token == address(lmktToken) || isWhitelistedCollateral[token], "Treasury: Invalid token");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit CommerceFeeReceived(token, amount);
    }

    // --- View Functions ---
    function getLmktAmountForCollateral(uint256 collateralAmount, address collateralToken) public view returns (uint256) {
        uint256 collateralValue = getCollateralTokenValue(collateralAmount, collateralToken);
        uint256 totalCollateral = getTotalCollateralValue();
        // --- CHANGED --- Uses circulating supply for calculation
        uint256 circulatingSupply = _getLmktCirculatingSupply();

        if (totalCollateral == 0) return 0;
        uint256 baseLmktAmount = (collateralValue * circulatingSupply) / totalCollateral;
        return (baseLmktAmount * (SPREAD_BASE - BUY_DISCOUNT)) / SPREAD_BASE;
    }

    function getCollateralAmountForLmkt(uint256 lmktAmount, address collateralToken) public view returns (uint256) {
        uint256 totalCollateral = getTotalCollateralValue();
        // --- CHANGED --- Uses circulating supply for calculation
        uint256 circulatingSupply = _getLmktCirculatingSupply();

        if (circulatingSupply == 0) return 0;

        uint256 baseCollateralValue = (lmktAmount * totalCollateral) / circulatingSupply;
        uint256 discountedValue = (baseCollateralValue * (SPREAD_BASE - SELL_PREMIUM)) / SPREAD_BASE;

        address feedAddress = tokenPriceFeeds[collateralToken];
        require(feedAddress != address(0), "Treasury: Price feed not set");
        bytes32 queryId = tokenQueryIds[collateralToken];
        require(queryId != bytes32(0), "Treasury: Query ID not set");
        
        IPriceOracle priceOracle = IPriceOracle(feedAddress);
        uint256 price = priceOracle.getPrice(queryId);
        require(price > 0, "Treasury: Oracle price is zero");

        uint8 tokenDecimals = IERC20Metadata(collateralToken).decimals();
        return (discountedValue * (10**tokenDecimals) * (10**ORACLE_PRICE_DECIMALS)) / (price * (10**18));
    }

    function getTotalCollateralValue() public view returns (uint256) {
        uint256 totalValue = 0;
        for (uint i = 0; i < whitelistedCollateralTokens.length; i++) {
            address token = whitelistedCollateralTokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                totalValue += getCollateralTokenValue(balance, token);
            }
        }
        return totalValue;
    }
    
    function getCollateralTokenValue(uint256 amount, address token) public view returns (uint256) {
        address feedAddress = tokenPriceFeeds[token];
        require(feedAddress != address(0), "Treasury: Price feed not set");
        bytes32 queryId = tokenQueryIds[token];
        require(queryId != bytes32(0), "Treasury: Query ID not set");

        IPriceOracle priceOracle = IPriceOracle(feedAddress);
        uint256 price = priceOracle.getPrice(queryId);
        require(price > 0, "Treasury: Oracle price is zero");

        uint8 tokenDecimals = IERC20Metadata(token).decimals();
        return (amount * price * (10**(18 - ORACLE_PRICE_DECIMALS))) / (10**tokenDecimals);
    }
    
    function getLmktUsdValue(uint256 lmktAmount) public view returns (uint256) {
        uint256 totalCollateralUSD = getTotalCollateralValue();
        // --- CHANGED --- Uses circulating supply for calculation
        uint256 circulatingSupply = _getLmktCirculatingSupply();

        if (circulatingSupply == 0) return 0;
        return (lmktAmount * totalCollateralUSD) / circulatingSupply;
    }

    function getLmktMarketCap() public view returns (uint256) {
        return getTotalCollateralValue(); // Market Cap is equal to the total value of backing collateral
    }

    // --- NEW --- Internal helper function for consistency
    function _getLmktCirculatingSupply() internal view returns (uint256) {
        if (address(lmktToken) == address(0)) return 0;
        uint256 supply = lmktToken.totalSupply();
        uint256 burned = lmktToken.balanceOf(address(0));
        return supply > burned ? supply - burned : 0;
    }
    
    receive() external payable {}
}