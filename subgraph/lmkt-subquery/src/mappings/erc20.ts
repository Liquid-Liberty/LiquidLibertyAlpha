import { TransferLog } from "../types/abi-interfaces/ERC20";
import { FeePayment, Candle, Pair, Token } from "../types";
import { Treasury__factory, ERC20__factory } from "../types/contracts";
import { ethers } from "ethers";

const INTERVALS: number[] = [60, 300, 900, 3600, 14400, 86400];

//UTILS
function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  return Number(value) / 10 ** decimals;
}

function max(a: number, b: number): number {
  return a > b ? a : b;
}
function min(a: number, b: number): number {
  return a < b ? a : b;
}

function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}

function getAddresses() {
  const env =
    process.env.VITE_DEPLOY_ENV ||
    process.env.DEPLOY_ENV ||
    "SEPOLIA"; // fallback
  const deployEnv = env.toUpperCase();
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
  const rpcUrl =
    process.env[`${deployEnv}_RPC_URL`] || process.env.VITE_RPC_URL;

  if (!lmktRaw || !treRaw || !rpcUrl
  ) {
    throw new Error(`ERC20.... Missing LMKT, RPC URL, or Treasury address for env ${deployEnv}`);
  }

  console.log(`📦 Deploy env: ${deployEnv}`);
  console.log(`LMKT address: ${lmktRaw}`);
  console.log(`Treasury address: ${treRaw}`);
  console.log(`RPC URL: ${rpcUrl}`);

  return {
    LMKT_ADDRESS: lmktRaw.toLowerCase(),
    TREASURY_ADDRESS: treRaw.toLowerCase(),
    RPC_URL: rpcUrl
  };
}

const { TREASURY_ADDRESS, LMKT_ADDRESS, RPC_URL } = getAddresses();

// --- Entity helpers ---
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

async function getOrCreatePair(
  token0Addr: string,
  token1Addr: string,
  blockTs: number
): Promise<Pair> {
  const id = TREASURY_ADDRESS;
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


//Handler for FeeTransfers
export async function handleFeeTransfer(log: TransferLog): Promise<void> {
  const args = log.args;
  if (!args) return;

  const { from, to, value } = args;

  // Only count transfers going into Treasury
  if (to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) return;

  const blockTs = Number(log.block.timestamp);
  const feeToken = log.address.toLowerCase();
  const amountDec = toDecimal(value.toBigInt(), 18); // assumes 18 decimals

   logger.info(
    `🔥 FeeTransfer detected: from=${from}, token=${feeToken}, amount=${amountDec}, block=${log.blockNumber}`
  );

  // --- Reuse the Treasury ↔ LMKT pair (same as MKTSwap) ---
  const pair = await getOrCreatePair(feeToken, LMKT_ADDRESS, blockTs);

  // --- Fetch current LMKT price ---
  let price = 0;
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const treasury = Treasury__factory.connect(TREASURY_ADDRESS, provider);

      // Query total collateral
  const totalCollateral = await treasury.getTotalCollateralValue();

  // Get LMKT token address from Treasury
  const lmktAddress = await treasury.lmktToken();

  // Connect to LMKT as an ERC20 contract
  const lmkt = ERC20__factory.connect(lmktAddress, provider);

  // Query totalSupply
  const circulatingSupply = await lmkt.totalSupply();

    if (circulatingSupply.gt(0)) {
      price =
        parseFloat(totalCollateral.toString()) /
        parseFloat(circulatingSupply.toString());
    }
  } catch {
    price = 0;
  }

  // --- Update candles with *price* and *fee as extra volume* ---
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
        open: price,          // ✅ use LMKT price, not fee amount
        high: price,
        low: price,
        close: price,
        volumeToken0: amountDec, // ✅ fee adds to collateral-side volume
        volumeToken1: 0,
        trades: 1,            // optional: you could keep fees from incrementing trades if you want swaps only
      });
    } else {
      c.close = price;
      c.high = max(c.high, price);
      c.low = min(c.low, price);
      c.volumeToken0 += amountDec;
      c.trades += 1; // optional
    }

    await c.save();
  }
}
