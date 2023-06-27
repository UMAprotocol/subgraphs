import { ModuleProxyCreation } from "../../generated/ModuleProxyFactory/ModuleProxyFactory";
import { ProposalExecuted, TransactionsProposed } from "../../generated/OptimisticGovernor/OptimisticGovernor";
import { OptimisticGovernor } from "../../generated/templates";

import { getOrCreateProposal } from "../utils/helpers";

import { dataSource, log } from "@graphprotocol/graph-ts";

let network = dataSource.network();

function getMasterCopy(_network: string): string {
  if (_network == "mainnet") {
    return "0x28CeBFE94a03DbCA9d17143e9d2Bd1155DC26D5d";
  }
  return "0x28CeBFE94a03DbCA9d17143e9d2Bd1155DC26D5d";
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
  let proposalId = event.address.toHexString().concat("-").concat(event.params.proposalHash.toHexString());
  let proposal = getOrCreateProposal(proposalId);

  proposal.proposer = event.params.proposer;
  proposal.proposalTime = event.params.proposalTime;
  proposal.assertionId = event.params.assertionId;
  proposal.proposalHash = event.params.proposalHash;
  proposal.proposalTimestamp = event.block.timestamp;
  proposal.challengeWindowEnds = event.params.challengeWindowEnds;
  proposal.rules = event.params.rules;
  proposal.explanation = event.params.explanation;

  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposalId = event.address.toHexString().concat("-").concat(event.params.proposalHash.toHexString());
  let proposal = getOrCreateProposal(proposalId);

  proposal.executed = true;
  proposal.executionTransactionHash = event.transaction.hash.toHexString();

  proposal.save();
}
