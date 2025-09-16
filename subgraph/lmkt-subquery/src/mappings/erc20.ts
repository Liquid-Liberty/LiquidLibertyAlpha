import { TransferLog } from "../types/abi-interfaces/ERC20";
import { FeePayment } from "../types";

//UTILS
function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  return Number(value) / 10 ** decimals;
}

function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}

function getAddresses() {
  const deployEnv = process.env.VITE_DEPLOY_ENV?.toUpperCase();
  if (!deployEnv) {
    throw new Error(
      "❌ VITE_DEPLOY_ENV is not set (expected 'pulse' | 'sepolia' | 'local')"
    );
  }

  const lmktRaw =
    process.env[`${deployEnv}_LMKT_ADDRESS`] || process.env.VITE_LMKT_ADDRESS;
  const treRaw =
    process.env[`${deployEnv}_TREASURY_ADDRESS`] ||
    process.env.VITE_TREASURY_ADDRESS;

  if (!lmktRaw || !treRaw) {
    throw new Error(`❌ Missing LMKT or Treasury address for env ${deployEnv}`);
  }

  console.log(`📦 Deploy env: ${deployEnv}`);
  console.log(`LMKT address: ${lmktRaw}`);
  console.log(`Treasury address: ${treRaw}`);

  return {
    LMKT_ADDRESS: lmktRaw.toLowerCase(),
    TREASURY_ADDRESS: treRaw.toLowerCase(),
  };
}

const { TREASURY_ADDRESS } = getAddresses();

export async function handleFeeTransfer(log: TransferLog): Promise<void> {
  const args = log.args;
  if (!args) return;

  const { from, to, value } = args;

  // Only count transfers going into Treasury
  if (to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) return;

  const blockTs = Number(log.block.timestamp);
  const tokenAddress = log.address.toLowerCase();
  const amountDec = toDecimal(value.toBigInt(), 18); // assumes 18 decimals for now

  // --- Create pair (FeeToken vs Treasury) ---
  const pairId = `fee-${tokenAddress}`; // unique identifier for fee flows
  let pair = await Pair.get(pairId);
  if (!pair) {
    const token0 = await getOrCreateToken(tokenAddress);
    const token1 = await getOrCreateToken(TREASURY_ADDRESS); // pseudo "treasury token"
    pair = Pair.create({
      id: pairId,
      token0Id: token0.id,
      token1Id: token1.id,
      createdAt: BigInt(blockTs),
    });
    await pair.save();
  }

  // --- Update candles ---
  for (const interval of INTERVALS) {
    const bucket = bucketStart(blockTs, interval);
    const candleId = `${pair.id}-${interval}-${bucket}`;
    let c = await Candle.get(candleId);

    if (!c) {
      c = Candle.create({
        id: candleId,
        pairId: pair.id,
        interval: interval.toString(),
        bucketStart: bucket,
        open: amountDec,
        high: amountDec,
        low: amountDec,
        close: amountDec,
        volumeToken0: amountDec,
        volumeToken1: 0,
        trades: 1,
      });
    } else {
      c.close = amountDec;
      c.high = max(c.high, amountDec);
      c.low = min(c.low, amountDec);
      c.volumeToken0 += amountDec;
      c.trades += 1;
    }

    await c.save();
  }
}
