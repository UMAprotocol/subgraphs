import {
  PriceRequest,
  PriceRequestRound,
  CommittedVote,
  RevealedVote,
  RewardsClaimed,
  VoterGroup,
  SlashedVote,
  Stakeholders,
} from "../../../generated/schema";
import { BIGDECIMAL_ZERO } from "../constants";
export const STAKEHOLDERS = "stakeholders";

export function getOrCreateStakeholders(): Stakeholders {
  let request = Stakeholders.load(STAKEHOLDERS);

  if (request == null) {
    request = new Stakeholders(STAKEHOLDERS);
    request.save();
  }

  return request as Stakeholders;
}

export function getOrCreatePriceRequest(id: String, createIfNotFound: boolean = true): PriceRequest {
  let request = PriceRequest.load(id);

  if (request == null && createIfNotFound) {
    request = new PriceRequest(id);
    request.isResolved = false;
  }

  return request as PriceRequest;
}

export function getOrCreatePriceRequestRound(id: String, createIfNotFound: boolean = true): PriceRequestRound {
  let requestRound = PriceRequestRound.load(id);

  if (requestRound == null && createIfNotFound) {
    requestRound = new PriceRequestRound(id);

    requestRound.totalVotesRevealed = BIGDECIMAL_ZERO;
    requestRound.totalRewardsClaimed = BIGDECIMAL_ZERO;
    requestRound.votersAmount = BIGDECIMAL_ZERO;
    requestRound.votersClaimedAmount = BIGDECIMAL_ZERO;
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
    vote.correctness = false;
    vote.processed = false;
    vote.voted = false;
  }

  return vote as SlashedVote;
}

export function getOrCreateCommittedVote(id: String, createIfNotFound: boolean = true): CommittedVote {
  let vote = CommittedVote.load(id);

  if (vote == null && createIfNotFound) {
    vote = new CommittedVote(id);
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
