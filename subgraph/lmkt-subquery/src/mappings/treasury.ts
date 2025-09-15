import { MKTSwapLog } from "../types/abi-interfaces/Treasury";
import { PurchaseMadeLog } from "../types/abi-interfaces/PaymentProcessor";
import { ListingCreatedLog } from "../types/abi-interfaces/ListingManager";
import { Treasury__factory, ILMKT__factory } from "../types/contracts";
import { Candle, Pair, Token } from "../types";

// Candle intervals in seconds (1m, 5m, 15m, 1h, 4h, 1d)
const INTERVALS: number[] = [60, 300, 900, 3600, 14400, 86400];

// --- HELPER FUNCTIONS ---

function bucketStart(ts: number, interval: number): number {
  return Math.floor(ts / interval) * interval;
}
function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  return Number(value) / 10 ** decimals;
}
function max(a: number, b: number): number { return a > b ? a : b; }
function min(a: number, b: number): number { return a < b ? a : b; }

async function getOrCreateToken(addr: string, decimals = 18): Promise<Token> {
  const id = addr.toLowerCase();
  let token = await Token.get(id);
  if (!token) {
    token = Token.create({ id, decimals, symbol: "UNKNOWN", name: "Unknown Token" });
    await token.save();
  }
  return token;
}
async function getOrCreatePair(addr: string, token0Addr: string, token1Addr: string, blockTs: number): Promise<Pair> {
  const id = addr.toLowerCase();
  let pair = await Pair.get(id);
  if (!pair) {
    const token0 = await getOrCreateToken(token0Addr);
    const token1 = await getOrCreateToken(token1Addr);
    pair = Pair.create({ id, token0Id: token0.id, token1Id: token1.id, createdAt: BigInt(blockTs) });
    await pair.save();
  }
  return pair;
}
async function updateCandle(pair: Pair, interval: number, bucketTs: number, price: number, vol0: number, vol1: number): Promise<void> {
  const id = `${pair.id}-${interval}-${bucketTs}`;
  let c = await Candle.get(id);
  if (!c) {
    c = Candle.create({ id, pairId: pair.id, interval: interval.toString(), bucketStart: bucketTs, open: price, high: price, low: price, close: price, volumeToken0: vol0, volumeToken1: vol1, trades: 1 });
  } else {
    c.close = price;
    c.high = max(c.high, price);
    c.low = min(c.low, price);
    c.volumeToken0 += vol0;
    c.volumeToken1 += vol1;
    // Only increment trades count if there was actual volume
    if (vol0 > 0 || vol1 > 0) {
        c.trades += 1;
    }
  }
  await c.save();
}

// --- EVENT HANDLERS ---

export async function handleMKTSwap(log: MKTSwapLog): Promise<void> {
  const blockTs = Number(log.block.timestamp);
  const args = log.args;
  if (!args) return;
  const { collateralToken, collateralAmount, lmktAmount, totalCollateral, circulatingSupply } = args;
  let price = circulatingSupply > 0 ? parseFloat(totalCollateral.toString()) / parseFloat(circulatingSupply.toString()) : 0;
  const collateralAmountDec = toDecimal(collateralAmount, 18);
  const lmktAmountDec = toDecimal(lmktAmount, 18);
  const pair = await getOrCreatePair(log.address, collateralToken, "0x7bFA165c4e5a7E449378e18ec1259631E1080277", blockTs);
  for (const interval of INTERVALS) {
    const bucket = bucketStart(blockTs, interval);
    await updateCandle(pair, interval, bucket, price, collateralAmountDec, lmktAmountDec);
  }
}

export async function handlePurchaseMade(log: PurchaseMadeLog): Promise<void> {
    const blockTs = Number(log.block.timestamp);
    const args = log.args;
    if (!args) return;
    const { lmktAmount } = args;
    const lmktAddress = "0x7bFA165c4e5a7E449378e18ec1259631E1080277";
    
    // --- Placeholder Address ---
    const TREASURY_ADDRESS = "YOUR_TREASURY_ADDRESS_PLACEHOLDER";
    
    const treasuryContract = Treasury__factory.connect(TREASURY_ADDRESS, api);
    const lmktContract = ILMKT__factory.connect(lmktAddress, api);
    const totalCollateral = await treasuryContract.getTotalCollateralValue({ blockTag: log.blockHash });
    const circulatingSupply = await lmktContract.totalSupply({ blockTag: log.blockHash });
    let price = circulatingSupply > 0 ? parseFloat(totalCollateral.toString()) / parseFloat(circulatingSupply.toString()) : 0;
    const lmktAmountDec = toDecimal(lmktAmount, 18);
    const usdAmountDec = price * lmktAmountDec;
    
    // --- Placeholder Address ---
    const STABLECOIN_ADDRESS = "YOUR_STABLECOIN_ADDRESS_PLACEHOLDER";

    const pair = await getOrCreatePair(log.address, STABLECOIN_ADDRESS, lmktAddress, blockTs);
    for (const interval of INTERVALS) {
        const bucket = bucketStart(blockTs, interval);
        await updateCandle(pair, interval, bucket, price, usdAmountDec, lmktAmountDec);
    }
}

export async function handleListingCreated(log: ListingCreatedLog): Promise<void> {
    const blockTs = Number(log.block.timestamp);
    const args = log.args;
    if (!args) return;
    const lmktAddress = "0x7bFA165c4e5a7E449378e18ec1259631E1080277";

    // --- Placeholder Address ---
    const TREASURY_ADDRESS = "YOUR_TREASURY_ADDRESS_PLACEHOLDER";
    
    const treasuryContract = Treasury__factory.connect(TREASURY_ADDRESS, api);
    const lmktContract = ILMKT__factory.connect(lmktAddress, api);
    const totalCollateral = await treasuryContract.getTotalCollateralValue({ blockTag: log.blockHash });
    const circulatingSupply = await lmktContract.totalSupply({ blockTag: log.blockHash });
    let newPrice = circulatingSupply > 0 ? parseFloat(totalCollateral.toString()) / parseFloat(circulatingSupply.toString()) : 0;
    
    // --- Placeholder Address ---
    const FEE_TOKEN_ADDRESS = "YOUR_FEE_TOKEN_ADDRESS_PLACEHOLDER";

    const pair = await getOrCreatePair(TREASURY_ADDRESS, FEE_TOKEN_ADDRESS, lmktAddress, blockTs);
    for (const interval of INTERVALS) {
        const bucket = bucketStart(blockTs, interval);
        await updateCandle(pair, interval, bucket, newPrice, 0, 0);
    }
}