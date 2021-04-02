export {
  handleNewContractRegistered,
  handleCreatedExpiringMultiParty,
  handleCreatedPerpetual
} from "./mappings/registry";

export {
  handlePositionCreated,
  handleSettleExpiredPosition,
  handleWithdrawal,
  handleDeposit,
  handleRedeem,
  handleNewSponsor,
  handleEndedSponsorPosition,
  handleLiquidationCreated,
  handleLiquidationCreatedNew,
  handleLiquidationDisputed,
  handleDisputeSettled,
  handleCollateralTransfer,
  handleRequestTransferPosition,
  handleRequestTransferPositionCanceled,
  handleRequestTransferPositionExecuted,
  handleRequestWithdrawal,
  handleRequestWithdrawalCanceled,
  handleRequestWithdrawalExecuted
} from "./mappings/expiringMultiParty";

export {
  handlePositionCreated as handlePositionCreatedPerp,
  handleWithdrawal as handleWithdrawalPerp,
  handleDeposit as handleDepositPerp,
  handleRedeem as handleRedeemPerp,
  handleNewSponsor as handleNewSponsorPerp,
  handleEndedSponsorPosition as handleEndedSponsorPositionPerp,
  handleLiquidationCreated as handleLiquidationCreatedPerp,
  handleLiquidationDisputed as handleLiquidationDisputedPerp,
  handleDisputeSettled as handleDisputeSettledPerp,
  handleCollateralTransfer as handleCollateralTransferPerp,
  handleRequestWithdrawal as handleRequestWithdrawalPerp,
  handleRequestWithdrawalCanceled as handleRequestWithdrawalCanceledPerp,
  handleRequestWithdrawalExecuted as handleRequestWithdrawalExecutedPerp
} from "./mappings/perpetual";
