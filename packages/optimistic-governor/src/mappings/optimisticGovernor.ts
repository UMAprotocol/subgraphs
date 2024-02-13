import { ModuleProxyCreation } from "../../generated/ModuleProxyFactory/ModuleProxyFactory";
import {
  ProposalExecuted,
  ProposalDeleted,
  TransactionsProposed,
  OptimisticGovernor as OptimisticGovernorContract,
  TargetSet,
} from "../../generated/templates/OptimisticGovernor/OptimisticGovernor";
import { Safe as SafeContract } from "../../generated/ModuleProxyFactory/Safe";
import { OptimisticGovernor, Safe } from "../../generated/templates";
import { BIGINT_ONE, ZERO_ADDRESS } from "../utils/constants";

import { getOrCreateProposal } from "../utils/helpers";

import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { getOrCreateOptimisticGovernor, getOrCreateSafe } from "../utils/helpers/optimisticGovernor";
import { DisabledModule, EnabledModule } from "../../generated/templates/Safe/Safe";

let network = dataSource.network();

function getMasterCopy(_network: string): string {
  if (_network == "mainnet") {
    return "0x28CeBFE94a03DbCA9d17143e9d2Bd1155DC26D5d";
  }
  if (_network == "matic") {
    return "0x3Cc4b597E9c3f51288c6Cd0c087DC14c3FfdD966";
  }
  if (_network == "optimism") {
    return "0x357fe84E438B3150d2F68AB9167bdb8f881f3b9A";
  }
  if (_network == "arbitrum-one") {
    return "0x30679ca4ea452d3df8a6c255a806e08810321763";
  }
  if (_network == "avalanche") {
    return "0xEF8b46765ae805537053C59f826C3aD61924Db45";
  }
  if (_network == "gnosis") {
    return "0x972396Ab668cd11dc1F6321A5ae30c6A8d3759F0";
  }
  if (_network == "goerli") {
    return "0x07a7Be7AA4AaD42696A17e974486cb64A4daC47b";
  }
  if (_network == "core") {
    // Network name conflicts with Core Testnet, below is mainnet, but need to manually set to testnet address if redeploying.
    return "0x596Fd6A5A185c67aBD1c845b39f593fBA9C233aa";
  }
  log.error("No master copy found for network: {}", [_network]);
  return ZERO_ADDRESS;
}

export function handleModuleProxyCreation(event: ModuleProxyCreation): void {
  if (event.params.masterCopy.toHexString().toLowerCase() == getMasterCopy(network).toLowerCase()) {
    log.warning(`New Optimistic Governor deployed: {},{}`, [
      event.params.proxy.toHexString(),
      event.params.masterCopy.toHexString(),
    ]);

    let optimisticGovernor = getOrCreateOptimisticGovernor(event.params.proxy.toHexString());
    let og = OptimisticGovernorContract.bind(event.params.proxy);
    let safeAddress = og.try_target();
    optimisticGovernor.safe = safeAddress.reverted ? ZERO_ADDRESS : safeAddress.value.toHexString();

    let safe = getOrCreateSafe(optimisticGovernor.safe);
    safe.optimisticGovernor = event.params.proxy.toHexString();

    let safeContract = SafeContract.bind(Address.fromString(optimisticGovernor.safe));
    let isOgEnabled = safeContract.try_isModuleEnabled(event.address);
    safe.isOptimisticGovernorEnabled = isOgEnabled.reverted ? false : isOgEnabled.value;

    // Save entities
    safe.save();
    optimisticGovernor.save();

    // Create new data source for this Optimistic Governor contract and Safe
    OptimisticGovernor.create(event.params.proxy);
    Safe.create(Address.fromString(optimisticGovernor.safe));
  }
}

export function handleTransactionsProposed(event: TransactionsProposed): void {
  let proposalId = event.params.assertionId.toHexString();
  let proposal = getOrCreateProposal(proposalId);

  proposal.optimisticGovernor = event.address.toHexString();
  proposal.proposer = event.params.proposer;
  proposal.proposalTime = event.params.proposalTime;
  proposal.assertionId = event.params.assertionId;
  proposal.proposalHash = event.params.proposalHash;
  proposal.challengeWindowEnds = event.params.challengeWindowEnds;
  proposal.rules = event.params.rules;
  proposal.explanation = event.params.explanation;
  proposal.explanationText = event.params.explanation.toString();

  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposalId = event.params.assertionId.toHexString();
  let proposal = getOrCreateProposal(proposalId);

  proposal.executed = true;
  proposal.executionTransactionHash = event.transaction.hash.toHexString();

  proposal.save();
}

export function handleProposalDeleted(event: ProposalDeleted): void {
  let proposalId = event.params.assertionId.toHexString();
  let proposal = getOrCreateProposal(proposalId);

  proposal.deleted = true;

  proposal.save();
}

export function handleTargetSet(event: TargetSet): void {
  let optimisticGovernor = getOrCreateOptimisticGovernor(event.address.toHexString());
  let safe = getOrCreateSafe(event.params.newTarget.toHexString());
  safe.optimisticGovernor = event.address.toHexString();
  optimisticGovernor.safe = event.params.newTarget.toHexString();

  // Check if the Optimistic Governor is enabled on the Safe
  let safeContract = SafeContract.bind(event.params.newTarget);
  let isOgEnabled = safeContract.try_isModuleEnabled(event.address);
  safe.isOptimisticGovernorEnabled = isOgEnabled.reverted ? false : isOgEnabled.value;

  // Create new Safe data source
  Safe.create(event.params.newTarget);

  optimisticGovernor.save();
  safe.save();
}

export function handleSafeDisabledModule(event: DisabledModule): void {
  let safe = getOrCreateSafe(event.address.toHexString());
  if (safe.optimisticGovernor.toLowerCase() == event.params.module.toHexString().toLowerCase()) {
    safe.isOptimisticGovernorEnabled = false;
    safe.save();
  }
}

export function handleSafeEnabledModule(event: EnabledModule): void {
  let safe = getOrCreateSafe(event.address.toHexString());
  if (safe.optimisticGovernor.toLowerCase() == event.params.module.toHexString().toLowerCase()) {
    safe.isOptimisticGovernorEnabled = true;
    safe.save();
  }
}
