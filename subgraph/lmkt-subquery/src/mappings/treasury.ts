// src/mappings/treasury.ts

import { MKTSwapLog } from "../types/abi-interfaces/Treasury";
import { PurchaseMadeLog } from "../types/abi-interfaces/PaymentProcessor";
import { ListingCreatedLog } from "../types/abi-interfaces/ListingManager";
import { Treasury__factory } from "../types/contracts";
import { Candle, Pair, Token } from "../types";
import { TREASURY_ADDRESS, LMKT_ADDRESS, MDAI_ADDRESS } from "../../project";
import { BigNumber } from "ethers";

// Candle intervals in seconds (1m, 5m, 15m, 1h, 4h, 1d)
const INTERVALS: number[] = [60, 300, 900, 3600, 14400, 86400];


// --- Utilities ---
function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}

function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  // Using BigNumber for precision before converting to float
  return parseFloat(BigNumber.from(value).toString()) / (10 ** decimals);
}

function max(a: number, b: number): number {
  return a > b ? a : b;
}

function min(a: number, b: number): number {
  return a < b ? a : b;
}

// --- Entity Helpers ---
async function getOrCreateToken(addr: string, decimals = 18): Promise<Token> {
  const id = addr.toLowerCase();
  let token = await Token.get(id);
  if (!token) {
    token = Token.create({ id, decimals });
    await token.save();
  }
  return token;
}

async function getOrCreatePair(
  token0Addr: string,
  token1Addr: string,
  blockTs: number
): Promise<Pair> {
  const id = TREASURY_ADDRESS; // Always use Treasury address as the single pair ID for the chart
  let pair = await Pair.get(id);

  if (!pair) {
    const token0 = await getOrCreateToken(token0Addr);
    const token1 = await getOrCreateToken(token1Addr);

    pair = Pair.create({
      id,
      token0Id: token0.id,
      token1Id: token1.id,
      createdAt: BigInt(blockTs),
    });
    await pair.save();
  }
  return pair;
}

async function updateCandle(
  pair: Pair,
  interval: number,
  bucketTs: number,
  price: number,
  vol0: number, // Collateral volume
  vol1: number  // LMKT volume
): Promise<void> {
  const id = `${pair.id}-${interval}-${bucketTs}`;
  let c = await Candle.get(id);

  if (!c) {
    c = Candle.create({
      id,
      pairId: pair.id,
      interval: interval.toString(),
      bucketStart: bucketTs,
      open: price,
      high: price,
      low: price,
      close: price,
      volumeToken0: vol0,
      volumeToken1: vol1,
      trades: vol0 > 0 || vol1 > 0 ? 1 : 0, // Only count as trade if there is volume
    });
  } else {
    c.close = price;
    c.high = max(c.high, price);
    c.low = min(c.low, price);
    c.volumeToken0 += vol0;
    c.volumeToken1 += vol1;
    if (vol0 > 0 || vol1 > 0) {
      c.trades += 1;
    }
  }

  await c.save();
}

// --- Handler 1: MKTSwap (Treasury) ---
export async function handleMKTSwap(log: MKTSwapLog): Promise<void> {
  const blockTs = Number(log.block.timestamp);
  const args = log.args;
  if (!args) return;

  const {
    sender,
    collateralToken,
    collateralAmount,
    lmktAmount,
    totalCollateral,
    circulatingSupply,
    isBuy,
  } = args;

  logger.info(
    `[MKTSwap] block=${log.block.number}, tx=${log.transaction.hash}, sender=${sender}, token=${collateralToken}, lmkt=${lmktAmount.toString()}, collateral=${collateralAmount.toString()}, isBuy=${isBuy}`
  );

  let price = 0;
  // Calculate price directly from event data for Treasury swaps
  if (circulatingSupply.gt(0) && totalCollateral.gt(0)) {
    // We assume both totalCollateral and circulatingSupply have 18 decimals for this ratio
    price = toDecimal(totalCollateral.toBigInt(), 18) / toDecimal(circulatingSupply.toBigInt(), 18);
  }

  const collateralAmountDec = toDecimal(collateralAmount.toBigInt(), 18);
  const lmktAmountDec = toDecimal(lmktAmount.toBigInt(), 18);

  const pair = await getOrCreatePair(collateralToken, LMKT_ADDRESS, blockTs);

  for (const interval of INTERVALS) {
    const bucket = bucketStart(blockTs, interval);
    await updateCandle(pair, interval, bucket, price, collateralAmountDec, lmktAmountDec);
  }
}

// --- Handler 2: PurchaseMade (PaymentProcessor) ---
export async function handlePurchaseMade(log: PurchaseMadeLog): Promise<void> {
  const blockTs = Number(log.block.timestamp);
  const args = log.args;
  if (!args) return;

  // For marketplace purchases, we get the price from the Treasury at this block
  const treasury = Treasury__factory.connect(TREASURY_ADDRESS, api);
  const priceBigInt = await treasury.getLmktPriceInUsd({ blockTag: log.block.hash });
  
  // Treasury's getLmktPriceInUsd returns with 8 decimals
  const price = toDecimal(priceBigInt.toBigInt(), 8);

  // LMKT is volumeToken1, assuming 18 decimals
  const lmktAmountDec = toDecimal(args.lmktAmount.toBigInt(), 18);
  // Collateral is volumeToken0. We derive its value from the price.
  const collateralAmountDec = lmktAmountDec * price;

  // Since the event doesn't specify collateral, we use the primary one for charting
  const pair = await getOrCreatePair(MDAI_ADDRESS, LMKT_ADDRESS, blockTs);
  
  for (const interval of INTERVALS) {
    const bucket = bucketStart(blockTs, interval);
    await updateCandle(pair, interval, bucket, price, collateralAmountDec, lmktAmountDec);
  }
}

// --- Handler 3: ListingCreated (ListingManager) ---
export async function handleListingCreated(log: ListingCreatedLog): Promise<void> {
  const blockTs = Number(log.block.timestamp);
  
  // Listing fees are deposited to the Treasury, changing the LMKT price.
  // We fetch the new price but record ZERO volume for this event.
  const treasury = Treasury__factory.connect(TREASURY_ADDRESS, api);
  const priceBigInt = await treasury.getLmktPriceInUsd({ blockTag: log.block.hash });

  // Treasury's getLmktPriceInUsd returns with 8 decimals
  const price = toDecimal(priceBigInt.toBigInt(), 8);

  // The pair is still the primary collateral vs LMKT
  const pair = await getOrCreatePair(MDAI_ADDRESS, LMKT_ADDRESS, blockTs);

  for (const interval of INTERVALS) {
    const bucket = bucketStart(blockTs, interval);
    // Update candle with new price, but 0 for both volume arguments
    await updateCandle(pair, interval, bucket, price, 0, 0);
  }
}