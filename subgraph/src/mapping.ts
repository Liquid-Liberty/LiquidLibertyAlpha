import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { MKTSwap } from "../generated/Treasury/Treasury";
import { ERC20 } from "../generated/Treasury/ERC20";
import { Candle, Pair, Token } from "../generated/schema";
import { bucketStart, bigDecimalMax, bigDecimalMin, toDecimal, ZERO_BD } from "./utils";

// Extended intervals
const INTERVALS: i32[] = [60, 300, 900, 3600, 14400, 86400]; // 1m, 5m, 15m, 1h, 4h, 1d
const LMKT_ADDRESS = Address.fromString("0xc0Bb618F4d885E0c4aAB287a427B2612d64Daa1B");

function getOrCreateToken(addr: Address): Token {
  let id = addr.toHexString();
  let token = Token.load(id);
  if (token == null) {
    token = new Token(id);
    let t = ERC20.bind(addr);
    let dec = t.try_decimals();
    token.decimals = dec.reverted ? 18 : dec.value;
    let sym = t.try_symbol();
    token.symbol = sym.reverted ? null : sym.value;
    let name = t.try_name();
    token.name = name.reverted ? null : name.value;
    token.save();
  }
  return token as Token;
}

function getOrCreatePair(
  addr: Address,
  token0Addr: Address,
  token1Addr: Address,
  block: ethereum.Block
): Pair {
  let id = addr.toHexString();
  let pair = Pair.load(id);

  if (pair == null) {
    pair = new Pair(id);
    pair.createdAt = block.timestamp;

    let token0 = getOrCreateToken(token0Addr);
    let token1 = getOrCreateToken(token1Addr);

    pair.token0 = token0.id;
    pair.token1 = token1.id;

    pair.save();
  }

  return pair as Pair;
}

function updateCandle(
  pair: Pair,
  intervalSec: i32,
  bucketTs: i32,
  price: BigDecimal,
  vol0: BigDecimal,
  vol1: BigDecimal
): void {
  const id = pair.id + "-" + intervalSec.toString() + "-" + bucketTs.toString();
  let c = Candle.load(id);
  if (c == null) {
    c = new Candle(id);
    c.pair = pair.id;
    c.interval = intervalSec.toString();
    c.bucketStart = bucketTs;
    
    // Find the previous candle to get the close price as open price
    let previousBucketTs = bucketTs - intervalSec;
    let previousId = pair.id + "-" + intervalSec.toString() + "-" + previousBucketTs.toString();
    let previousCandle = Candle.load(previousId);
    
    if (previousCandle != null) {
      // Use the close price from the previous candle as the open price
      c.open = previousCandle.close;
    } else {
      // If no previous candle exists, use current price as open
      c.open = price;
    }
    
    c.high = price;
    c.low = price;
    c.close = price;
    c.volumeToken0 = vol0;
    c.volumeToken1 = vol1;
    c.trades = 1;
  } else {
    c.close = price;
    c.high = bigDecimalMax(c.high, price);
    c.low = bigDecimalMin(c.low, price);
    c.volumeToken0 = c.volumeToken0.plus(vol0);
    c.volumeToken1 = c.volumeToken1.plus(vol1);
    c.trades = c.trades + 1;
  }
  c.save();
}

// Create a zero-volume candle that carries forward the last known close price
function createEmptyCandle(
  pair: Pair,
  intervalSec: i32,
  bucketTs: i32,
  carryPrice: BigDecimal
): void {
  const id = pair.id + "-" + intervalSec.toString() + "-" + bucketTs.toString();
  let c = Candle.load(id);
  if (c != null) return;

  c = new Candle(id);
  c.pair = pair.id;
  c.interval = intervalSec.toString();
  c.bucketStart = bucketTs;
  c.open = carryPrice;
  c.high = carryPrice;
  c.low = carryPrice;
  c.close = carryPrice;
  c.volumeToken0 = ZERO_BD;
  c.volumeToken1 = ZERO_BD;
  c.trades = 0;
  c.save();
}

// Fill any missing buckets between the last existing candle and the current bucket
function backfillMissingCandles(
  pair: Pair,
  intervalSec: i32,
  currentBucketTs: i32
): void {
  // Only backfill if we have a valid createdAt timestamp
  if (pair.createdAt.equals(BigInt.fromI32(0))) {
    return;
  }

  let searchBucket = currentBucketTs - intervalSec;
  let lowerBound = pair.createdAt.toI32();
  let steps = 0;
  let prev: Candle | null = null;

  // Look backwards to find the most recent existing candle
  while (searchBucket >= lowerBound && steps < 1000) {
    const id = pair.id + "-" + intervalSec.toString() + "-" + searchBucket.toString();
    let found = Candle.load(id);
    if (found != null) {
      prev = found;
      break;
    }
    searchBucket -= intervalSec;
    steps++;
  }

  if (prev == null) {
    // Nothing to carry forward from
    return;
  }

  // Fill forward from the bucket after the found candle up to just before currentBucketTs
  let fillBucket = prev.bucketStart + intervalSec;
  while (fillBucket < currentBucketTs) {
    createEmptyCandle(pair, intervalSec, fillBucket, prev.close);
    fillBucket += intervalSec;
  }
}

export function handleSwap(event: MKTSwap): void {
  // Ensure we have valid event data
  if (event.params.collateralAmount.equals(BigInt.fromI32(0)) || 
      event.params.lmktAmount.equals(BigInt.fromI32(0)) || 
      event.params.totalCollateral.equals(BigInt.fromI32(0)) || 
      event.params.totalLmktValue.equals(BigInt.fromI32(0))) {
    return;
  }

const pair = getOrCreatePair(
  event.address,
  event.params.collateralToken,
  LMKT_ADDRESS,
  event.block
);

  const dec0 = 18 as i32;
  const dec1 = 18 as i32;

  // Amounts (in)
  const collateralAmount = toDecimal(event.params.collateralAmount, dec0);
  const lmktAmount = toDecimal(event.params.lmktAmount, dec1);
  const totalCollateral = toDecimal(event.params.totalCollateral, dec0);
  const totalLmktValue = toDecimal(event.params.totalLmktValue, dec1);
  const isBuy = event.params.isBuy;

  // Price (invert: token0 per token1)
  let price: BigDecimal;
  if (totalCollateral.gt(BigDecimal.zero()) && totalLmktValue.gt(BigDecimal.zero())) {
    price = totalCollateral.div(totalLmktValue);
  } else {
    price = BigDecimal.zero();
  }

  const ts: i32 = event.block.timestamp.toI32();

  for (let i = 0; i < INTERVALS.length; i++) {
    const interval = INTERVALS[i];
    const bucket = bucketStart(ts, interval);
    
    // Only backfill if we have a valid pair creation time
    if (!pair.createdAt.equals(BigInt.fromI32(0))) {
      backfillMissingCandles(pair, interval, bucket);
    }
    
    updateCandle(pair, interval, bucket, price, collateralAmount, lmktAmount);
  }
}