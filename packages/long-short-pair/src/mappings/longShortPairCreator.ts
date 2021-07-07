import { CreatedLongShortPair } from "../../generated/LongShortPairCreator/LongShortPairCreator";

import { getOrCreateLongShortPairContract, getOrCreateToken } from "../utils/helpers";

import { LongShortPair } from "../../generated/templates/LongShortPair/LongShortPair";

import { log } from "@graphprotocol/graph-ts";

// - event: CreatedLongShortPair(indexed address,indexed address,address,address)
//   handler: handleCreatedLongShortPair

export function handleCreatedLongShortPair(event: CreatedLongShortPair): void {
  log.warning("lsp = {}, deployer = {}, longToken = {}, shortToken = {}", [
    event.params.longShortPair.toHexString(),
    event.params.deployerAddress.toHexString(),
    event.params.longToken.toHexString(),
    event.params.shortToken.toHexString(),
  ]);
  let contract = getOrCreateLongShortPairContract(event.params.longShortPair.toHexString());
  let lspContract = LongShortPair.bind(event.params.longShortPair);

  //TODO: Add the LSP creator (Factory) to this data type. I'm not exactly sure how to pull this info.
  // contract.creator = event.address; something like this

  let priceIdentifier = lspContract.try_priceIdentifier();
  let expirationTimestamp = lspContract.try_expirationTimestamp();
  let collateralToken = lspContract.try_collateralToken();
  let longToken = lspContract.try_longToken();
  let shortToken = lspContract.try_shortToken();
  let collateralPerPair = lspContract.try_collateralPerPair();
  let financialProductLibrary = lspContract.try_financialProductLibrary();
  let customAncillaryData = lspContract.try_customAncillaryData();
  let prepaidProposerReward = lspContract.try_prepaidProposerReward();
  let optimisticOracleProposerBond = lspContract.try_optimisticOracleProposerBond();

  let optimisticOracleLivenessTime = lspContract.try_optimisticOracleLivenessTime();
  if (!collateralToken.reverted) {
    let collateralTokenInstance = getOrCreateToken(collateralToken.value, true, true);
    contract.collateralToken = collateralTokenInstance.id;
  }
  if (!longToken.reverted) {
    let longTokenInstance = getOrCreateToken(longToken.value, true, true);
    contract.longToken = longTokenInstance.id;
  }
  if (!shortToken.reverted) {
    let shortTokenInstance = getOrCreateToken(shortToken.value, true, true);
    contract.shortToken = shortTokenInstance.id;
  }
  contract.deploymentTimestamp = event.block.timestamp;
  contract.deployer = event.params.deployerAddress;
  contract.address = event.params.longShortPair;

  contract.collateralPerPair = collateralPerPair.reverted ? null : collateralPerPair.value;
  contract.priceIdentifier = priceIdentifier.reverted ? null : priceIdentifier.value.toString();
  contract.expirationTimestamp = expirationTimestamp.reverted ? null : expirationTimestamp.value;
  contract.financialProductLibrary = financialProductLibrary.reverted ? null : financialProductLibrary.value;
  contract.customAncillaryData = customAncillaryData.reverted ? null : customAncillaryData.value.toString();
  contract.prepaidProposerReward = prepaidProposerReward.reverted ? null : prepaidProposerReward.value;
  contract.optimisticOracleProposerBond = optimisticOracleProposerBond.reverted
    ? null
    : optimisticOracleProposerBond.value;
  contract.optimisticOracleLivenessTime = optimisticOracleLivenessTime.reverted
    ? null
    : optimisticOracleLivenessTime.value;

  contract.contractState = "Open";
  contract.save();
}
