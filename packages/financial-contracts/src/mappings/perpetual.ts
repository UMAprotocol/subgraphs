import {
    Withdrawal,
    Deposit,
    Redeem,
    PositionCreated,
    NewSponsor,
    EndedSponsorPosition,
    Perpetual,
    LiquidationCreated,
    LiquidationDisputed,
    DisputeSettled,
    RequestWithdrawalExecuted,
    RequestWithdrawalCanceled,
    RequestWithdrawal
  } from "../../generated/templates/Perpetual/Perpetual";
  import { Transfer } from "../../generated/templates/CollateralERC20/ERC20";
  import {
    getOrCreateToken,
    getOrCreatePerpetualContract,
    getOrCreatePositionCreatedEvent,
    getOrCreateRedeemEvent,
    getOrCreateDepositEvent,
    getOrCreateWithdrawalEvent,
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
  
  function updateSponsorPositionAndPerp(
    perpAddress: Address,
    sponsorAddress: Address
  ): void {
    updatePerp(perpAddress);
    let positionId = sponsorAddress
      .toHexString()
      .concat("-")
      .concat(perpAddress.toHexString());
    let sponsorPosition = getOrCreateSponsorPosition(positionId);
    let perpContract = Perpetual.bind(perpAddress);
    let position = perpContract.try_positions(sponsorAddress);
    let collateral = perpContract.try_getCollateral(sponsorAddress);
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
  
    sponsorPosition.save();
  }
  
  function updatePerp(perpAddress: Address): void {
    let perp = getOrCreatePerpetualContract(perpAddress.toHexString());
    let perpContract = Perpetual.bind(perpAddress);
    let feeMultiplier = perpContract.try_cumulativeFeeMultiplier();
    let outstanding = perpContract.try_totalTokensOutstanding();
    let rawCollateral = perpContract.try_rawTotalPositionCollateral();
    let rawLiquidation = perpContract.try_rawLiquidationCollateral();
    let collateral = perpContract.try_totalPositionCollateral();
    let syntheticToken = getOrCreateToken(Address.fromString(perp.syntheticToken));
    let collateralToken = getOrCreateToken(
      Address.fromString(perp.collateralToken)
    );
  
    perp.totalTokensOutstanding = outstanding.reverted
      ? perp.totalTokensOutstanding
      : toDecimal(outstanding.value, syntheticToken.decimals);
    perp.rawTotalPositionCollateral = rawCollateral.reverted
      ? perp.rawTotalPositionCollateral
      : toDecimal(rawCollateral.value, collateralToken.decimals);
    perp.rawLiquidationCollateral = rawLiquidation.reverted
      ? perp.rawLiquidationCollateral
      : toDecimal(rawLiquidation.value, collateralToken.decimals);
    perp.totalPositionCollateral = collateral.reverted
      ? perp.totalPositionCollateral
      : toDecimal(collateral.value.rawValue, collateralToken.decimals);
    perp.cumulativeFeeMultiplier = feeMultiplier.reverted
      ? perp.cumulativeFeeMultiplier
      : toDecimal(feeMultiplier.value);
  
    perp.globalCollateralizationRatio = calculateGCR(
      perp.rawTotalPositionCollateral,
      perp.cumulativeFeeMultiplier,
      perp.totalTokensOutstanding
    );
  
    perp.save();
  }
  
  // - event: PositionCreated(indexed address,indexed uint256,indexed uint256)
  //   handler: handlePositionCreated
  // event PositionCreated(address indexed sponsor, uint256 indexed collateralAmount, uint256 indexed tokenAmount);
  
  export function handlePositionCreated(event: PositionCreated): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let perp = getOrCreatePerpetualContract(event.address.toHexString());
    let positionEvent = getOrCreatePositionCreatedEvent(event);
    let syntheticToken = getOrCreateToken(Address.fromString(perp.syntheticToken));
  
    perp.totalSyntheticTokensCreated =
      perp.totalSyntheticTokensCreated +
      toDecimal(event.params.tokenAmount, syntheticToken.decimals);
  
    positionEvent.contract = event.address.toHexString();
    positionEvent.sponsor = event.params.sponsor.toHexString();
    positionEvent.collateralAmount = event.params.collateralAmount;
    positionEvent.tokenAmount = event.params.tokenAmount;
  
    positionEvent.save();
    perp.save();
  }
  
  // - event: Redeem(indexed address,indexed uint256,indexed uint256)
  //   handler: handleRedeem
  // event Redeem(address indexed sponsor, uint256 indexed collateralAmount, uint256 indexed tokenAmount);
  
  export function handleRedeem(event: Redeem): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let perp = getOrCreatePerpetualContract(event.address.toHexString());
    let positionEvent = getOrCreateRedeemEvent(event);
    let syntheticToken = getOrCreateToken(Address.fromString(perp.syntheticToken));
  
    perp.totalSyntheticTokensBurned =
      perp.totalSyntheticTokensBurned +
      toDecimal(event.params.tokenAmount, syntheticToken.decimals);
  
    positionEvent.contract = event.address.toHexString();
    positionEvent.sponsor = event.params.sponsor.toHexString();
    positionEvent.collateralAmount = event.params.collateralAmount;
    positionEvent.tokenAmount = event.params.tokenAmount;
  
    positionEvent.save();
    perp.save();
  }
  
  // - event: Deposit(indexed address,indexed uint256)
  //   handler: handleDeposit
  // event Deposit(address indexed sponsor, uint256 indexed collateralAmount);
  
  export function handleDeposit(event: Deposit): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let positionEvent = getOrCreateDepositEvent(event);
  
    positionEvent.contract = event.address.toHexString();
    positionEvent.sponsor = event.params.sponsor.toHexString();
    positionEvent.collateralAmount = event.params.collateralAmount;
  
    positionEvent.save();
  }
  
  // - event: Withdrawal(indexed address,indexed uint256)
  //   handler: handleWithdrawal
  // event Withdrawal(address indexed sponsor, uint256 indexed collateralAmount);
  
  export function handleWithdrawal(event: Withdrawal): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let positionEvent = getOrCreateWithdrawalEvent(event);
  
    positionEvent.contract = event.address.toHexString();
    positionEvent.sponsor = event.params.sponsor.toHexString();
    positionEvent.collateralAmount = event.params.collateralAmount;
    positionEvent.wasRequested = false;
  
    positionEvent.save();
  }
  
  // - event: NewSponsor(indexed address)
  //   handler: handleNewSponsor
  
  export function handleNewSponsor(event: NewSponsor): void {
    let perp = getOrCreatePerpetualContract(event.address.toHexString());
    let sponsor = getOrCreateSponsor(event.params.sponsor.toHexString());
    let positionId = event.params.sponsor
      .toHexString()
      .concat("-")
      .concat(event.address.toHexString());
    let sponsorPosition = getOrCreateSponsorPosition(positionId);
  
    sponsorPosition.sponsor = sponsor.id;
    sponsorPosition.contract = event.address.toHexString();
    sponsorPosition.collateralToken = perp.collateralToken;
    sponsorPosition.syntheticToken = perp.syntheticToken;
    sponsorPosition.isEnded = false;
  
    sponsor.save();
    sponsorPosition.save();
    // Just in case this event triggered because of a transfer
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  }
  
  // - event: EndedSponsorPosition(indexed address)
  //   handler: handleEndedSponsorPosition
  
  export function handleEndedSponsorPosition(event: EndedSponsorPosition): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let positionId = event.params.sponsor
      .toHexString()
      .concat("-")
      .concat(event.address.toHexString());
    let sponsorPosition = getOrCreateSponsorPosition(positionId);
  
    sponsorPosition.isEnded = true;
  
    sponsorPosition.save();
  }
    
  // - event: RequestWithdrawal(indexed address,indexed uint256)
  //   handler: handleRequestWithdrawal
  
  export function handleRequestWithdrawal(event: RequestWithdrawal): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  }
  
  // - event: RequestWithdrawalCanceled(indexed address,indexed uint256)
  //   handler: handleRequestWithdrawalCanceled
  
  export function handleRequestWithdrawalCanceled(
    event: RequestWithdrawalCanceled
  ): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  }
  
  // - event: RequestWithdrawalExecuted(indexed address,indexed uint256)
  //   handler: handleRequestWithdrawalExecuted
  
  export function handleRequestWithdrawalExecuted(
    event: RequestWithdrawalExecuted
  ): void {
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let positionEvent = getOrCreateWithdrawalEvent(event);
  
    positionEvent.contract = event.address.toHexString();
    positionEvent.sponsor = event.params.sponsor.toHexString();
    positionEvent.collateralAmount = event.params.collateralAmount;
    positionEvent.wasRequested = true;
  
    positionEvent.save();
  }
  
  // - event: LiquidationCreated(indexed address,indexed address,indexed uint256,uint256,uint256,uint256,uint256)
  //   handler: handleLiquidationCreated
  
  export function handleLiquidationCreated(event: LiquidationCreated): void {
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
  
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
    let perp = getOrCreatePerpetualContract(event.address.toHexString());
    let syntheticToken = getOrCreateToken(Address.fromString(perp.syntheticToken));
    let collateralToken = getOrCreateToken(
      Address.fromString(perp.collateralToken)
    );
  
    perp.totalSyntheticTokensBurned =
    perp.totalSyntheticTokensBurned +
      toDecimal(event.params.tokensOutstanding, syntheticToken.decimals);
  
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
    perp.save();
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
  
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
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
  
    updateSponsorPositionAndPerp(event.address, event.params.sponsor);
  
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
  
  // - event: Transfer(indexed address,indexed address,uint256)
  //   handler: handleCollateralTransfer
  
  export function handleCollateralTransfer(event: Transfer): void {
    let token = getOrCreateToken(event.address);
    let fromContract = getOrCreatePerpetualContract(
      event.params.from.toHexString(),
      false
    );
    let toContract = getOrCreatePerpetualContract(
      event.params.to.toHexString(),
      false
    );
  
    if (
      fromContract != null &&
      event.address.toHexString() == fromContract.collateralToken
    ) {
      fromContract.totalCollateralWithdrawn =
        fromContract.totalCollateralWithdrawn +
        toDecimal(event.params.value, token.decimals);
      fromContract.save();
    }
  
    if (
      toContract != null &&
      event.address.toHexString() == toContract.collateralToken
    ) {
      toContract.totalCollateralDeposited =
        toContract.totalCollateralDeposited +
        toDecimal(event.params.value, token.decimals);
      toContract.save();
    }
  }
  