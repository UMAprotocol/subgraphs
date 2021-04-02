import {
  PositionCreatedEvent,
  SettleExpiredPositionEvent,
  RedeemEvent,
  DepositEvent,
  WithdrawalEvent,
  Sponsor,
  SponsorPosition,
  Liquidation,
  LiquidationCreatedEvent,
  LiquidationDisputedEvent,
  LiquidationDisputeSettledEvent
} from "../../../generated/schema";
import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO } from "../constants";

export function getOrCreatePositionCreatedEvent(
  ethereumEvent: ethereum.Event
): PositionCreatedEvent {
  let id = ethereumEvent.transaction.hash
    .toHexString()
    .concat("-")
    .concat(ethereumEvent.logIndex.toString());

  let event = new PositionCreatedEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as PositionCreatedEvent;
}

export function getOrCreateSettleExpiredPositionEvent(
  ethereumEvent: ethereum.Event
): SettleExpiredPositionEvent {
  let id = ethereumEvent.transaction.hash
    .toHexString()
    .concat("-")
    .concat(ethereumEvent.logIndex.toString());

  let event = new SettleExpiredPositionEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as SettleExpiredPositionEvent;
}

export function getOrCreateRedeemEvent(
  ethereumEvent: ethereum.Event
): RedeemEvent {
  let id = ethereumEvent.transaction.hash
    .toHexString()
    .concat("-")
    .concat(ethereumEvent.logIndex.toString());

  let event = new RedeemEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as RedeemEvent;
}

export function getOrCreateDepositEvent(
  ethereumEvent: ethereum.Event
): DepositEvent {
  let id = ethereumEvent.transaction.hash
    .toHexString()
    .concat("-")
    .concat(ethereumEvent.logIndex.toString());
  let event = new DepositEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as DepositEvent;
}

export function getOrCreateWithdrawalEvent(
  ethereumEvent: ethereum.Event
): WithdrawalEvent {
  let id = ethereumEvent.transaction.hash
    .toHexString()
    .concat("-")
    .concat(ethereumEvent.logIndex.toString());

  let event = new WithdrawalEvent(id);
  event.tx_hash = ethereumEvent.transaction.hash.toHexString();
  event.block = ethereumEvent.block.number;
  event.timestamp = ethereumEvent.block.timestamp;

  return event as WithdrawalEvent;
}

export function getOrCreateSponsor(
  id: String,
  createIfNotFound: boolean = true
): Sponsor {
  let sponsor = Sponsor.load(id);

  if (sponsor == null && createIfNotFound) {
    sponsor = new Sponsor(id);
  }

  return sponsor as Sponsor;
}

export function getOrCreateSponsorPosition(
  id: String,
  createIfNotFound: boolean = true
): SponsorPosition {
  let position = SponsorPosition.load(id);

  if (position == null && createIfNotFound) {
    position = new SponsorPosition(id);

    position.rawCollateral = BIGDECIMAL_ZERO;
    position.collateral = BIGDECIMAL_ZERO;
    position.tokensOutstanding = BIGDECIMAL_ZERO;
    position.isEnded = false;
  }

  return position as SponsorPosition;
}

export function calculateGCR(
  feeMultiplier: BigDecimal | null,
  rawCollateral: BigDecimal | null,
  outstanding: BigDecimal | null
): BigDecimal {
  let gcr: BigDecimal = BIGDECIMAL_ZERO;
  if (
    outstanding != null &&
    feeMultiplier != null &&
    rawCollateral != null &&
    outstanding != BIGDECIMAL_ZERO
  ) {
    gcr =
      (<BigDecimal>rawCollateral * <BigDecimal>feeMultiplier) /
      <BigDecimal>outstanding;
  }
  return gcr;
}

export function getOrCreateLiquidation(
  id: String,
  createIfNotFound: boolean = true
): Liquidation {
  let liquidation = Liquidation.load(id);

  if (liquidation == null && createIfNotFound) {
    liquidation = new Liquidation(id);
  }

  return liquidation as Liquidation;
}

export function getOrCreateLiquidationCreatedEvent(
  id: String,
  createIfNotFound: boolean = true
): LiquidationCreatedEvent {
  let event = LiquidationCreatedEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new LiquidationCreatedEvent(id);
  }

  return event as LiquidationCreatedEvent;
}

export function getOrCreateLiquidationDisputedEvent(
  id: String,
  createIfNotFound: boolean = true
): LiquidationDisputedEvent {
  let event = LiquidationDisputedEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new LiquidationDisputedEvent(id);
  }

  return event as LiquidationDisputedEvent;
}

export function getOrCreateLiquidationDisputeSettledEvent(
  id: String,
  createIfNotFound: boolean = true
): LiquidationDisputeSettledEvent {
  let event = LiquidationDisputeSettledEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new LiquidationDisputeSettledEvent(id);
  }

  return event as LiquidationDisputeSettledEvent;
}
