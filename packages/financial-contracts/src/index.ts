export {
  handleNewContractRegistered,
  handleCreatedExpiringMultiParty,
  handleCreatedPerpetual,
} from "./mappings/registry";

export { handleSetFinalFee } from "./mappings/store";

export { handleAddedToWhitelist, handleRemovedFromWhitelist } from "./mappings/addressWhitelist";

export {
  handlePositionCreated,
  handleSettleExpiredPosition,
  handleWithdrawal,
  handleDeposit,
  handleRedeem,
  handleRepay,
  handleFinalFeesPaid,
  handleNewSponsor,
  handleEndedSponsorPosition,
  handleLiquidationCreated,
  handleLiquidationCreatedNew,
  handleLiquidationDisputed,
  handleDisputeSettled,
  handleRequestTransferPosition,
  handleRequestTransferPositionCanceled,
  handleRequestTransferPositionExecuted,
  handleRequestWithdrawal,
  handleRequestWithdrawalCanceled,
  handleRequestWithdrawalExecuted,
} from "./mappings/expiringMultiParty";

export {
  handlePositionCreated as handlePositionCreatedPerp,
  handleWithdrawal as handleWithdrawalPerp,
  handleDeposit as handleDepositPerp,
  handleRedeem as handleRedeemPerp,
  handleRepay as handleRepayPerp,
  handleFinalFeesPaid as handleFinalFeesPaidPerp,
  handleNewSponsor as handleNewSponsorPerp,
  handleEndedSponsorPosition as handleEndedSponsorPositionPerp,
  handleLiquidationCreated as handleLiquidationCreatedPerp,
  handleLiquidationDisputed as handleLiquidationDisputedPerp,
  handleDisputeSettled as handleDisputeSettledPerp,
  handleRequestWithdrawal as handleRequestWithdrawalPerp,
  handleRequestWithdrawalCanceled as handleRequestWithdrawalCanceledPerp,
  handleRequestWithdrawalExecuted as handleRequestWithdrawalExecutedPerp,
  handleFundingRateUpdated,
} from "./mappings/perpetual";
