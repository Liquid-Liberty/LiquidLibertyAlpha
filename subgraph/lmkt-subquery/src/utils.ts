import { BigNumber } from "ethers";

// Zero constant for decimals
export const ZERO = 0;

// Convert bigint → decimal (JS number)
export function toDecimal(value: bigint, decimals: number): number {
  if (decimals === 0) return Number(value);
  return Number(value) / 10 ** decimals;
}

// Max/min helpers
export function bigDecimalMax(a: number, b: number): number {
  return a >= b ? a : b;
}

export function bigDecimalMin(a: number, b: number): number {
  return a <= b ? a : b;
}

// Bucket start timestamp (round down to nearest interval)
export function bucketStart(timestamp: number, intervalSec: number): number {
  return timestamp - (timestamp % intervalSec);
}
