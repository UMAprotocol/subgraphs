import {
  Withdrawal,
  Deposit,
  Redeem,
  FinalFeesPaid,
  PositionCreated,
  SettleExpiredPosition,
  NewSponsor,
  EndedSponsorPosition,
  ExpiringMultiParty,
  LiquidationCreated,
  LiquidationCreated1,
  LiquidationDisputed,
  DisputeSettled,
  RequestWithdrawalExecuted,
  RequestWithdrawalCanceled,
  RequestWithdrawal,
  RequestTransferPositionExecuted,
  RequestTransferPositionCanceled,
  RequestTransferPosition
} from "../../generated/templates/ExpiringMultiParty/ExpiringMultiParty";
import {
  getOrCreateToken,
  getOrCreateFinancialContract,
  getOrCreatePositionCreatedEvent,
  getOrCreateSettleExpiredPositionEvent,
  getOrCreateRedeemEvent,
  getOrCreateDepositEvent,
  getOrCreateWithdrawalEvent,
  getOrCreateFinalFeesPaidEvent,
  getOrCreateSponsor,
  getOrCreateSponsorPosition,
  getOrCreateLiquidation,
  getOrCreateLiquidationCreatedEvent,
  getOrCreateLiquidationDisputedEvent,
  getOrCreateLiquidationDisputeSettledEvent,
  calculateGCR
} from "../utils/helpers";
import { Address } from "@graphprotocol/graph-ts";
import { toDecimal } from "../utils/decimals";
import {
  LIQUIDATION_PRE_DISPUTE,
  LIQUIDATION_PENDING_DISPUTE,
  LIQUIDATION_DISPUTE_SUCCEEDED,
  LIQUIDATION_DISPUTE_FAILED
} from "../utils/constants";

function updateSponsorPositionAndEMP(
  empAddress: Address,
  sponsorAddress: Address
): void {
  updateEMP(empAddress);
  let positionId = sponsorAddress
    .toHexString()
    .concat("-")
    .concat(empAddress.toHexString());
  let sponsorPosition = getOrCreateSponsorPosition(positionId);
  let empContract = ExpiringMultiParty.bind(empAddress);
  let position = empContract.try_positions(sponsorAddress);
  let collateral = empContract.try_getCollateral(sponsorAddress);
  let syntheticToken = getOrCreateToken(
    Address.fromString(sponsorPosition.syntheticToken)
  );
  let collateralToken = getOrCreateToken(
    Address.fromString(sponsorPosition.collateralToken)
  );

  sponsorPosition.rawCollateral = position.reverted
    ? sponsorPosition.rawCollateral
    : toDecimal(position.value.value3.rawValue, collateralToken.decimals);
  sponsorPosition.collateral = collateral.reverted
    ? sponsorPosition.collateral
    : toDecimal(collateral.value.rawValue, collateralToken.decimals);
  sponsorPosition.tokensOutstanding = position.reverted
    ? sponsorPosition.tokensOutstanding
    : toDecimal(position.value.value0.rawValue, syntheticToken.decimals);
  sponsorPosition.withdrawalRequestAmount = position.reverted
    ? sponsorPosition.withdrawalRequestAmount
    : toDecimal(position.value.value2.rawValue, collateralToken.decimals);
  sponsorPosition.withdrawalRequestPassTimestamp = position.reverted
    ? sponsorPosition.withdrawalRequestPassTimestamp
    : position.value.value1;
  sponsorPosition.transferPositionRequestPassTimestamp = position.reverted
    ? sponsorPosition.transferPositionRequestPassTimestamp
    : position.value.value4;

  sponsorPosition.save();
}

function updateEMP(empAddress: Address): void {
  let emp = getOrCreateFinancialContract(empAddress.toHexString());
  let empContract = ExpiringMultiParty.bind(empAddress);
  let feeMultiplier = empContract.try_cumulativeFeeMultiplier();
  let outstanding = empContract.try_totalTokensOutstanding();
  let rawCollateral = empContract.try_rawTotalPositionCollateral();
  let rawLiquidation = empContract.try_rawLiquidationCollateral();
  let collateral = empContract.try_totalPositionCollateral();
  let syntheticToken = getOrCreateToken(Address.fromString(emp.syntheticToken));
  let collateralToken = getOrCreateToken(
    Address.fromString(emp.collateralToken)
  );

  emp.totalTokensOutstanding = outstanding.reverted
    ? emp.totalTokensOutstanding
    : toDecimal(outstanding.value, syntheticToken.decimals);
  emp.rawTotalPositionCollateral = rawCollateral.reverted
    ? emp.rawTotalPositionCollateral
    : toDecimal(rawCollateral.value, collateralToken.decimals);
  emp.rawLiquidationCollateral = rawLiquidation.reverted
    ? emp.rawLiquidationCollateral
    : toDecimal(rawLiquidation.value, collateralToken.decimals);
  emp.totalPositionCollateral = collateral.reverted
    ? emp.totalPositionCollateral
    : toDecimal(collateral.value.rawValue, collateralToken.decimals);
  emp.cumulativeFeeMultiplier = feeMultiplier.reverted
    ? emp.cumulativeFeeMultiplier
    : toDecimal(feeMultiplier.value);

  emp.globalCollateralizationRatio = calculateGCR(
    emp.rawTotalPositionCollateral,
    emp.cumulativeFeeMultiplier,
    emp.totalTokensOutstanding
  );

  emp.save();
}

// - event: PositionCreated(indexed address,indexed uint256,indexed uint256)
//   handler: handlePositionCreated
// event PositionCreated(address indexed sponsor, uint256 indexed collateralAmount, uint256 indexed tokenAmount);

export function handlePositionCreated(event: PositionCreated): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let positionEvent = getOrCreatePositionCreatedEvent(event);
  let syntheticToken = getOrCreateToken(Address.fromString(emp.syntheticToken));
  let collateralToken = getOrCreateToken(Address.fromString(emp.collateralToken));

  emp.totalSyntheticTokensCreated =
    emp.totalSyntheticTokensCreated +
    toDecimal(event.params.tokenAmount, syntheticToken.decimals);

  emp.totalCollateralDeposited =
    emp.totalCollateralDeposited +
    toDecimal(event.params.collateralAmount, collateralToken.decimals);
  
  positionEvent.contract = event.address.toHexString();
  positionEvent.sponsor = event.params.sponsor.toHexString();
  positionEvent.collateralAmount = event.params.collateralAmount;
  positionEvent.tokenAmount = event.params.tokenAmount;

  positionEvent.save();
  emp.save();
}

// - event: SettleExpiredPosition(indexed address,indexed uint256,indexed uint256)
//   handler: handleSettleExpiredPosition
// event SettleExpiredPosition(
//       address indexed caller,
//       uint256 indexed collateralReturned,
//       uint256 indexed tokensBurned
//   );

export function handleSettleExpiredPosition(
  event: SettleExpiredPosition
): void {
  updateEMP(event.address);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let positionEvent = getOrCreateSettleExpiredPositionEvent(event);
  let syntheticToken = getOrCreateToken(Address.fromString(emp.syntheticToken));
  let collateralToken = getOrCreateToken(Address.fromString(emp.collateralToken));

  emp.totalSyntheticTokensBurned =
    emp.totalSyntheticTokensBurned +
    toDecimal(event.params.tokensBurned, syntheticToken.decimals);

  emp.totalCollateralWithdrawn =
    emp.totalCollateralWithdrawn +
    toDecimal(event.params.collateralReturned, collateralToken.decimals);

  positionEvent.contract = event.address.toHexString();
  positionEvent.caller = event.params.caller;
  positionEvent.collateralReturned = event.params.collateralReturned;
  positionEvent.tokensBurned = event.params.tokensBurned;

  positionEvent.save();
  emp.save();
}

// - event: Redeem(indexed address,indexed uint256,indexed uint256)
//   handler: handleRedeem
// event Redeem(address indexed sponsor, uint256 indexed collateralAmount, uint256 indexed tokenAmount);

export function handleRedeem(event: Redeem): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let positionEvent = getOrCreateRedeemEvent(event);
  let syntheticToken = getOrCreateToken(Address.fromString(emp.syntheticToken));
  let collateralToken = getOrCreateToken(Address.fromString(emp.collateralToken));

  emp.totalSyntheticTokensBurned =
    emp.totalSyntheticTokensBurned +
    toDecimal(event.params.tokenAmount, syntheticToken.decimals);

  emp.totalCollateralWithdrawn =
    emp.totalCollateralWithdrawn +
    toDecimal(event.params.collateralAmount, collateralToken.decimals);

  positionEvent.contract = event.address.toHexString();
  positionEvent.sponsor = event.params.sponsor.toHexString();
  positionEvent.collateralAmount = event.params.collateralAmount;
  positionEvent.tokenAmount = event.params.tokenAmount;

  positionEvent.save();
  emp.save();
}

// - event: Deposit(indexed address,indexed uint256)
//   handler: handleDeposit
// event Deposit(address indexed sponsor, uint256 indexed collateralAmount);

export function handleDeposit(event: Deposit): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let positionEvent = getOrCreateDepositEvent(event);
  let collateralToken = getOrCreateToken(Address.fromString(emp.collateralToken));

  emp.totalCollateralDeposited =
    emp.totalCollateralDeposited +
    toDecimal(event.params.collateralAmount, collateralToken.decimals);

  positionEvent.contract = event.address.toHexString();
  positionEvent.sponsor = event.params.sponsor.toHexString();
  positionEvent.collateralAmount = event.params.collateralAmount;

  positionEvent.save();
}

// - event: FinalFeesPaid(indexed uint256)
//   handler: handleFinalFeesPaid
// event FinalFeesPaid(uint256 indexed amount);

export function handleFinalFeesPaid(event: FinalFeesPaid): void {
  let finalFeesPaidEvent = getOrCreateFinalFeesPaidEvent(event);

  finalFeesPaidEvent.contract = event.address.toHexString();
  finalFeesPaidEvent.amount = event.params.amount;

  finalFeesPaidEvent.save();
}

// - event: Withdrawal(indexed address,indexed uint256)
//   handler: handleWithdrawal
// event Withdrawal(address indexed sponsor, uint256 indexed collateralAmount);

export function handleWithdrawal(event: Withdrawal): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let positionEvent = getOrCreateWithdrawalEvent(event);
  let collateralToken = getOrCreateToken(Address.fromString(emp.collateralToken));

  emp.totalCollateralWithdrawn =
    emp.totalCollateralWithdrawn +
    toDecimal(event.params.collateralAmount, collateralToken.decimals);

  positionEvent.contract = event.address.toHexString();
  positionEvent.sponsor = event.params.sponsor.toHexString();
  positionEvent.collateralAmount = event.params.collateralAmount;
  positionEvent.wasRequested = false;

  positionEvent.save();
}

// - event: NewSponsor(indexed address)
//   handler: handleNewSponsor

export function handleNewSponsor(event: NewSponsor): void {
  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let sponsor = getOrCreateSponsor(event.params.sponsor.toHexString());
  let positionId = event.params.sponsor
    .toHexString()
    .concat("-")
    .concat(event.address.toHexString());
  let sponsorPosition = getOrCreateSponsorPosition(positionId);

  sponsorPosition.sponsor = sponsor.id;
  sponsorPosition.contract = event.address.toHexString();
  sponsorPosition.collateralToken = emp.collateralToken;
  sponsorPosition.syntheticToken = emp.syntheticToken;
  sponsorPosition.isEnded = false;

  sponsor.save();
  sponsorPosition.save();
  // Just in case this event triggered because of a transfer
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);
}

// - event: EndedSponsorPosition(indexed address)
//   handler: handleEndedSponsorPosition

export function handleEndedSponsorPosition(event: EndedSponsorPosition): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let positionId = event.params.sponsor
    .toHexString()
    .concat("-")
    .concat(event.address.toHexString());
  let sponsorPosition = getOrCreateSponsorPosition(positionId);

  sponsorPosition.isEnded = true;

  sponsorPosition.save();
}

// - event: RequestTransferPosition(indexed address)
//   handler: handleRequestTransferPosition

export function handleRequestTransferPosition(
  event: RequestTransferPosition
): void {
  updateSponsorPositionAndEMP(event.address, event.params.oldSponsor);
}

// - event: RequestTransferPositionCanceled(indexed address)
//   handler: handleRequestTransferPositionCanceled

export function handleRequestTransferPositionCanceled(
  event: RequestTransferPositionCanceled
): void {
  updateSponsorPositionAndEMP(event.address, event.params.oldSponsor);
}

// - event: RequestTransferPositionExecuted(indexed address,indexed address)
//   handler: handleRequestTransferPositionExecuted

export function handleRequestTransferPositionExecuted(
  event: RequestTransferPositionExecuted
): void {
  updateSponsorPositionAndEMP(event.address, event.params.oldSponsor);
}

// - event: RequestWithdrawal(indexed address,indexed uint256)
//   handler: handleRequestWithdrawal

export function handleRequestWithdrawal(event: RequestWithdrawal): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);
}

// - event: RequestWithdrawalCanceled(indexed address,indexed uint256)
//   handler: handleRequestWithdrawalCanceled

export function handleRequestWithdrawalCanceled(
  event: RequestWithdrawalCanceled
): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);
}

// - event: RequestWithdrawalExecuted(indexed address,indexed uint256)
//   handler: handleRequestWithdrawalExecuted

export function handleRequestWithdrawalExecuted(
  event: RequestWithdrawalExecuted
): void {
  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let positionEvent = getOrCreateWithdrawalEvent(event);
  let collateralToken = getOrCreateToken(Address.fromString(emp.collateralToken));

  emp.totalCollateralWithdrawn =
    emp.totalCollateralWithdrawn +
    toDecimal(event.params.collateralAmount, collateralToken.decimals);

  positionEvent.contract = event.address.toHexString();
  positionEvent.sponsor = event.params.sponsor.toHexString();
  positionEvent.collateralAmount = event.params.collateralAmount;
  positionEvent.wasRequested = true;

  positionEvent.save();
}

// - event: LiquidationCreated(indexed address,indexed address,indexed uint256,uint256,uint256,uint256)
//   handler: handleLiquidationCreated

export function handleLiquidationCreated(event: LiquidationCreated1): void {
  let positionId = event.params.sponsor
    .toHexString()
    .concat("-")
    .concat(event.address.toHexString());
  let liquidationId = positionId
    .concat("-")
    .concat(event.params.liquidationId.toString());
  let eventId = liquidationId
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());
  let liquidationEvent = getOrCreateLiquidationCreatedEvent(eventId);
  let liquidation = getOrCreateLiquidation(liquidationId);

  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  let emp = getOrCreateFinancialContract(event.address.toHexString());
  let syntheticToken = getOrCreateToken(Address.fromString(emp.syntheticToken));
  let collateralToken = getOrCreateToken(
    Address.fromString(emp.collateralToken)
  );

  emp.totalSyntheticTokensBurned =
    emp.totalSyntheticTokensBurned +
    toDecimal(event.params.tokensOutstanding, syntheticToken.decimals);

  emp.totalCollateralWithdrawn =
    emp.totalCollateralWithdrawn +
    toDecimal(event.params.lockedCollateral, collateralToken.decimals);

  liquidationEvent.tx_hash = event.transaction.hash.toHexString();
  liquidationEvent.block = event.block.number;
  liquidationEvent.timestamp = event.block.timestamp;
  liquidationEvent.liquidation = liquidation.id;

  liquidationEvent.sponsor = event.params.sponsor;
  liquidationEvent.liquidator = event.params.liquidator;
  liquidationEvent.liquidationId = event.params.liquidationId;
  liquidationEvent.tokensLiquidated = event.params.tokensOutstanding;
  liquidationEvent.lockedCollateral = event.params.lockedCollateral;
  liquidationEvent.liquidatedCollateral = event.params.liquidatedCollateral;

  liquidation.status = LIQUIDATION_PRE_DISPUTE;
  liquidation.sponsor = event.params.sponsor.toHexString();
  liquidation.position = positionId;
  liquidation.contract = event.address.toHexString();
  liquidation.liquidator = event.params.liquidator;
  liquidation.liquidationId = event.params.liquidationId;
  liquidation.tokensLiquidated = toDecimal(
    event.params.tokensOutstanding,
    syntheticToken.decimals
  );
  liquidation.lockedCollateral = toDecimal(
    event.params.lockedCollateral,
    collateralToken.decimals
  );
  liquidation.liquidatedCollateral = toDecimal(
    event.params.liquidatedCollateral,
    collateralToken.decimals
  );

  liquidationEvent.save();
  liquidation.save();
  emp.save();
}

// - event: LiquidationCreated(indexed address,indexed address,indexed uint256,uint256,uint256,uint256,uint256)
//   handler: handleLiquidationCreatedNew

export function handleLiquidationCreatedNew(event: LiquidationCreated): void {
  handleLiquidationCreated(event as LiquidationCreated1);
}

// - event: LiquidationDisputed(indexed address,indexed address,indexed address,uint256,uint256)
//   handler: handleLiquidationDisputed

export function handleLiquidationDisputed(event: LiquidationDisputed): void {
  let liquidationId = event.params.sponsor
    .toHexString()
    .concat("-")
    .concat(event.address.toHexString())
    .concat("-")
    .concat(event.params.liquidationId.toString());
  let eventId = liquidationId
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());
  let liquidationEvent = getOrCreateLiquidationDisputedEvent(eventId);
  let liquidation = getOrCreateLiquidation(liquidationId);

  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  liquidationEvent.tx_hash = event.transaction.hash.toHexString();
  liquidationEvent.block = event.block.number;
  liquidationEvent.timestamp = event.block.timestamp;
  liquidationEvent.liquidation = liquidation.id;

  liquidationEvent.sponsor = event.params.sponsor;
  liquidationEvent.liquidator = event.params.liquidator;
  liquidationEvent.disputer = event.params.disputer;
  liquidationEvent.disputeBondAmount = event.params.disputeBondAmount;
  liquidationEvent.liquidationId = event.params.liquidationId;

  liquidation.status = LIQUIDATION_PENDING_DISPUTE;
  liquidation.disputer = event.params.disputer;
  liquidation.disputeBondAmount = toDecimal(event.params.disputeBondAmount);

  liquidationEvent.save();
  liquidation.save();
}

// - event: DisputeSettled(indexed address,indexed address,indexed address,address,uint256,bool)
//   handler: handleDisputeSettled

export function handleDisputeSettled(event: DisputeSettled): void {
  let liquidationId = event.params.sponsor
    .toHexString()
    .concat("-")
    .concat(event.address.toHexString())
    .concat("-")
    .concat(event.params.liquidationId.toString());
  let eventId = liquidationId
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());
  let liquidationEvent = getOrCreateLiquidationDisputeSettledEvent(eventId);
  let liquidation = getOrCreateLiquidation(liquidationId);

  updateSponsorPositionAndEMP(event.address, event.params.sponsor);

  liquidationEvent.tx_hash = event.transaction.hash.toHexString();
  liquidationEvent.block = event.block.number;
  liquidationEvent.timestamp = event.block.timestamp;
  liquidationEvent.liquidation = liquidation.id;

  liquidationEvent.sponsor = event.params.sponsor;
  liquidationEvent.liquidator = event.params.liquidator;
  liquidationEvent.caller = event.params.caller;
  liquidationEvent.disputer = event.params.disputer;
  liquidationEvent.disputeSucceeded = event.params.disputeSucceeded;
  liquidationEvent.liquidationId = event.params.liquidationId;

  liquidation.status = liquidationEvent.disputeSucceeded
    ? LIQUIDATION_DISPUTE_SUCCEEDED
    : LIQUIDATION_DISPUTE_FAILED;
  liquidation.disputeSucceeded = liquidationEvent.disputeSucceeded;

  liquidationEvent.save();
  liquidation.save();
}
