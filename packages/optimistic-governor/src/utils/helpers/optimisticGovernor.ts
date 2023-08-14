import { Bytes } from "@graphprotocol/graph-ts";
import { OptimisticGovernor, Proposal } from "../../../generated/schema";
import { BIGINT_ZERO } from "../constants";

export function getOrCreateOptimisticGovernor(id: string): OptimisticGovernor {
  let og = OptimisticGovernor.load(id);
  if (og == null) {
    og = new OptimisticGovernor(id);
  }
  return og as OptimisticGovernor;
}

export function getOrCreateProposal(id: string, createIfNotFound: boolean = true): Proposal {
  let proposal = Proposal.load(id);
  if (proposal == null && createIfNotFound) {
    proposal = new Proposal(id);
    proposal.proposer = Bytes.fromI32(0);
    proposal.proposalTime = BIGINT_ZERO;
    proposal.assertionId = Bytes.fromI32(0);
    proposal.proposalHash = Bytes.fromI32(0);
    proposal.executed = false;
    proposal.challengeWindowEnds = BIGINT_ZERO;
  }
  return proposal as Proposal;
}
