import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "./constants";

export const DEFAULT_DECIMALS = 18;

export function pow(base: BigDecimal, exponent: number): BigDecimal {
  let result = base;

  if (exponent == 0) {
    return BigDecimal.fromString("1");
  }

  for (let i = 2; i <= exponent; i++) {
    result = result.times(base);
  }

  return result;
}

export function toDecimal(value: BigInt, decimals: number = DEFAULT_DECIMALS): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function defaultBigInt(value: BigInt | null): BigInt {
  return value === null ? BIGINT_ZERO : <BigInt>value;
}

export function defaultBigDecimal(value: BigDecimal | null): BigDecimal {
  return value === null ? BIGDECIMAL_ZERO : <BigDecimal>value;
}

export function safeDivBigDecimal(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b.equals(BigDecimal.fromString("0"))) {
    return BigDecimal.fromString("0");
  }

  return a.div(b);
}

// Compares the abs value of two big decimals and returns the one with the greater absolute value
export function absMax(a: BigDecimal, b: BigDecimal): BigDecimal {
  let absA = a.lt(BigDecimal.zero()) ? a.neg() : a;
  let absB = b.lt(BigDecimal.zero()) ? b.neg() : b;
  return absA.gt(absB) ? a : b;
}

export function bigDecimalMin(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a.lt(b) ? a : b;
}
