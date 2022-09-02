import { PriceRequestRound } from "../../generated/schema";
import {
  ExecutedUnstake,
  PriceRequestAdded,
  PriceResolved,
  Staked,
  UpdatedActiveStake,
  UpdatedReward,
  VoteCommitted,
  VoteRevealed,
  VoterSlashed,
  VotingV2,
  WithdrawnRewards,
} from "../../generated/Voting/VotingV2";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ONE } from "../utils/constants";
import { defaultBigDecimal, defaultBigInt, toDecimal } from "../utils/decimals";
import {
  getOrCreateCommittedVote,
  getOrCreatePriceIdentifier,
  getOrCreatePriceRequest,
  getOrCreatePriceRequestRound,
  getOrCreateRevealedVote,
  getOrCreateUser,
  getOrCreateVoterGroup,
  getTokenContract,
} from "../utils/helpers";

import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

// - event: PriceRequestAdded(address,indexed uint256,indexed bytes32,indexed uint256,uint256,bytes,bool)
// event PriceRequestAdded(
//   address requester,
//   uint256 indexed roundId,
//   bytes32 indexed identifier,
//   uint256 indexed time,
//   uint256 requestIndex
//   bytes ancillaryData,
//   bool isGovernance
// );

export function handlePriceRequestAdded(event: PriceRequestAdded): void {
  let requestId = event.params.identifier.toString().concat("-").concat(event.params.time.toString());
  let request = getOrCreatePriceRequest(requestId);
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));

  request.identifier = event.params.identifier.toString();
  request.requestIndex = event.params.requestIndex;
  request.latestRound = requestRound.id;
  request.time = event.params.time;
  request.ancillaryData = event.params.ancillaryData.toHex();
  request.isGovernance = event.params.isGovernance;

  // If governance request we manually create an identifier as it doesn't exist on chain
  if (event.params.isGovernance) {
    let identifier = getOrCreatePriceIdentifier(event.params.identifier.toString());
    identifier.isSupported = true;
    identifier.save();
  }

  requestRound.request = request.id;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;

  log.warning(`New Price Request Saved: {},{},{}`, [request.time.toString(), request.latestRound, request.identifier]);

  requestRound.save();
  request.save();
}

// event PriceResolved(
//   uint256 indexed roundId,
//   bytes32 indexed identifier,
//   uint256 time,
//   uint256 requestIndex,
//   int256 price,
//   bytes ancillaryData
// );

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
  let cumulativeActiveStakeAtRound = roundInfo.reverted
    ? toDecimal(BigInt.fromString("0"))
    : toDecimal(roundInfo.value.value1);

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
  requestRound.gat = roundInfo.reverted ? requestRound.gat : toDecimal(roundInfo.value.value0);

  requestRound.gatPercentageRaw = requestRound.gat.div(toDecimal(getTokenContract().try_totalSupply().value));
  requestRound.gatPercentage = requestRound.gatPercentageRaw.times(BIGDECIMAL_HUNDRED);
  requestRound.cumulativeActiveStakeAtRound = cumulativeActiveStakeAtRound;

  requestRound.save();
  request.save();
  voterGroup.save();
}

// - event: VoteCommitted(indexed address,indexed address,uint256,indexed bytes32,uint256,bytes)
// event VoteCommitted(
//   address indexed voter,
//   address indexed caller,
//   uint256 roundId,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData TODO check if we want to use this
// );

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
// - event: VoteRevealed(indexed address,indexed address,uint256,indexed bytes32,uint256,int256,bytes,uint256)
// event VoteRevealed(
//   address indexed voter,
//   address indexed caller,  TODO check if we want to use this
//   uint256 roundId,
//   bytes32 indexed identifier,
//   uint256 time,
//   int256 price,
//   bytes ancillaryData,   TODO check if we want to use this
//   uint256 numTokens
// );

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
  let cumulativeActiveStakeAtRound = roundInfo.reverted
    ? toDecimal(BigInt.fromString("0"))
    : toDecimal(roundInfo.value.value1);

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

  requestRound.tokenVoteParticipationRatio = cumulativeActiveStakeAtRound.gt(BIGDECIMAL_ZERO)
    ? requestRound.totalVotesRevealed.div(<BigDecimal>cumulativeActiveStakeAtRound)
    : BigDecimal.fromString("0");
  requestRound.tokenVoteParticipationPercentage = requestRound.tokenVoteParticipationRatio.times(BIGDECIMAL_HUNDRED);

  requestRound.save();
  vote.save();
  voter.save();
  voterGroup.save();
}

// event Staked(
//   address indexed voter,
//   address indexed from,
//   uint256 amount,
//   uint256 voterActiveStake,
//   uint256 voterPendingStake,
//   uint256 voterPendingUnstake,
//   uint256 cumulativeActiveStake,
//   uint256 cumulativePendingStake
// );

export function handleStaked(event: Staked): void {
  let user = getOrCreateUser(event.params.voter);
  user.voterActiveStake = toDecimal(event.params.voterActiveStake);
  user.voterPendingStake = toDecimal(event.params.voterPendingStake);
  user.voterPendingUnstake = toDecimal(event.params.voterPendingUnstake);
  user.cumulativeActiveStake = toDecimal(event.params.cumulativeActiveStake);
  user.cumulativePendingStake = toDecimal(event.params.cumulativePendingStake);
  user.save();
}

// event UpdatedActiveStake(
//   address indexed voter,
//   uint256 voterActiveStake,
//   uint256 voterPendingStake,
//   uint256 cumulativeActiveStake,
//   uint256 cumulativePendingStake
// );

export function handleUpdatedActiveStake(event: UpdatedActiveStake): void {
  let user = getOrCreateUser(event.params.voter);
  user.voterActiveStake = toDecimal(event.params.voterActiveStake);
  user.voterPendingStake = toDecimal(event.params.voterPendingStake);
  user.cumulativeActiveStake = toDecimal(event.params.cumulativeActiveStake);
  user.cumulativePendingStake = toDecimal(event.params.cumulativePendingStake);
  user.save();
}

// event UpdatedReward(address indexed voter, uint256 newReward, uint256 lastUpdateTime);

export function handleUpdatedReward(event: UpdatedReward): void {
  let user = getOrCreateUser(event.params.voter);
  let votingContract = VotingV2.bind(event.address);
  let voterStake = votingContract.try_voterStakes(event.params.voter);

  user.outstandingRewards = voterStake.reverted ? user.outstandingRewards : toDecimal(voterStake.value.value4);
  user.rewardsLastUpdateTime = event.params.lastUpdateTime;

  user.save();
}

// event WithdrawnRewards(address indexed voter, address indexed delegate, uint256 tokensWithdrawn);

export function handleWithdrawnRewards(event: WithdrawnRewards): void {
  let user = getOrCreateUser(event.params.voter);

  user.claimedRewards = defaultBigDecimal(user.claimedRewards).plus(toDecimal(event.params.tokensWithdrawn));
  user.claimedRewardsLastUpdateTime = event.block.timestamp;

  user.save();
}

// event VoterSlashed(address indexed voter, int256 slashedTokens, uint256 postActiveStake);

export function handleVoterSlashed(event: VoterSlashed): void {
  let user = getOrCreateUser(event.params.voter);

  let newSlashed = defaultBigDecimal(user.slashed).plus(toDecimal(event.params.slashedTokens));
  let newSlashedLastUpdateTime = event.block.timestamp;

  let numerator = newSlashed.minus(defaultBigDecimal(user.slashed));
  let denominator = newSlashedLastUpdateTime.minus(defaultBigInt(user.slashedLastUpdateTime)).toBigDecimal();
  user.slashedPerSecond = denominator.equals(BIGDECIMAL_ZERO) ? BIGDECIMAL_ZERO : numerator.div(denominator);
  user.slashed = newSlashed;
  user.slashedLastUpdateTime = newSlashedLastUpdateTime;
  user.voterActiveStake = toDecimal(event.params.postActiveStake);

  user.save();
}

// event ExecutedUnstake(
//   address indexed voter,
//   uint256 tokensSent,
//   uint256 voterActiveStake,
//   uint256 voterPendingStake
// );

export function handleExecutedUnstake(event: ExecutedUnstake): void {
  let user = getOrCreateUser(event.params.voter);
  user.voterActiveStake = toDecimal(event.params.voterActiveStake);
  user.voterPendingStake = toDecimal(event.params.voterPendingStake);
  user.save();
}
