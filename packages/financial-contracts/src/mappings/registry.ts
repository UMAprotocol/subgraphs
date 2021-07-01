import { NewContractRegistered } from "../../generated/Registry/Registry";
import { CreatedExpiringMultiParty } from "../../generated/templates/ExpiringMultiPartyCreator/ExpiringMultiPartyCreator";
import { ExpiringMultiParty } from "../../generated/templates/ExpiringMultiParty/ExpiringMultiParty";
import { CreatedPerpetual } from "../../generated/templates/PerpetualCreator/PerpetualCreator";
import { Perpetual } from "../../generated/templates/Perpetual/Perpetual";

import {
  getOrCreatePerpetualContract,
  getOrCreateFinancialContract,
  getOrCreatePerpetualCreator,
  getOrCreateContractCreator,
  getOrCreateToken,
  calculateGCR,
} from "../utils/helpers";
import { EMP_CREATORS, PERP_CREATORS } from "../utils/constants";
import { toDecimal } from "../utils/decimals";
import { log, BigInt } from "@graphprotocol/graph-ts";

// - event: NewContractRegistered(indexed address,indexed address,address[])
//   handler: handleNewContractRegistered
export function handleNewContractRegistered(event: NewContractRegistered): void {
  log.warning(`emp? = {}, perp? = {}`, [
    BigInt.fromI32(EMP_CREATORS.includes(event.params.creator.toHexString())).toString(),
    BigInt.fromI32(PERP_CREATORS.includes(event.params.creator.toHexString())).toString(),
  ]);
  // Check if EMP:
  if (EMP_CREATORS.includes(event.params.creator.toHexString())) {
    // TODO: Rename to `getOrCreateEmp`
    let contract = getOrCreateFinancialContract(event.params.contractAddress.toHexString());
    let creator = getOrCreateContractCreator(event.params.creator.toHexString());

    contract.address = event.params.contractAddress;
    contract.creator = creator.id;

    contract.save();
    creator.save();
  }
  // Check if Perp:
  else if (PERP_CREATORS.includes(event.params.creator.toHexString())) {
    let contract = getOrCreatePerpetualContract(event.params.contractAddress.toHexString());
    let creator = getOrCreatePerpetualCreator(event.params.creator.toHexString());

    contract.address = event.params.contractAddress;
    contract.creator = creator.id;

    contract.save();
    creator.save();
  }
}

// - event: CreatedExpiringMultiParty(indexed address,indexed address)
//   handler: handleCreatedExpiringMultiParty

export function handleCreatedExpiringMultiParty(event: CreatedExpiringMultiParty): void {
  let contract = getOrCreateFinancialContract(event.params.expiringMultiPartyAddress.toHexString());
  let empContract = ExpiringMultiParty.bind(event.params.expiringMultiPartyAddress);

  log.warning("emp = {}, deployer = {}", [
    event.params.expiringMultiPartyAddress.toHexString(),
    event.params.deployerAddress.toHexString(),
  ]);

  let collateral = empContract.try_collateralCurrency();
  let synthetic = empContract.try_tokenCurrency();
  let requirement = empContract.try_collateralRequirement();
  let expiration = empContract.try_expirationTimestamp();
  let totalOutstanding = empContract.try_totalTokensOutstanding();
  let feeMultiplier = empContract.try_cumulativeFeeMultiplier();
  let rawCollateral = empContract.try_rawTotalPositionCollateral();
  let priceIdentifier = empContract.try_priceIdentifier();
  let minSponsorTokens = empContract.try_minSponsorTokens();
  let disputeBondPercentage = empContract.try_disputeBondPercentage();
  let sponsorDisputeRewardPercentage = empContract.try_sponsorDisputeRewardPercentage();
  let disputerDisputeRewardPercentage = empContract.try_disputerDisputeRewardPercentage();
  // Note: These three methods are named differently in old EMPs:
  let disputeBondPct = empContract.try_disputeBondPct();
  let sponsorDisputeRewardPct = empContract.try_sponsorDisputeRewardPct();
  let disputerDisputeRewardPct = empContract.try_disputerDisputeRewardPct();
  let withdrawalLiveness = empContract.try_withdrawalLiveness();
  let liquidationLiveness = empContract.try_liquidationLiveness();

  if (!collateral.reverted) {
    let collateralToken = getOrCreateToken(collateral.value, true, true);
    contract.collateralToken = collateralToken.id;
  }

  if (!synthetic.reverted) {
    let syntheticToken = getOrCreateToken(synthetic.value, true, false);
    contract.syntheticToken = syntheticToken.id;
  }

  contract.deploymentTimestamp = event.block.timestamp;
  contract.deployer = event.params.deployerAddress;
  contract.address = event.params.expiringMultiPartyAddress;
  contract.priceIdentifier = priceIdentifier.reverted ? null : priceIdentifier.value.toString();
  contract.minSponsorTokens = minSponsorTokens.reverted ? null : toDecimal(minSponsorTokens.value);
  contract.disputeBondPercentage = disputeBondPercentage.reverted
    ? disputeBondPct.reverted
      ? null
      : toDecimal(disputeBondPct.value)
    : toDecimal(disputeBondPercentage.value);
  contract.sponsorDisputeRewardPercentage = sponsorDisputeRewardPercentage.reverted
    ? sponsorDisputeRewardPct.reverted
      ? null
      : toDecimal(sponsorDisputeRewardPct.value)
    : toDecimal(sponsorDisputeRewardPercentage.value);
  contract.disputerDisputeRewardPercentage = disputerDisputeRewardPercentage.reverted
    ? disputerDisputeRewardPct.reverted
      ? null
      : toDecimal(disputerDisputeRewardPct.value)
    : toDecimal(disputerDisputeRewardPercentage.value);
  contract.withdrawalLiveness = withdrawalLiveness.reverted ? null : withdrawalLiveness.value;
  contract.liquidationLiveness = liquidationLiveness.reverted ? null : liquidationLiveness.value;
  contract.collateralRequirement = requirement.reverted ? null : toDecimal(requirement.value);
  contract.expirationTimestamp = expiration.reverted ? null : expiration.value;
  contract.totalTokensOutstanding = totalOutstanding.reverted ? null : toDecimal(totalOutstanding.value);
  contract.cumulativeFeeMultiplier = feeMultiplier.reverted ? null : toDecimal(feeMultiplier.value);
  contract.rawTotalPositionCollateral = rawCollateral.reverted ? null : toDecimal(rawCollateral.value);

  contract.globalCollateralizationRatio = calculateGCR(
    contract.rawTotalPositionCollateral,
    contract.cumulativeFeeMultiplier,
    contract.totalTokensOutstanding
  );

  contract.save();
}

// - event: CreatedPerpetual(indexed address,indexed address)
//   handler: handleCreatedPerpetual

export function handleCreatedPerpetual(event: CreatedPerpetual): void {
  let contract = getOrCreatePerpetualContract(event.params.perpetualAddress.toHexString());
  let perpetualContract = Perpetual.bind(event.params.perpetualAddress);

  log.warning("perpetual = {}, deployer = {}", [
    event.params.perpetualAddress.toHexString(),
    event.params.deployerAddress.toHexString(),
  ]);
  let collateral = perpetualContract.try_collateralCurrency();
  let synthetic = perpetualContract.try_tokenCurrency();
  let requirement = perpetualContract.try_collateralRequirement();
  let totalOutstanding = perpetualContract.try_totalTokensOutstanding();
  let feeMultiplier = perpetualContract.try_cumulativeFeeMultiplier();
  let fundingRateData = perpetualContract.try_fundingRate();
  let rawCollateral = perpetualContract.try_rawTotalPositionCollateral();
  let priceIdentifier = perpetualContract.try_priceIdentifier();
  let minSponsorTokens = perpetualContract.try_minSponsorTokens();
  let disputeBondPercentage = perpetualContract.try_disputeBondPercentage();
  let sponsorDisputeRewardPercentage = perpetualContract.try_sponsorDisputeRewardPercentage();
  let disputerDisputeRewardPercentage = perpetualContract.try_disputerDisputeRewardPercentage();
  let withdrawalLiveness = perpetualContract.try_withdrawalLiveness();
  let liquidationLiveness = perpetualContract.try_liquidationLiveness();

  if (!collateral.reverted) {
    let collateralToken = getOrCreateToken(collateral.value, true, true);
    contract.collateralToken = collateralToken.id;
  }

  if (!synthetic.reverted) {
    let syntheticToken = getOrCreateToken(synthetic.value, true, false);
    contract.syntheticToken = syntheticToken.id;
  }

  contract.deploymentTimestamp = event.block.timestamp;
  contract.deployer = event.params.deployerAddress;
  contract.address = event.params.perpetualAddress;
  contract.priceIdentifier = priceIdentifier.reverted ? null : priceIdentifier.value.toString();
  contract.minSponsorTokens = minSponsorTokens.reverted ? null : toDecimal(minSponsorTokens.value);
  contract.disputeBondPercentage = disputeBondPercentage.reverted ? null : toDecimal(disputeBondPercentage.value);
  contract.sponsorDisputeRewardPercentage = sponsorDisputeRewardPercentage.reverted
    ? null
    : toDecimal(sponsorDisputeRewardPercentage.value);
  contract.disputerDisputeRewardPercentage = disputerDisputeRewardPercentage.reverted
    ? null
    : toDecimal(disputerDisputeRewardPercentage.value);
  contract.withdrawalLiveness = withdrawalLiveness.reverted ? null : withdrawalLiveness.value;
  contract.liquidationLiveness = liquidationLiveness.reverted ? null : liquidationLiveness.value;
  contract.collateralRequirement = requirement.reverted ? null : toDecimal(requirement.value);
  contract.totalTokensOutstanding = totalOutstanding.reverted ? null : toDecimal(totalOutstanding.value);
  contract.cumulativeFeeMultiplier = feeMultiplier.reverted ? null : toDecimal(feeMultiplier.value);
  contract.cumulativeFundingRateMultiplier = fundingRateData.reverted
    ? null
    : toDecimal(fundingRateData.value.value2.rawValue);
  contract.rawTotalPositionCollateral = rawCollateral.reverted ? null : toDecimal(rawCollateral.value);

  contract.globalCollateralizationRatio = calculateGCR(
    contract.rawTotalPositionCollateral,
    contract.cumulativeFeeMultiplier,
    contract.totalTokensOutstanding
  );

  contract.save();
}
