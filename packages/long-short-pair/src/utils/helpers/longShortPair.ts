import { LongShortPair } from "../../../generated/templates";
import {
  LongShortPairContract,
  Token,
  TokensCreatedEvent,
  TokensRedeemedEvent,
  ContractExpiredEvent,
  PositionSettledEvent,
} from "../../../generated/schema";
import { ERC20 } from "../../../generated/templates/LongShortPair/ERC20";

import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS } from "../decimals";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO } from "../constants";

export function getOrCreateLongShortPairContract(id: String, createIfNotFound: boolean = true): LongShortPairContract {
  let contract = LongShortPairContract.load(id);

  if (contract == null && createIfNotFound) {
    contract = new LongShortPairContract(id);

    LongShortPair.create(Address.fromString(id));
  }

  return contract as LongShortPairContract;
}

export function getOrCreateToken(
  tokenAddress: Address,
  persist: boolean = true,
  indexAsCollateral: boolean = false,
  isOnWhitelist: boolean = false
): Token {
  let addressString = tokenAddress.toHexString();

  let token = Token.load(addressString);

  if (token == null) {
    token = new Token(addressString);
    token.address = tokenAddress;

    let erc20Token = ERC20.bind(tokenAddress);

    let tokenDecimals = erc20Token.try_decimals();
    let tokenName = erc20Token.try_name();
    let tokenSymbol = erc20Token.try_symbol();

    token.decimals = !tokenDecimals.reverted ? tokenDecimals.value : DEFAULT_DECIMALS;
    token.name = !tokenName.reverted ? tokenName.value : "";
    token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : "";
    token.indexingAsCollateral = false;
    token.isOnWhitelist = false;
    token.finalFee = BIGDECIMAL_ZERO;

    if (indexAsCollateral) {
      token.indexingAsCollateral = true;
    }
    if (isOnWhitelist) {
      token.isOnWhitelist = true;
    }

    if (persist) {
      token.save();
    }
  }

  if (indexAsCollateral && !token.indexingAsCollateral) {
    token.indexingAsCollateral = true;
    token.save();
  }

  if (isOnWhitelist && !token.isOnWhitelist) {
    token.isOnWhitelist = true;
    token.save();
  }

  return token as Token;
}

export function getOrCreateTokensCreatedEvent(ethereumEvent: ethereum.Event): TokensCreatedEvent {
  let id = ethereumEvent.transaction.hash.toHexString().concat("-").concat(ethereumEvent.logIndex.toString());

  let event = new TokensCreatedEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as TokensCreatedEvent;
}

export function getOrCreateTokensRedeemedEvent(ethereumEvent: ethereum.Event): TokensRedeemedEvent {
  let id = ethereumEvent.transaction.hash.toHexString().concat("-").concat(ethereumEvent.logIndex.toString());

  let event = new TokensRedeemedEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as TokensRedeemedEvent;
}

export function getOrCreateContractExpiredEvent(ethereumEvent: ethereum.Event): ContractExpiredEvent {
  let id = ethereumEvent.transaction.hash.toHexString().concat("-").concat(ethereumEvent.logIndex.toString());

  let event = new ContractExpiredEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as ContractExpiredEvent;
}

export function getOrCreatePositionSettledEvent(ethereumEvent: ethereum.Event): PositionSettledEvent {
  let id = ethereumEvent.transaction.hash.toHexString().concat("-").concat(ethereumEvent.logIndex.toString());

  let event = new PositionSettledEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as PositionSettledEvent;
}
