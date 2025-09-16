// src/mappings/mappingHandlers.ts

import {
  MKTSwapLog,
  Treasury,
  Treasury__factory,
} from "../types/abi-interfaces/Treasury";
import { PurchaseMadeLog } from "../types/abi-interfaces/PaymentProcessor";
import {
  ListingCreatedLog,
  ListingRenewedLog,
} from "../types/abi-interfaces/ListingManager";

import { Candle, Pair, Token } from "../types";
import { BigNumber } from "ethers";

// ==================================================================
// ========               CONFIGURATION                    ========
// ==================================================================

// Candle intervals in seconds (1m, 5m, 15m, 1h, 4h, 1d)
const INTERVALS: number[] = [60, 300, 900, 3600, 14400, 86400];
const LMKT_PRICE_DECIMALS = 8; // From Treasury.sol

// Helper to load addresses from environment variables
function getAddresses() {
  const deployEnv = (
    process.env.VITE_DEPLOY_ENV ||
    process.env.DEPLOY_ENV ||
    "sepolia"
  ).toUpperCase();

  const get = (name: string) => {
    const envVar = process.env[`${deployEnv}_${name}`];
    if (!envVar) throw new Error(`❌ Missing env var: ${deployEnv}_${name}`);
    return envVar.toLowerCase();
  };

  return {
    LMKT_ADDRESS: get("LMKT_ADDRESS"),
    TREASURY_ADDRESS: get("TREASURY_ADDRESS"),
  };
}

const { LMKT_ADDRESS, TREASURY_ADDRESS } = getAddresses();

// ==================================================================
// ========                 UTILITIES                      ========
// ==================================================================

function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}

function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  return Number(value) / 10 ** decimals;
}

// ==================================================================
// ========               ENTITY HELPERS                   ========
// ==================================================================

// Central function to update all candle intervals for a given timestamp
async function updateCandles(
  timestamp: number,
  price: number,
  lmktVolume: number,
  collateralVolume: number
) {
  const pair = await getOrCreatePair();

  for (const interval of INTERVALS) {
    const bucket = bucketStart(timestamp, interval);
    const id = `${pair.id}-${interval}-${bucket}`;
    let candle = await Candle.get(id);

    if (!candle) {
      candle = Candle.create({
        id,
        pairId: pair.id,
        interval: interval.toString(),
        bucketStart: bucket,
        open: price,
        high: price,
        low: price,
        close: price,
        volumeToken0: collateralVolume,
        volumeToken1: lmktVolume,
        trades: 1,
      });
    } else {
      candle.close = price;
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.volumeToken0 += collateralVolume;
      candle.volumeToken1 += lmktVolume;
      candle.trades += 1;
    }
    await candle.save();
  }
}

async function getOrCreatePair(): Promise<Pair> {
  const id = TREASURY_ADDRESS;
  let pair = await Pair.get(id);

  if (!pair) {
    // We can't know the collateral token upfront, so we use a placeholder.
    // The core logic groups by the Treasury address regardless.
    const token0 = await getOrCreateToken("0x0000000000000000000000000000000000000000", 18, "COLLATERAL");
    const token1 = await getOrCreateToken(LMKT_ADDRESS, 18, "LMKT");

    pair = Pair.create({
      id,
      token0Id: token0.id,
      token1Id: token1.id,
      createdAt: BigInt(0), // Set during first swap
    });
    await pair.save();
  }
  return pair;
}

async function getOrCreateToken(addr: string, decimals = 18, symbol = "UNKNOWN"): Promise<Token> {
  const id = addr.toLowerCase();
  let token = await Token.get(id);
  if (!token) {
    token = Token.create({ id, decimals, symbol, name: `${symbol} Token` });
    await token.save();
  }
  return token;
}

async function getMostRecentClosePrice(): Promise<number> {
    const pair = await getOrCreatePair();
    const smallestInterval = INTERVALS[0];

    // Query for the most recent candle of the smallest interval
    const candles = await Candle.getByPairId(pair.id, {
        orderBy: "bucketStart",
        descending: true,
        limit: 1,
    });

    if (candles.length > 0) {
        return candles[0].close;
    }
    
    // Fallback: If no candles exist, fetch price directly from contract
    return await fetchPriceFromContract();
}


async function fetchPriceFromContract(): Promise<number> {
    try {
        const treasury = Treasury__factory.connect(TREASURY_ADDRESS, api);
        const priceBigNumber = await treasury.getLmktPriceInUsd();
        return toDecimal(priceBigNumber.toBigInt(), LMKT_PRICE_DECIMALS);
    } catch (e) {
        logger.error(`🚨 Could not fetch price from contract: ${e}`);
        return 0; // Return 0 on failure
    }
}

// ==================================================================
// ========               EVENT HANDLERS                   ========
// ==================================================================

/**
 * Handler for MKTSwap (Treasury)
 * This is a DIRECT price and volume event.
 */
export async function handleMKTSwap(log: MKTSwapLog): Promise<void> {
  if (!log.args) return;
  const { totalCollateral, circulatingSupply, lmktAmount, collateralAmount } =
    log.args;
  const timestamp = Number(log.block.timestamp);

  let price = 0;
  if (circulatingSupply.toBigInt() > 0) {
    const priceBigInt =
      (totalCollateral.toBigInt() * BigInt(10 ** LMKT_PRICE_DECIMALS)) /
      circulatingSupply.toBigInt();
    price = toDecimal(priceBigInt, LMKT_PRICE_DECIMALS);
  }

  // Set createdAt timestamp if it's the first swap
  const pair = await getOrCreatePair();
  if (pair.createdAt === BigInt(0)) {
      pair.createdAt = BigInt(timestamp);
      await pair.save();
  }

  const lmktVolume = toDecimal(lmktAmount.toBigInt(), 18);
  const collateralVolume = toDecimal(collateralAmount.toBigInt(), 18);

  await updateCandles(timestamp, price, lmktVolume, collateralVolume);
}

/**
 * Handler for PurchaseMade (PaymentProcessor)
 * This is a VOLUME-ONLY event, as the on-chain code does not burn fees.
 */
export async function handlePurchaseMade(log: PurchaseMadeLog): Promise<void> {
  if (!log.args) return;
  const { lmktAmount } = log.args;
  const timestamp = Number(log.block.timestamp);

  // Since this event doesn't change the price, we use the last known price.
  const lastPrice = await getMostRecentClosePrice();

  const lmktVolume = toDecimal(lmktAmount.toBigInt(), 18);

  await updateCandles(timestamp, lastPrice, lmktVolume, 0);
}

/**
 * Handler for ListingCreated and ListingRenewed (ListingManager)
 * This is an INDIRECT price event. We must call the contract to get the new price.
 */
export async function handleListingFee(
  log: ListingCreatedLog | ListingRenewedLog
): Promise<void> {
  const timestamp = Number(log.block.timestamp);

  // Fetch the new, updated price directly from the contract state
  const newPrice = await fetchPriceFromContract();
  
  // This event has no volume, it only affects the price
  await updateCandles(timestamp, newPrice, 0, 0);
}