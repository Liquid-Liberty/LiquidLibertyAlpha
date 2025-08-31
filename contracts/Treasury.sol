// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ILMKT.sol";
import "./mocks/MockPriceOracle.sol"; // Using the mock oracle interface
import "./interfaces/ITreasury.sol";

contract Treasury is Ownable, ReentrancyGuard, ITreasury {
    using SafeERC20 for IERC20;
    using SafeERC20 for ILMKT;

    // --- Events ---
    event MKTSwap(address indexed sender, address indexed collateralToken, uint256 collateralAmount, uint256 lmktAmount, uint256 totalCollateral, uint256 circulatingSupply, bool isBuy);
    event CollateralWhitelisted(address indexed token, bool isWhitelisted);
    event CommerceFeeReceived(address indexed token, uint256 amount);
    event PriceFeedSet(address indexed token, address indexed feed);
    event TokenQueryIdSet(address indexed token, bytes32 indexed queryId);
    event FeeRateSet(uint256 sellPremium, uint256 buyDiscount, uint256 burnRate);

    // --- State Variables ---
    ILMKT public lmktToken;
    mapping(address => bool) public isWhitelistedCollateral;
    address[] public whitelistedCollateralTokens;
    mapping(address => IPriceOracle) public tokenPriceFeeds;
    mapping(address => bytes32) public tokenQueryIds;

    uint256 public SELL_PREMIUM = 100; // 1%
    uint256 public BUY_DISCOUNT = 100; // 1%
    uint256 public BURN_RATE = 100;    // 1%
    uint256 public constant SPREAD_BASE = 10000;
    uint8 public constant ORACLE_PRICE_DECIMALS = 8;
    uint8 public constant LMKT_PRICE_DECIMALS = 8; // LMKT price will be represented with 8 decimals

    constructor() Ownable(msg.sender) {}

    // --- Admin Functions ---
    function setFeeRate(uint256 _sellPremium, uint256 _buyDiscount, uint256 _burnRate) external onlyOwner {
        SELL_PREMIUM = _sellPremium;
        BUY_DISCOUNT = _buyDiscount;
        BURN_RATE = _burnRate;
        emit FeeRateSet(_sellPremium, _buyDiscount, _burnRate);
    }
    
    function setLmktAddress(address _lmktTokenAddress) external onlyOwner {
        lmktToken = ILMKT(_lmktTokenAddress);
    }

    function setPriceFeed(address _token, address _feedAddress) external onlyOwner {
        require(isWhitelistedCollateral[_token], "Treasury: Token not whitelisted");
        tokenPriceFeeds[_token] = IPriceOracle(_feedAddress);
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
    function buyMkt(uint256 collateralAmount, address collateralToken, uint256 minLmktOut) external nonReentrant {
        require(collateralAmount > 0, "Treasury: Amount must be > 0");
        require(isWhitelistedCollateral[collateralToken], "Treasury: Token not whitelisted");
        
        IERC20(collateralToken).safeTransferFrom(msg.sender, address(this), collateralAmount);

        uint256 lmktToSend = getLmktAmountForCollateral(collateralAmount, collateralToken);
        require(lmktToSend >= minLmktOut, "Treasury: Slippage tolerance exceeded");

        lmktToken.safeTransfer(msg.sender, lmktToSend);
        
        emit MKTSwap(msg.sender, collateralToken, collateralAmount, lmktToSend, getTotalCollateralValue(), lmktToken.totalSupply(), true);
    }

    function sellMkt(uint256 lmktAmount, address collateralToken, uint256 minCollateralOut) external nonReentrant {
        require(lmktAmount > 0, "Treasury: Amount must be > 0");
        require(isWhitelistedCollateral[collateralToken], "Treasury: Token not whitelisted");

        lmktToken.safeTransferFrom(msg.sender, address(this), lmktAmount);

        uint256 burnAmount = (lmktAmount * BURN_RATE) / SPREAD_BASE;
        if (burnAmount > 0) {
            lmktToken.burn(burnAmount);
        }
        
        uint256 remainingAmount = lmktAmount - burnAmount;
        uint256 collateralToSend = 0;
        if (remainingAmount > 0) {
            collateralToSend = getCollateralAmountForLmkt(remainingAmount, collateralToken);
        }
        
        require(collateralToSend >= minCollateralOut, "Treasury: Slippage tolerance exceeded");
        
        if (collateralToSend > 0) {
            IERC20(collateralToken).safeTransfer(msg.sender, collateralToSend);
        }

        emit MKTSwap(msg.sender, collateralToken, collateralToSend, lmktAmount, getTotalCollateralValue(), lmktToken.totalSupply(), false);
    }

    function depositCommerceFee(address token, uint256 amount) external override {
        require(token == address(lmktToken) || isWhitelistedCollateral[token], "Treasury: Invalid token");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit CommerceFeeReceived(token, amount);
    }
    
    // --- View Functions ---
    function getLmktAmountForCollateral(uint256 collateralAmount, address collateralToken) public view returns (uint256) {
        uint256 collateralValue = getCollateralTokenValue(collateralAmount, collateralToken);
        uint256 totalCollateral = getTotalCollateralValue();
        uint256 circulatingSupply = lmktToken.totalSupply();

        if (totalCollateral == 0 || circulatingSupply == 0) return 0;
        uint256 baseLmktAmount = (collateralValue * circulatingSupply) / totalCollateral;
        return (baseLmktAmount * (SPREAD_BASE - BUY_DISCOUNT)) / SPREAD_BASE;
    }

    function getCollateralAmountForLmkt(uint256 lmktAmount, address collateralToken) public view returns (uint256) {
        uint256 totalCollateral = getTotalCollateralValue();
        uint256 circulatingSupply = lmktToken.totalSupply();

        if (circulatingSupply == 0) return 0;

        uint256 baseCollateralValue = (lmktAmount * totalCollateral) / circulatingSupply;
        uint256 discountedValue = (baseCollateralValue * (SPREAD_BASE - SELL_PREMIUM)) / SPREAD_BASE;

        IPriceOracle priceOracle = tokenPriceFeeds[collateralToken];
        require(address(priceOracle) != address(0), "Treasury: Price feed not set");
        bytes32 queryId = tokenQueryIds[collateralToken];
        require(queryId != bytes32(0), "Treasury: Query ID not set");
        
        uint256 price = priceOracle.getPrice(queryId);
        require(price > 0, "Treasury: Oracle price is zero");

        uint8 tokenDecimals = IERC20Metadata(collateralToken).decimals();
        // The collateral value has 18 decimals, so we adjust for oracle and token decimals
        return (discountedValue * (10**tokenDecimals)) / (price * (10**(18 - ORACLE_PRICE_DECIMALS)));
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
    
    function getCollateralTokenValue(uint256 amount, address token) public view override returns (uint256) {
        IPriceOracle priceOracle = tokenPriceFeeds[token];
        require(address(priceOracle) != address(0), "Treasury: Price feed not set");
        bytes32 queryId = tokenQueryIds[token];
        require(queryId != bytes32(0), "Treasury: Query ID not set");

        uint256 price = priceOracle.getPrice(queryId);
        require(price > 0, "Treasury: Oracle price is zero");

        uint8 tokenDecimals = IERC20Metadata(token).decimals();
        // Returns value with 18 decimals of precision
        return (amount * price * (10**(18 - ORACLE_PRICE_DECIMALS))) / (10**tokenDecimals);
    }
    
    function getLmktPriceInUsd() public view override returns (uint256) {
        uint256 totalCollateralUSD = getTotalCollateralValue();
        uint256 circulatingSupply = lmktToken.totalSupply();

        if (circulatingSupply == 0) return 0;
        // Return price with LMKT_PRICE_DECIMALS (8) decimals of precision
        return (totalCollateralUSD * (10**LMKT_PRICE_DECIMALS)) / circulatingSupply;
    }
}