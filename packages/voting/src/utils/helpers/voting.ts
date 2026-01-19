import { BigInt, Bytes, crypto } from "@graphprotocol/graph-ts";
import {
  PriceRequest,
  PriceRequestRound,
  CommittedVote,
  RevealedVote,
  RewardsClaimed,
  VoterGroup,
} from "../../../generated/schema";
import { BIGDECIMAL_ZERO } from "../constants";

// Helper function to hash ancillaryData
function hashAncillaryData(ancillaryData: Bytes): string {
  return crypto.keccak256(ancillaryData).toHexString();
}

// Creates ID for PriceRequestRound: requestId-roundId-hash(ancillaryData)
export function createPriceRequestRoundId(
  requestId: string,
  roundId: BigInt,
  ancillaryData: Bytes
): string {
  return requestId
    .concat("-")
    .concat(roundId.toString())
    .concat("-")
    .concat(hashAncillaryData(ancillaryData));
}

// Creates ID for vote entities: voter-identifier-time-roundId-hash(ancillaryData)
export function createVoteId(
  voter: string,
  identifier: string,
  time: BigInt,
  roundId: BigInt,
  ancillaryData: Bytes
): string {
  return voter
    .concat("-")
    .concat(identifier)
    .concat("-")
    .concat(time.toString())
    .concat("-")
    .concat(roundId.toString())
    .concat("-")
    .concat(hashAncillaryData(ancillaryData));
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
