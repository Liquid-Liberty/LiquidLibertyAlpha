// src/mappings/treasury.ts

import { MKTSwapLog } from "../types/abi-interfaces/Treasury";
import { PurchaseMadeLog } from "../types/abi-interfaces/PaymentProcessor";
import { ListingCreatedLog } from "../types/abi-interfaces/ListingManager";
import { Treasury__factory } from "../types/contracts";
import { Candle, Pair, Token } from "../types";
import { TREASURY_ADDRESS, LMKT_ADDRESS, MDAI_ADDRESS } from "../constants";
import { BigNumber } from "ethers";


// Error handling utilities
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName: string = "operation"
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[withRetry] 🔄 Attempting ${operationName} (attempt ${attempt}/${maxRetries})`);
      const result = await operation();
      logger.info(`[withRetry] ✅ ${operationName} succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`[withRetry] ⚠️ ${operationName} failed on attempt ${attempt}: ${lastError.message}`);

      if (attempt < maxRetries) {
        logger.info(`[withRetry] ⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  logger.error(`[withRetry] ❌ ${operationName} failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
  throw lastError;
}

async function getTreasuryPriceWithRetry(blockTag: string | number, operationContext: string): Promise<number> {
  return withRetry(
    async () => {
      const treasury = Treasury__factory.connect(TREASURY_ADDRESS, api);
      const priceBigInt = await treasury.getLmktPriceInUsd({ blockTag });
      return toDecimal(priceBigInt.toBigInt(), 8);
    },
    3,
    1000,
    `${operationContext} - treasury.getLmktPriceInUsd()`
  );
}

// Candle intervals in seconds (1m, 5m, 15m, 1h, 4h, 1d)
const INTERVALS: number[] = [60, 300, 900, 3600, 14400, 86400];

// --- Utilities ---
function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}

function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  // Using BigNumber for precision before converting to float
  return parseFloat(BigNumber.from(value).toString()) / 10 ** decimals;
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
  // Always use treasury address only
  const id = TREASURY_ADDRESS.toLowerCase();
  console.log("id within getOrCreatePair:", id);

  let pair = await Pair.get(id);
  console.log("pair within getOrCreatePair:", pair);

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
  vol1: number, // LMKT volume
  forceTrade: boolean = false //flag to track new treasury fees
): Promise<void> {
  const id = `${pair.id}-${interval}-${bucketTs}`;
  console.log("id within updateCandle:", id);
  logger.info(`[updateCandle] 🕯️ Processing candle ID: ${id}`);

  let c = await Candle.get(id);
  console.log("c within updateCandle:", c);
  if (!c) {
    logger.info(`[updateCandle] 🆕 Creating new candle: interval=${interval}s, price=${price}, vol0=${vol0}, vol1=${vol1}`);
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
      trades: forceTrade || vol0 > 0 || vol1 > 0 ? 1 : 0,
    });
    logger.info(`[updateCandle] ✨ Created new candle with ${c.trades} trades`);
  } else {
    logger.info(`[updateCandle] 📝 Updating existing candle: oldPrice=${c.close} -> newPrice=${price}, oldVol0=${c.volumeToken0} -> newVol0=${c.volumeToken0 + vol0}`);
    c.close = price;
    c.high = max(c.high, price);
    c.low = min(c.low, price);
    c.volumeToken0 += vol0;
    c.volumeToken1 += vol1;
    if (forceTrade || vol0 > 0 || vol1 > 0) {
      c.trades += 1;
    }
    logger.info(`[updateCandle] 🔄 Updated candle: OHLC=[${c.open}, ${c.high}, ${c.low}, ${c.close}], trades=${c.trades}`);
  }

  try {
    await c.save();
    logger.info(`[updateCandle] 💾 Successfully saved candle ${id}`);
  } catch (error) {
    logger.error(`[updateCandle] 💥 Failed to save candle ${id}: ${error}`);
    throw error;
  }
}

// --- Handler 1: MKTSwap (Treasury) ---
export async function handleMKTSwap(log: MKTSwapLog): Promise<void> {
  logger.info(`[MKTSwap] 🚀 STARTING handler for block ${log.block.number}, tx ${log.transaction.hash}`);

  const blockTs = Number(log.block.timestamp);
  const args = log.args;
  if (!args) {
    logger.error(`[MKTSwap] ❌ No args in log for block ${log.block.number}`);
    return;
  }

  // Dump args for ABI validation
  logger.debug(`[MKTSwap] Raw args: ${JSON.stringify(args, null, 2)}`);

  const {
    sender,
    collateralToken,
    collateralAmount,
    lmktAmount,
    totalCollateral,
    circulatingSupply,
    isBuy,
  } = args;

  // Defensive string conversion
  const lmktAmountStr = lmktAmount ? lmktAmount.toString() : "undefined";
  const collateralAmountStr = collateralAmount ? collateralAmount.toString() : "undefined";
  const totalCollateralStr = totalCollateral ? totalCollateral.toString() : "undefined";
  const circulatingSupplyStr = circulatingSupply ? circulatingSupply.toString() : "undefined";

  logger.info(
    `[MKTSwap] 📊 Event data: block=${log.block.number}, tx=${log.transaction.hash}, sender=${sender ?? "unknown"}, token=${collateralToken ?? "unknown"}, lmkt=${lmktAmountStr}, collateral=${collateralAmountStr}, isBuy=${isBuy}`
  );

  logger.info(
    `[MKTSwap] 🏦 Treasury state: totalCollateral=${totalCollateralStr}, circulatingSupply=${circulatingSupplyStr}`
  );

  let price = 0;
  if (circulatingSupply && totalCollateral && circulatingSupply.gt(0) && totalCollateral.gt(0)) {
    price =
      toDecimal(totalCollateral.toBigInt(), 18) /
      toDecimal(circulatingSupply.toBigInt(), 18);
    logger.info(`[MKTSwap] 💰 Calculated price: $${price.toFixed(8)}`);
  } else {
    logger.warn(`[MKTSwap] ⚠️ Cannot calculate price: circulatingSupply=${circulatingSupplyStr}, totalCollateral=${totalCollateralStr}`);
  }

  const collateralAmountDec = collateralAmount ? toDecimal(collateralAmount.toBigInt(), 18) : 0;
  const lmktAmountDec = lmktAmount ? toDecimal(lmktAmount.toBigInt(), 18) : 0;

  logger.info(`[MKTSwap] 🔄 Converted amounts: collateral=${collateralAmountDec}, lmkt=${lmktAmountDec}`);

  try {
    const pair = await getOrCreatePair(collateralToken ?? MDAI_ADDRESS, LMKT_ADDRESS, blockTs);
    logger.info(`[MKTSwap] 📈 Got/created pair: ${pair.id}`);

    for (const interval of INTERVALS) {
      const bucket = bucketStart(blockTs, interval);
      logger.info(`[MKTSwap] 🕒 Processing interval ${interval}s, bucket=${bucket}, price=${price}`);

      await updateCandle(pair, interval, bucket, price, collateralAmountDec, lmktAmountDec, false);
      logger.info(`[MKTSwap] ✅ Updated candle for interval ${interval}s`);
    }

    logger.info(`[MKTSwap] 🎉 SUCCESSFULLY processed all intervals for block ${log.block.number}`);
  } catch (error) {
    logger.error(`[MKTSwap] 💥 ERROR processing event: ${error}`);
    throw error;
  }
}

// --- Handler 2: PurchaseMade (PaymentProcessor) ---
export async function handlePurchaseMade(log: PurchaseMadeLog): Promise<void> {
  logger.info(`[PurchaseMade] 🚀 STARTING handler for block ${log.block.number}, tx ${log.transaction.hash}`);

  const blockTs = Number(log.block.timestamp);
  const args = log.args;
  if (!args) {
    logger.error(`[PurchaseMade] ❌ No args in log for block ${log.block.number}`);
    return;
  }

  logger.debug(`[PurchaseMade] Raw args: ${JSON.stringify(args, null, 2)}`);

  const lmktAmountStr = args.lmktAmount ? args.lmktAmount.toString() : "undefined";
  logger.info(`[PurchaseMade] 💰 Event data: lmktAmount=${lmktAmountStr}`);

  try {
    logger.info(`[PurchaseMade] 🏦 Calling treasury.getLmktPriceInUsd() at block ${log.block.number}`);
    const price = await getTreasuryPriceWithRetry(log.block.hash, "PurchaseMade");
    logger.info(`[PurchaseMade] 💲 Got price from treasury: $${price.toFixed(8)}`);

    const lmktAmountDec = args.lmktAmount ? toDecimal(args.lmktAmount.toBigInt(), 18) : 0;
    const collateralAmountDec = lmktAmountDec * price;

    logger.info(`[PurchaseMade] 🔄 Calculated volumes: lmkt=${lmktAmountDec}, collateral=${collateralAmountDec}`);

    const pair = await getOrCreatePair(MDAI_ADDRESS, LMKT_ADDRESS, blockTs);
    logger.info(`[PurchaseMade] 📈 Got/created pair: ${pair.id}`);

    for (const interval of INTERVALS) {
      const bucket = bucketStart(blockTs, interval);
      logger.info(`[PurchaseMade] 🕒 Processing interval ${interval}s, bucket=${bucket}, price=${price}`);

      await updateCandle(pair, interval, bucket, price, collateralAmountDec, lmktAmountDec, false);
      logger.info(`[PurchaseMade] ✅ Updated candle for interval ${interval}s`);
    }

    logger.info(`[PurchaseMade] 🎉 SUCCESSFULLY processed all intervals for block ${log.block.number}`);
  } catch (error) {
    logger.error(`[PurchaseMade] 💥 ERROR processing event: ${error}`);
    throw error;
  }
}

// --- Handler 3: ListingCreated (ListingManager) ---
export async function handleListingCreated(log: ListingCreatedLog): Promise<void> {
  logger.info(`[ListingCreated] 🚀 STARTING handler for block ${log.block.number}, tx ${log.transaction.hash}`);

  const blockTs = Number(log.block.timestamp);
  const args = log.args;
  if (!args) {
    logger.error(`[ListingCreated] ❌ No args in log for block ${log.block.number}`);
    return;
  }

  logger.debug(`[ListingCreated] Raw args: ${JSON.stringify(args, null, 2)}`);

  const feePaidStr = args.feePaid ? args.feePaid.toString() : "undefined";
  logger.info(`[ListingCreated] 📋 Event data: feePaid=${feePaidStr}`);

  const treasury = Treasury__factory.connect(TREASURY_ADDRESS, api);

  let price = 0;
  try {
    logger.info(`[ListingCreated] 🏦 Calling treasury.getLmktPriceInUsd() at block ${log.block.number}`);
    price = await getTreasuryPriceWithRetry(log.block.number, "ListingCreated");
    logger.info(`[ListingCreated] 💲 Got price from treasury: $${price.toFixed(8)}`);
  } catch (e) {
    logger.warn(`[ListingCreated] ⚠️ Failed to fetch price at block=${log.block.number}, tx=${log.transaction.hash}. Defaulting price=0. Error: ${e}`);
  }

  const feeAmountDec = args.feePaid ? toDecimal(args.feePaid.toBigInt(), 18) : 0;
  logger.info(`[ListingCreated] 💳 Fee amount: ${feeAmountDec}`);

  try {
    const pair = await getOrCreatePair(MDAI_ADDRESS, LMKT_ADDRESS, blockTs);
    logger.info(`[ListingCreated] 📈 Got/created pair: ${pair.id}`);

    for (const interval of INTERVALS) {
      const bucket = bucketStart(blockTs, interval);
      logger.info(`[ListingCreated] 🕒 Processing interval ${interval}s, bucket=${bucket}, price=${price}, fee=${feeAmountDec}`);

      await updateCandle(pair, interval, bucket, price, feeAmountDec, 0, true);
      logger.info(`[ListingCreated] ✅ Updated candle for interval ${interval}s (forced trade)`);
    }

    logger.info(`[ListingCreated] 🎉 SUCCESSFULLY processed all intervals for block ${log.block.number}`);
  } catch (error) {
    logger.error(`[ListingCreated] 💥 ERROR processing event: ${error}`);
    throw error;
  }
}
