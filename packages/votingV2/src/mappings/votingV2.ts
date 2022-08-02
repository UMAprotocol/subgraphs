import {
  PriceRequestAdded,
  PriceResolved,
  VoteCommitted,
  VoteRevealed,
  VotingV2,
} from "../../generated/Voting/VotingV2";
import { PriceRequestRound, VoterGroup } from "../../generated/schema";
import {
  getOrCreateUser,
  getOrCreateCommittedVote,
  getOrCreatePriceRequest,
  getOrCreateRevealedVote,
  getOrCreateRewardsClaimed,
  getOrCreatePriceRequestRound,
  getTokenContract,
  getOrCreateVoterGroup,
} from "../utils/helpers";
import { toDecimal } from "../utils/decimals";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ONE, BIGINT_ZERO } from "../utils/constants";

import { log, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

// - event: PriceRequestAdded(indexed uint256,indexed bytes32,uint256)
//   handler: handlePriceRequestAdded
//  event PriceRequestAdded(uint256 indexed roundId, bytes32 indexed identifier, uint256 time);

export function handlePriceRequestAdded(event: PriceRequestAdded): void {
  let requestId = event.params.identifier.toString().concat("-").concat(event.params.time.toString());
  let request = getOrCreatePriceRequest(requestId);
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));

  request.identifier = event.params.identifier.toString();
  request.latestRound = requestRound.id;
  request.time = event.params.time;

  request.isGovernance = event.params.isGovernance;
  requestRound.request = request.id;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;

  log.warning(`New Price Request Saved: {},{},{}`, [request.time.toString(), request.latestRound, request.identifier]);

  requestRound.save();
  request.save();
}

// - event: PriceResolved(indexed uint256,indexed bytes32,uint256,int256)
//   handler: handlePriceResolved
//  event PriceResolved(uint256 indexed roundId, bytes32 indexed identifier, uint256 time, int256 price);

export function handlePriceResolved(event: PriceResolved): void {
  log.warning(`Price Resolved params: {},{},{}`, [
    event.params.time.toString(),
    event.params.identifier.toString(),
    event.params.roundId.toString(),
  ]);
  let requestId = event.params.identifier.toString().concat("-").concat(event.params.time.toString());
  let request = getOrCreatePriceRequest(requestId);

  log.warning(`Fetched Price Request Entity: {},{},{}`, [
    request.time.toString(),
    request.latestRound,
    request.identifier,
  ]);
  let requestRound: PriceRequestRound = getOrCreatePriceRequestRound(
    requestId.concat("-").concat(event.params.roundId.toString())
  );
  let groupId = requestRound.id.concat("-").concat(event.params.price.toString());
  let voterGroup = getOrCreateVoterGroup(groupId);
  let votingContract = VotingV2.bind(event.address);
  let roundInfo = votingContract.try_rounds(event.params.roundId);

  request.latestRound = requestRound.id;
  request.price = event.params.price;
  request.resolutionTransaction = event.transaction.hash;
  request.resolutionTimestamp = event.block.timestamp;
  request.resolutionBlock = event.block.number;
  request.isResolved = true;

  voterGroup.won = true;

  requestRound.request = request.id;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;
  requestRound.votersEligibleForRewardsRatio = voterGroup.votersAmount.div(requestRound.votersAmount);

  requestRound.votersEligibleForRewardsPercentage =
    requestRound.votersEligibleForRewardsRatio.times(BIGDECIMAL_HUNDRED);
  requestRound.winnerGroup = voterGroup.id;
  requestRound.inflationRateRaw = roundInfo.reverted
    ? requestRound.inflationRateRaw
    : toDecimal(roundInfo.value.value0);
  requestRound.gatPercentageRaw = roundInfo.reverted
    ? requestRound.gatPercentageRaw
    : toDecimal(roundInfo.value.value1);
  requestRound.inflationRate = requestRound.inflationRateRaw.times(BIGDECIMAL_HUNDRED);
  requestRound.gatPercentage = requestRound.gatPercentageRaw.times(BIGDECIMAL_HUNDRED);

  requestRound.save();
  request.save();
  voterGroup.save();
}

// - event: VoteCommitted(indexed address,indexed uint256,indexed bytes32,uint256)
//   handler: handleVoteCommitted
//  event VoteCommitted(address indexed voter, uint256 indexed roundId, bytes32 indexed identifier, uint256 time);

export function handleVoteCommitted(event: VoteCommitted): void {
  let voteId = event.params.voter
    .toHexString()
    .concat("-")
    .concat(event.params.identifier.toString())
    .concat("-")
    .concat(event.params.time.toString())
    .concat("-")
    .concat(event.params.roundId.toString());
  let vote = getOrCreateCommittedVote(voteId);
  let voter = getOrCreateUser(event.params.voter);
  let requestId = event.params.identifier.toString().concat("-").concat(event.params.time.toString());
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));

  vote.voter = voter.id;
  vote.request = requestId;
  vote.identifier = event.params.identifier.toString();
  vote.time = event.params.time;
  vote.round = requestRound.id;

  requestRound.request = requestId;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;

  requestRound.save();
  vote.save();
  voter.save();
}

// - event: VoteRevealed(indexed address,indexed uint256,indexed bytes32,uint256,int256,uint256)
//   handler: handleVoteRevealed
//  event VoteRevealed(
//      address indexed voter,
//      uint256 indexed roundId,
//      bytes32 indexed identifier,
//      uint256 time,
//      int256 price,
//      uint256 numTokens
//  );

export function handleVoteRevealed(event: VoteRevealed): void {
  let voteId = event.params.voter
    .toHexString()
    .concat("-")
    .concat(event.params.identifier.toString())
    .concat("-")
    .concat(event.params.time.toString())
    .concat("-")
    .concat(event.params.roundId.toString());
  let vote = getOrCreateRevealedVote(voteId);
  let voter = getOrCreateUser(event.params.voter);
  let requestId = event.params.identifier.toString().concat("-").concat(event.params.time.toString());
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));
  let groupId = requestRound.id.concat("-").concat(event.params.price.toString());
  let voterGroup = getOrCreateVoterGroup(groupId);
  let votingContract = VotingV2.bind(event.address);
  let roundInfo = votingContract.try_rounds(event.params.roundId);

  vote.voter = voter.id;
  vote.round = requestRound.id;
  vote.request = requestId;
  vote.identifier = event.params.identifier.toString();
  vote.time = event.params.time;
  vote.price = event.params.price;
  vote.numTokens = event.params.numTokens;
  vote.group = voterGroup.id;

  voter.countReveals = voter.countReveals.plus(BIGINT_ONE);

  voterGroup.price = event.params.price;
  voterGroup.round = requestRound.id;
  voterGroup.totalVoteAmount = voterGroup.totalVoteAmount.plus(toDecimal(vote.numTokens));
  voterGroup.votersAmount = voterGroup.votersAmount.plus(BIGDECIMAL_ONE);

  requestRound.request = requestId;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;
  requestRound.totalVotesRevealed = requestRound.totalVotesRevealed.plus(toDecimal(vote.numTokens));
  requestRound.votersAmount = requestRound.votersAmount.plus(BIGDECIMAL_ONE);
  requestRound.snapshotId = roundInfo.reverted ? null : roundInfo.value.value0;
  if (requestRound.snapshotId != null && requestRound.totalSupplyAtSnapshot == null) {
    let supply = getTokenContract().try_totalSupplyAt(<BigInt>requestRound.snapshotId);
    requestRound.totalSupplyAtSnapshot = supply.reverted ? null : toDecimal(supply.value as BigInt);
  }
  requestRound.tokenVoteParticipationRatio =
    requestRound.totalSupplyAtSnapshot != null
      ? requestRound.totalVotesRevealed.div(requestRound.totalSupplyAtSnapshot)
      : null;
  requestRound.tokenVoteParticipationPercentage = requestRound.tokenVoteParticipationRatio.times(BIGDECIMAL_HUNDRED);

  requestRound.save();
  vote.save();
  voter.save();
  voterGroup.save();
}