// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/ILMKT.sol";

contract Treasury is Ownable, ReentrancyGuard {
    event MktPurchased(address indexed buyer, address indexed collateralToken, uint256 collateralAmount, uint256 lmktAmount);
    event MktSold(address indexed seller, uint256 lmktAmount, uint256 collateralAmount, address indexed collateralToken);
    event CollateralWhitelisted(address indexed token, bool isWhitelisted);
    event CommerceFeeReceived(address indexed token, uint256 amount);

    ILMKT public lmktToken;
    mapping(address => bool) public isWhitelistedCollateral;
    address[] public whitelistedCollateralTokens;

    uint256 public constant SELL_PREMIUM = 100; // 1%
    uint256 public constant BUY_DISCOUNT = 100;  // 1%
    uint256 public constant BURN_RATE = 5;       // 0.05%
    uint256 public constant SPREAD_BASE = 10000;
    uint256 public constant HOLDING_CAP_PERCENT = 5; // 0.5%
    uint256 public constant HOLDING_CAP_BASE = 1000;

    constructor() Ownable(msg.sender) {}
    
    function setLmktAddress(address _lmktTokenAddress) external onlyOwner {
        require(address(lmktToken) == address(0), "Treasury: LMKT address already set");
        lmktToken = ILMKT(_lmktTokenAddress);
    }

    function buyMkt(uint256 collateralAmount, address collateralToken) external nonReentrant {
        require(isWhitelistedCollateral[collateralToken], "Treasury: Token not whitelisted");
        uint256 lmktToSend = getLmktAmountForCollateral(collateralAmount, collateralToken);
        uint256 holdingCap = (lmktToken.totalSupply() * HOLDING_CAP_PERCENT) / HOLDING_CAP_BASE;
        require(lmktToken.balanceOf(msg.sender) + lmktToSend <= holdingCap, "Treasury: Purchase exceeds holding cap");
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        lmktToken.transfer(msg.sender, lmktToSend);
        emit MktPurchased(msg.sender, collateralToken, collateralAmount, lmktToSend);
    }

    function sellMkt(uint256 lmktAmount, address collateralToken) external nonReentrant {
        require(isWhitelistedCollateral[collateralToken], "Treasury: Token not whitelisted");
        uint256 burnAmount = (lmktAmount * BURN_RATE) / SPREAD_BASE;
        uint256 remainingAmount = lmktAmount - burnAmount;
        uint256 collateralToSend = getCollateralAmountForLmkt(remainingAmount, collateralToken);
        require(IERC20(collateralToken).balanceOf(address(this)) >= collateralToSend, "Treasury: Insufficient reserves for this collateral");
        lmktToken.transferFrom(msg.sender, address(this), lmktAmount);
        lmktToken.burn(burnAmount);
        IERC20(collateralToken).transfer(msg.sender, collateralToSend);
        emit MktSold(msg.sender, lmktAmount, collateralToSend, collateralToken);
    }

    function depositCommerceFee(address token, uint256 amount) external {
        require(token == address(lmktToken) || isWhitelistedCollateral[token], "Treasury: Can only receive whitelisted tokens");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit CommerceFeeReceived(token, amount);
    }

    function setWhitelistedCollateral(address token, bool isWhitelisted) external onlyOwner {
        isWhitelistedCollateral[token] = isWhitelisted;
        if (isWhitelisted) {
            for (uint i = 0; i < whitelistedCollateralTokens.length; i++) { if (whitelistedCollateralTokens[i] == token) return; }
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

    // --- Price Calculation & View Functions (Rewritten for Precision) ---
    
    function getLmktAmountForCollateral(uint256 collateralAmount, address collateralToken) public view returns (uint256) {
        uint256 collateralValue = getCollateralTokenValue(collateralAmount, collateralToken);
        uint256 totalCollateral = getTotalCollateralValue();
        uint256 lmktSupply = lmktToken.totalSupply();
        if (totalCollateral == 0) return 0;
        
        uint256 baseLmktAmount = (collateralValue * lmktSupply) / totalCollateral;
        // Apply 1% sell premium (user gets fewer LMKT)
        return (baseLmktAmount * (SPREAD_BASE - SELL_PREMIUM)) / SPREAD_BASE;
    }

    function getCollateralAmountForLmkt(uint256 lmktAmount, address collateralToken) public view returns (uint256) {
        uint256 totalCollateral = getTotalCollateralValue();
        uint256 lmktSupply = lmktToken.totalSupply();
        if (lmktSupply == 0) return 0;

        uint256 baseCollateralValue = (lmktAmount * totalCollateral) / lmktSupply;
        // Apply 1% buy discount (user gets less collateral)
        uint256 discountedValue = (baseCollateralValue * (SPREAD_BASE - BUY_DISCOUNT)) / SPREAD_BASE;

        uint8 tokenDecimals = IERC20Metadata(collateralToken).decimals();
        return (discountedValue * (10**tokenDecimals)) / 1e18;
    }

    function getTotalCollateralValue() public view returns (uint256) {
        uint256 totalValue = 0;
        for (uint i = 0; i < whitelistedCollateralTokens.length; i++) {
            address token = whitelistedCollateralTokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            uint8 decimals = IERC20Metadata(token).decimals();
            totalValue += (balance * (10**(18 - decimals)));
        }
        return totalValue;
    }

    function getCollateralTokenValue(uint256 amount, address token) public view returns (uint256) {
        uint8 decimals = IERC20Metadata(token).decimals();
        return amount * (10**(18-decimals));
    }
    
    receive() external payable {}
}
