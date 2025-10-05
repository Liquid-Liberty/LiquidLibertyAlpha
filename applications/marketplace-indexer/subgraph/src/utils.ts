import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";

export const ZERO_BD = BigDecimal.zero();

export function toDecimal(value: BigInt, decimals: i32): BigDecimal {
  let bd = new BigDecimal(value);
  if (decimals == 0) return bd;
  let scale = BigDecimal.fromString("1" + "0".repeat(decimals));
  return bd.div(scale);
}

export function bigDecimalMax(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.ge(b) ? a : b;
}

export function bigDecimalMin(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.le(b) ? a : b;
}

export function bucketStart(timestamp: i32, intervalSec: i32): i32 {
  return timestamp - (timestamp % intervalSec);
}