import { ModuleProxyCreation } from "../../generated/ModuleProxyFactory/ModuleProxyFactory";
import { ProposalExecuted, TransactionsProposed } from "../../generated/OptimisticGovernor/OptimisticGovernor";
import { OptimisticGovernor } from "../../generated/templates";
import { ZERO_ADDRESS } from "../utils/constants";

import { getOrCreateProposal } from "../utils/helpers";

import { dataSource, log } from "@graphprotocol/graph-ts";

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
  log.error("No master copy found for network: {}", [_network]);
  return ZERO_ADDRESS;
}

export function handleModuleProxyCreation(event: ModuleProxyCreation): void {
  if (event.params.masterCopy.toHexString().toLowerCase() == getMasterCopy(network).toLowerCase()) {
    log.warning(`New Optimistic Governor deployed: {},{}`, [
      event.params.proxy.toHexString(),
      event.params.masterCopy.toHexString(),
    ]);
    OptimisticGovernor.create(event.params.proxy);
  }
}

export function handleTransactionsProposed(event: TransactionsProposed): void {
  let proposalId = event.params.assertionId.toHexString();
  let proposal = getOrCreateProposal(proposalId);

  proposal.ogAddress = event.address;
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
