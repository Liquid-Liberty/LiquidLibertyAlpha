import { MKTSwapLog } from "../types/abi-interfaces/Treasury";
import { Candle, Pair, Token } from "../types";

// Candle intervals in seconds (1m, 5m, 15m, 1h, 4h, 1d)
const INTERVALS: number[] = [60, 300, 900, 3600, 14400, 86400];

// Utility: round timestamp to bucket start
function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}

// Utility: decimal conversion (from bigint)
function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  return Number(value) / 10 ** decimals;
}

// Utility: safe max/min
function max(a: number, b: number): number {
  return a > b ? a : b;
}
function min(a: number, b: number): number {
  return a < b ? a : b;
}

// Get or create Token entity
async function getOrCreateToken(addr: string, decimals = 18): Promise<Token> {
  const id = addr.toLowerCase();
  let token = await Token.get(id);

  if (!token) {
    token = Token.create({
      id,
      decimals,
      symbol: "UNKNOWN",
      name: "Unknown Token",
    });
    await token.save();
  }
  return token;
}

// Get or create Pair entity
async function getOrCreatePair(
  addr: string,
  token0Addr: string,
  token1Addr: string,
  blockTs: number
): Promise<Pair> {
  const id = addr.toLowerCase();
  let pair = await Pair.get(id);

  if (!pair) {
    const token0 = await getOrCreateToken(token0Addr);
    const token1 = await getOrCreateToken(token1Addr);

    pair = Pair.create({
      id,
      token0Id: token0.id, // 🔑 must use token0Id instead of token0
      token1Id: token1.id, // 🔑 must use token1Id instead of token1
      createdAt: BigInt(blockTs),
    });
    await pair.save();
  }
  return pair;
}

// Update or create a Candle
async function updateCandle(
  pair: Pair,
  interval: number,
  bucketTs: number,
  price: number,
  vol0: number,
  vol1: number
): Promise<void> {
  const id = `${pair.id}-${interval}-${bucketTs}`;
  let c = await Candle.get(id);

  if (!c) {
    c = Candle.create({
      id,
      pairId: pair.id, // 🔑 must use pairId instead of pair
      interval: interval.toString(),
      bucketStart: bucketTs,
      open: price,
      high: price,
      low: price,
      close: price,
      volumeToken0: vol0,
      volumeToken1: vol1,
      trades: 1,
    });
  } else {
    c.close = price;
    c.high = max(c.high, price);
    c.low = min(c.low, price);
    c.volumeToken0 += vol0;
    c.volumeToken1 += vol1;
    c.trades += 1;
  }

  await c.save();
}

// Handler for MKTSwap
export async function handleMKTSwap(log: MKTSwapLog): Promise<void> {
  const blockTs = Number(log.block.timestamp);

  // Extract args safely
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

  // Example: derive price as collateral per LMKT
  let price = 0;
  if (circulatingSupply.gt(0)) {
    price =
      parseFloat(totalCollateral.toString()) /
      parseFloat(circulatingSupply.toString());
  }

  const collateralAmountDec = toDecimal(collateralAmount.toBigInt(), 18);
  const lmktAmountDec = toDecimal(lmktAmount.toBigInt(), 18);

  const pair = await getOrCreatePair(
    log.address,
    collateralToken,
    "0x7a54fb014c8A0Ad9DF0F1F8E0A024bdac8343021", // LMKT token address
    blockTs
  );

  // Loop through all intervals and update candles
  for (const interval of INTERVALS) {
    const bucket = bucketStart(blockTs, interval);
    await updateCandle(
      pair,
      interval,
      bucket,
      price,
      collateralAmountDec,
      lmktAmountDec
    );
  }
}
