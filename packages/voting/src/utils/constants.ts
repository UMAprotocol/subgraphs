import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { toDecimal } from "./decimals";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const STORE_ID = "0x54f44ea3d2e7aa0ac089c4d8f7c93c27844057bf";
export const GOVERNOR_ADDRESS_STRING = "0x592349f7dedb2b75f9d4f194d4b7c16d82e507dc";
export let VOTING_TOKEN_ADDRESS = Address.fromString("0x04fa0d235c4abf4bcf4787af4cf447de572ef828");
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_ONE = toDecimal(BigInt.fromI32(10).pow(18));
export let BIGDECIMAL_HUNDRED = toDecimal(BigInt.fromI32(10).pow(20));
export const ADMIN_PROPOSAL_PREFIX = "Admin "
