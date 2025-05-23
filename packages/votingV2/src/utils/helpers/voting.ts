import {
  CommittedVote,
  Global,
  PriceRequest,
  PriceRequestRound,
  RevealedVote,
  SlashedVote,
  SlashingTracker,
  VoterGroup,
} from "../../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constants";
export const GLOBAL = "global";

export function getOrCreateGlobals(): Global {
  let request = Global.load(GLOBAL);

  if (request == null) {
    request = new Global(GLOBAL);
    request.userAddresses = [];
    request.cumulativeStake = BIGDECIMAL_ZERO;
    request.emissionRate = BIGDECIMAL_ZERO;
    request.annualVotingTokenEmission = BIGDECIMAL_ZERO;
    request.annualPercentageReturn = BIGDECIMAL_ZERO;
    request.maxNextIndexToProcess = BIGINT_ZERO;
    request.countCorrectVotes = BIGINT_ZERO;
    request.countWrongVotes = BIGINT_ZERO;
    request.countNoVotes = BIGINT_ZERO;
  }

  return request as Global;
}

export function getOrCreatePriceRequest(id: String, createIfNotFound: boolean = true): PriceRequest {
  let request = PriceRequest.load(id);

  if (request == null && createIfNotFound) {
    request = new PriceRequest(id);
    request.isResolved = false;
    request.isDeleted = false;
    request.rollCount = BIGINT_ZERO;
  }

  return request as PriceRequest;
}

export function getOrCreateSlashingTracker(id: String, createIfNotFound: boolean = true): SlashingTracker {
  let slashingTracker = SlashingTracker.load(id);

  if (slashingTracker == null && createIfNotFound) {
    slashingTracker = new SlashingTracker(id);
    slashingTracker.lastVotingRound = BIGINT_ZERO;
    slashingTracker.wrongVoteSlashPerToken = BIGDECIMAL_ZERO;
    slashingTracker.noVoteSlashPerToken = BIGDECIMAL_ZERO;
    slashingTracker.totalSlashed = BIGDECIMAL_ZERO;
    slashingTracker.totalCorrectVotes = BIGDECIMAL_ZERO;
  }

  return slashingTracker as SlashingTracker;
}

export function getOrCreatePriceRequestRound(id: String, createIfNotFound: boolean = true): PriceRequestRound {
  let requestRound = PriceRequestRound.load(id);

  if (requestRound == null && createIfNotFound) {
    requestRound = new PriceRequestRound(id);

    requestRound.totalVotesRevealed = BIGDECIMAL_ZERO;
    requestRound.votersAmount = BIGDECIMAL_ZERO;
    requestRound.countCorrectVotes = BIGINT_ZERO;
    requestRound.countWrongVotes = BIGINT_ZERO;
    requestRound.countNoVotes = BIGINT_ZERO;
    requestRound.cumulativeCorrectVoteSlash = BIGDECIMAL_ZERO;
    requestRound.cumulativeWrongVoteSlash = BIGDECIMAL_ZERO;
    requestRound.cumulativeNoVoteSlash = BIGDECIMAL_ZERO;
    requestRound.totalTokensCommitted = BIGDECIMAL_ZERO;
  }

  return requestRound as PriceRequestRound;
}

export function getOrCreateSlashedVote(
  id: String,
  requestId: string,
  voterId: string,
  createIfNotFound: boolean = true
): SlashedVote {
  let vote = SlashedVote.load(id);

  if (vote == null && createIfNotFound) {
    vote = new SlashedVote(id);
    vote.voter = voterId;
    vote.request = requestId;
    vote.slashAmount = BIGDECIMAL_ZERO;
    vote.voted = false;
    vote.correctness = false;
    vote.staking = false;
    vote.isGovernance = false;

    vote.save();
  }

  return vote as SlashedVote;
}

export function getOrCreateCommittedVote(id: String, createIfNotFound: boolean = true): CommittedVote {
  let vote = CommittedVote.load(id);

  if (vote == null && createIfNotFound) {
    vote = new CommittedVote(id);
    vote.numTokens = BIGINT_ZERO;
  }

  return vote as CommittedVote;
}

export function getOrCreateRevealedVote(id: String, createIfNotFound: boolean = true): RevealedVote {
  let vote = RevealedVote.load(id);

  if (vote == null && createIfNotFound) {
    vote = new RevealedVote(id);
  }

  return vote as RevealedVote;
}

export function getOrCreateRewardsClaimed(id: String, createIfNotFound: boolean = true): RewardsClaimed {
  let rewards = RewardsClaimed.load(id);

  if (rewards == null && createIfNotFound) {
    rewards = new RewardsClaimed(id);
  }

  return rewards as RewardsClaimed;
}

export function getOrCreateVoterGroup(id: String, createIfNotFound: boolean = true): VoterGroup {
  let group = VoterGroup.load(id);

  if (group == null && createIfNotFound) {
    group = new VoterGroup(id);
    group.won = false;
    group.totalVoteAmount = BIGDECIMAL_ZERO;
    group.votersAmount = BIGDECIMAL_ZERO;
  }

  return group as VoterGroup;
}

export function getVoteId(
  voter: string,
  identifier: string,
  time: string,
  ancillaryData: string,
  roundId: string
): string {
  return voter
    .concat("-")
    .concat(identifier)
    .concat("-")
    .concat(time)
    .concat("-")
    .concat(ancillaryData)
    .concat("-")
    .concat(roundId);
}

export function getVoteIdNoRoundId(voter: string, identifier: string, time: string, ancillaryData: string): string {
  return voter.concat("-").concat(identifier).concat("-").concat(time).concat("-").concat(ancillaryData);
}

export function getPriceRequestId(identifier: string, time: string, ancillaryData: string): string {
  return identifier.concat("-").concat(time).concat("-").concat(ancillaryData);
}

export function getSlashingTransactionId(transactionHash: string, voter: string): string {
  return transactionHash.concat("-").concat(voter);
}
