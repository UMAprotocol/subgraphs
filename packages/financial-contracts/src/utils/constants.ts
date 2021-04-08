import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { toDecimal } from "./decimals";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_ONE = toDecimal(BigInt.fromI32(10).pow(18));
export let BIGDECIMAL_HUNDRED = toDecimal(BigInt.fromI32(10).pow(20));

// Liquidation States
export const LIQUIDATION_PRE_DISPUTE = "PreDispute"
export const LIQUIDATION_PENDING_DISPUTE = "PendingDispute"
export const LIQUIDATION_DISPUTE_SUCCEEDED = "DisputeSucceeded"
export const LIQUIDATION_DISPUTE_FAILED = "DisputeFailed"

// List of EMP Factories that we want to index:
export let EMP_CREATORS = new Array<String>();
export let PERP_CREATORS = new Array<String>();

// We make the assumption that no creator addresses are duplicated across networks:
// Kovan:
EMP_CREATORS.push("0xf763d367e1302a16716b6c40783a17c1ac754f2e")
EMP_CREATORS.push("0x8f6e999530787492c62cfa5a8c937a4be5886a13")
PERP_CREATORS.push("0x211aab73c56fef9314fb0889e4f045b5f27cdb3f")
PERP_CREATORS.push("0x6b876861d2f15616a6c8ed8a3e3bad071ead3dde")
// Mainnet:
EMP_CREATORS.push("0xdebb91ab3e473025bb8ce278c02361a3c4f13124")
EMP_CREATORS.push("0xad8fd1f418fb860a383c9d4647880af7f043ef39")
EMP_CREATORS.push("0x9a077d4fcf7b26a0514baa4cff0b481e9c35ce87")
EMP_CREATORS.push("0xb3de1e212b49e68f4a68b5993f31f63946fca2a6")
EMP_CREATORS.push("0xddfc7e3b4531158acf4c7a5d2c3cb0ee81d018a5")
PERP_CREATORS.push("0xe9f67235c1b0ee401e5f5e119fb9dfc9753f10f9")
