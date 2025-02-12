import { PriceRequestRound, RevealedVote } from "../../generated/schema";
import {
  ExecutedUnstake,
  RequestAdded,
  RequestDeleted,
  RequestResolved,
  RequestRolled,
  RequestedUnstake,
  Staked,
  UpdatedReward,
  VoteCommitted,
  VoteRevealed,
  VoterSlashed,
  VotingV2,
  WithdrawnRewards,
} from "../../generated/Voting/VotingV2";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ONE, BIGINT_ZERO } from "../utils/constants";
import {
  defaultBigDecimal,
  defaultBigInt,
  safeDivBigDecimal,
  toDecimal
} from "../utils/decimals";
import {
  getOrCreateCommittedVote,
  getOrCreatePriceIdentifier,
  getOrCreatePriceRequest,
  getOrCreatePriceRequestRound,
  getOrCreateRevealedVote,
  getOrCreateUser,
  getOrCreateVoterGroup
} from "../utils/helpers";

import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  getOrCreateGlobals,
  getOrCreateSlashedVote,
  getOrCreateSlashingTracker,
  getPriceRequestId,
  getVoteId,
  getVoteIdNoRoundId,
} from "../utils/helpers/voting";

// - event: RequestAdded(indexed address,indexed uint256,indexed bytes32,uint256,bytes,bool)
// event RequestAdded(
//   address indexed requester,
//   uint256 indexed roundId,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData,
//   bool isGovernance
// );

export function handlePriceRequestAdded(event: RequestAdded): void {
  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));

  request.identifier = event.params.identifier.toString();
  request.requestTransaction = event.transaction.hash;
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

  log.warning(`New Price Request Saved: {},{},{}`, [
    request.time.toString(),
    <string>request.latestRound || "",
    request.identifier,
  ]);

  requestRound.save();
  request.save();
}
// - RequestResolved(indexed uint256,indexed uint256,indexed bytes32,uint256,bytes,int256)
// event RequestResolved(
//   uint256 indexed roundId,
//   uint256 indexed resolvedPriceRequestIndex,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData,
//   int256 price
// );

export function handlePriceResolved(event: RequestResolved): void {
  log.warning(`Price Resolved params: {},{},{}`, [
    event.params.time.toString(),
    event.params.identifier.toString(),
    event.params.roundId.toString(),
  ]);
  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);

  request.resolvedPriceRequestIndex = event.params.resolvedPriceRequestIndex;

  log.warning(`Fetched Price Request Entity: {},{},{}`, [
    request.time.toString(),
    <string>request.latestRound || "",
    request.identifier,
  ]);
  let requestRound: PriceRequestRound = getOrCreatePriceRequestRound(
    requestId.concat("-").concat(event.params.roundId.toString())
  );
  let groupId = requestRound.id.concat("-").concat(event.params.price.toString());
  let voterGroup = getOrCreateVoterGroup(groupId);
  let votingContract = VotingV2.bind(event.address);
  let roundInfo = votingContract.try_rounds(event.params.roundId);
  let cumulativeStakeAtRound = roundInfo.reverted
    ? toDecimal(BigInt.fromString("0"))
    : toDecimal(roundInfo.value.value3);

  let slashingTrackers = votingContract.try_requestSlashingTrackers(event.params.resolvedPriceRequestIndex);
  let slashingTracker = getOrCreateSlashingTracker(requestId);
  slashingTracker.lastVotingRound = event.params.roundId;
  slashingTracker.totalSlashed = toDecimal(slashingTrackers.value.totalSlashed);
  slashingTracker.totalCorrectVotes = toDecimal(slashingTrackers.value.totalCorrectVotes);
  slashingTracker.wrongVoteSlashPerToken = toDecimal(slashingTrackers.value.wrongVoteSlashPerToken);
  slashingTracker.noVoteSlashPerToken = toDecimal(slashingTrackers.value.noVoteSlashPerToken);

  request.latestRound = requestRound.id;
  request.price = event.params.price;
  request.resolutionTransaction = event.transaction.hash;
  request.resolutionTimestamp = event.block.timestamp;
  request.resolutionBlock = event.block.number;
  request.isResolved = true;
  request.slashingTracker = slashingTracker.id;

  voterGroup.won = true;

  requestRound.request = request.id;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;
  requestRound.winnerGroup = voterGroup.id;
  requestRound.slashingLibrary = roundInfo.value.value0.toHexString();
  requestRound.minParticipationRequirement = toDecimal(roundInfo.value.value1);
  requestRound.minAgreementRequirement = toDecimal(roundInfo.value.value2);

  requestRound.cumulativeStakeAtRound = cumulativeStakeAtRound;

  requestRound.save();
  request.save();
  voterGroup.save();
  slashingTracker.save();
}

// - event: VoteCommitted(indexed address,indexed address,uint256,indexed bytes32,uint256,bytes)
// event VoteCommitted(
//   address indexed voter,
//   address indexed caller,
//   uint256 roundId,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData
// );

export function handleVoteCommitted(event: VoteCommitted): void {
  let voteId = getVoteId(
    event.params.voter.toHexString(),
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString(),
    event.params.roundId.toString()
  );
  let vote = getOrCreateCommittedVote(voteId);
  let voter = getOrCreateUser(event.params.voter);
  let votingContract = VotingV2.bind(event.address);
  const voterStakeData = votingContract.try_voterStakes(event.params.voter);

  // get voter's stake at time of commit
  const voterTokensCommitted = voterStakeData.reverted
    ? BigInt.fromString("0")
    : voterStakeData.value.value0;

  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));

  let request = getOrCreatePriceRequest(requestId);
  request.latestRound = requestRound.id;

  vote.voter = voter.id;
  vote.request = requestId;
  vote.identifier = event.params.identifier.toString();
  vote.time = event.params.time;
  vote.round = requestRound.id;
  vote.numTokens = voterTokensCommitted;

  requestRound.request = requestId;
  requestRound.identifier = event.params.identifier.toString();
  requestRound.time = event.params.time;
  requestRound.roundId = event.params.roundId;
  // if user has voted previously, remove previous token amount, add new
  requestRound.totalTokensCommitted = requestRound.totalTokensCommitted.minus(toDecimal(vote.numTokens)).plus(toDecimal(voterTokensCommitted));

  // update voter's stake value

  requestRound.save();
  request.save();
  vote.save();
  voter.save();
}
// - event: VoteRevealed(indexed address,indexed address,uint256,indexed bytes32,uint256,bytes,int256,uint256)
// event VoteRevealed(
//   address indexed voter,
//   address indexed caller,
//   uint256 roundId,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData,
//   int256 price,
//   uint256 numTokens
// );

export function handleVoteRevealed(event: VoteRevealed): void {
  let voteId = getVoteId(
    event.params.voter.toHexString(),
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString(),
    event.params.roundId.toString()
  );
  let vote = getOrCreateRevealedVote(voteId);
  let voter = getOrCreateUser(event.params.voter);
  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));
  let groupId = requestRound.id.concat("-").concat(event.params.price.toString());
  let voterGroup = getOrCreateVoterGroup(groupId);
  let votingContract = VotingV2.bind(event.address);
  let roundInfo = votingContract.try_rounds(event.params.roundId);
  let cumulativeStakeAtRound = roundInfo.reverted
    ? toDecimal(BigInt.fromString("0"))
    : toDecimal(roundInfo.value.value3);

  request.latestRound = requestRound.id;

  vote.voter = voter.id;
  vote.round = requestRound.id;
  vote.request = requestId;
  vote.identifier = event.params.identifier.toString();
  vote.time = event.params.time;
  vote.price = event.params.price;
  vote.numTokens = event.params.numTokens;
  vote.group = voterGroup.id;

  voter.countReveals = defaultBigInt(voter.countReveals).plus(BIGINT_ONE);

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
  requestRound.lastRevealTime = event.block.timestamp;

  requestRound.tokenVoteParticipationRatio = safeDivBigDecimal(
    requestRound.totalVotesRevealed,
    <BigDecimal>cumulativeStakeAtRound
  );
  requestRound.tokenVoteParticipationPercentage = defaultBigDecimal(requestRound.tokenVoteParticipationRatio).times(
    BIGDECIMAL_HUNDRED
  );
  requestRound.cumulativeStakeAtRound = cumulativeStakeAtRound;
  requestRound.minParticipationRequirement = toDecimal(roundInfo.value.value1);
  requestRound.minAgreementRequirement = toDecimal(roundInfo.value.value2);

  let voteSlashedId = getVoteIdNoRoundId(
    event.params.voter.toHexString(),
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );

  let voteSlashed = getOrCreateSlashedVote(voteSlashedId, requestId, voter.id);
  voteSlashed.voted = true;
  voteSlashed.staking = vote.numTokens.equals(BIGINT_ZERO) ? false : true;

  requestRound.save();
  vote.save();
  voter.save();
  voterGroup.save();
  request.save();
  voteSlashed.save();
}

// - event: Staked(indexed address,indexed address,uint256,uint256,uint256,uint256)
// event Staked(
//   address indexed voter,
//   address indexed from,
//   uint256 amount,
//   uint256 voterStake,
//   uint256 voterPendingUnstake,
//   uint256 cumulativeStake
// );

export function handleStaked(event: Staked): void {
  let user = getOrCreateUser(event.params.voter);
  let global = getOrCreateGlobals();
  user.voterStake = toDecimal(event.params.voterStake);
  user.voterPendingUnstake = toDecimal(event.params.voterPendingUnstake);
  user.cumulativeStakeNoSlashing = defaultBigDecimal(user.cumulativeStakeNoSlashing).plus(
    toDecimal(event.params.amount)
  );
  global.cumulativeStake = toDecimal(event.params.cumulativeStake);

  let newUserAddresses = global.userAddresses;
  if (!newUserAddresses.includes(event.params.voter.toHexString()))
    newUserAddresses.push(event.params.voter.toHexString());
  global.userAddresses = newUserAddresses;

  user.voterCalculatedStake = user.voterCalculatedStake.plus(toDecimal(event.params.amount));

  user.save();
  global.save();

  let votingContract = VotingV2.bind(event.address);
  let emissionRate = votingContract.try_emissionRate();

  updateAprs(
    global.userAddresses,
    emissionRate.reverted ? BigInt.fromI32(0) : emissionRate.value,
    global.cumulativeStake
  );
}

// RequestedUnstake(address indexed voter, uint256 amount, uint256 unstakeTime, uint256 voterStake);

export function handleRequestedUnstake(event: RequestedUnstake): void {
  let user = getOrCreateUser(event.params.voter);
  let global = getOrCreateGlobals();
  user.voterStake = toDecimal(event.params.voterStake);
  user.voterPendingUnstake = toDecimal(event.params.amount);
  user.cumulativeStakeNoSlashing = defaultBigDecimal(user.cumulativeStakeNoSlashing).minus(
    toDecimal(event.params.amount)
  );
  global.cumulativeStake = global.cumulativeStake.minus(toDecimal(event.params.amount));

  let newUserAddresses = global.userAddresses;
  if (!newUserAddresses.includes(event.params.voter.toHexString()))
    newUserAddresses.push(event.params.voter.toHexString());
  global.userAddresses = newUserAddresses;

  user.voterCalculatedStake = user.voterCalculatedStake.minus(toDecimal(event.params.amount));

  user.save();
  global.save();

  let votingContract = VotingV2.bind(event.address);
  let emissionRate = votingContract.try_emissionRate();

  updateAprs(
    global.userAddresses,
    emissionRate.reverted ? BigInt.fromI32(0) : emissionRate.value,
    global.cumulativeStake
  );
}

// event UpdatedReward(address indexed voter, uint256 newReward, uint256 lastUpdateTime);

export function handleUpdatedReward(event: UpdatedReward): void {
  let user = getOrCreateUser(event.params.voter);
  let global = getOrCreateGlobals();
  let votingContract = VotingV2.bind(event.address);
  let voterStake = votingContract.try_voterStakes(event.params.voter);
  let nextIndexToProcessChain = voterStake.value.value5;

  user.nextIndexToProcess = nextIndexToProcessChain;

  if (nextIndexToProcessChain.gt(global.maxNextIndexToProcess)) {
    // This value can be compared to the users' nextIndexToProcess to see if the users'
    // trackers are up to date. This is also demonstrated by the user.cumulativeSlash versus
    // user.cumulativeCalculatedSlash comparison; if they differ, the user's trackers are out of date.
    // It should be noted that user.cumulativeCalculatedSlash is always updated for all users.
    global.maxNextIndexToProcess = nextIndexToProcessChain;
    global.save();
  }

  user.save();
}

// event WithdrawnRewards(address indexed voter, address indexed delegate, uint256 tokensWithdrawn);

export function handleWithdrawnRewards(event: WithdrawnRewards): void {
  let user = getOrCreateUser(event.params.voter);

  user.withdrawnRewards = defaultBigDecimal(user.withdrawnRewards).plus(toDecimal(event.params.tokensWithdrawn));

  user.save();
}

// VoterSlashed(indexed address,indexed uint256,int256)
// event VoterSlashed(address indexed voter, uint256 indexed requestIndex, int256 slashedTokens);

export function handleVoterSlashed(event: VoterSlashed): void {
  let global = getOrCreateGlobals();
  let user = getOrCreateUser(event.params.voter);
  let votingContract = VotingV2.bind(event.address);
  let priceRequestId = votingContract.try_resolvedPriceRequestIds(event.params.requestIndex);
  let priceRequest = votingContract.try_priceRequests(priceRequestId.value);

  user.cumulativeSlash = defaultBigDecimal(user.cumulativeSlash).plus(toDecimal(event.params.slashedTokens));
  user.cumulativeCalculatedSlash = user.cumulativeSlash;
  user.cumulativeSlashPercentage = safeDivBigDecimal(user.cumulativeSlash, user.cumulativeStakeNoSlashing).times(
    BigInt.fromI32(100).toBigDecimal()
  );
  user.cumulativeCalculatedSlashPercentage = user.cumulativeSlashPercentage;
  user.voterStake = user.voterStake.plus(toDecimal(event.params.slashedTokens));

  let requestId = getPriceRequestId(
    priceRequest.value.getIdentifier().toString(),
    priceRequest.value.getTime().toString(),
    priceRequest.value.getAncillaryData().toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);

  // Update the voteSlashed
  let voteSlashedId = getVoteIdNoRoundId(
    event.params.voter.toHexString(),
    priceRequest.value.getIdentifier().toString(),
    priceRequest.value.getTime().toString(),
    priceRequest.value.getAncillaryData().toHexString()
  );
  let voteSlashed = getOrCreateSlashedVote(voteSlashedId, requestId, user.id);
  voteSlashed.isGovernance = request.isGovernance;
  voteSlashed.voter = user.id;
  voteSlashed.slashAmount = toDecimal(event.params.slashedTokens);
  voteSlashed.staking = voteSlashed.slashAmount.equals(BIGDECIMAL_ZERO) ? false : true;

  let revealVoteId = getVoteId(
    event.params.voter.toHexString(),
    priceRequest.value.getIdentifier().toString(),
    priceRequest.value.getTime().toString(),
    priceRequest.value.getAncillaryData().toHexString(),
    event.params.requestIndex.toString()
  );

  let votedCorrectly = false;
  let revealedVote = RevealedVote.load(revealVoteId);
  if (revealedVote != null) {
    votedCorrectly = revealedVote.price.equals(request.price!);
  }

  // The non-null assertion operator '!' is safe here because the request has been resolved.
  let requestRound: PriceRequestRound = getOrCreatePriceRequestRound(
    request.latestRound!
  );

  // The non-null assertion operator '!' is safe here because the request has been resolved.
  if (votedCorrectly) {
    // User has voted correctly
    voteSlashed.correctness = true;
    user.countCorrectVotes = user.countCorrectVotes.plus(BigInt.fromI32(1));
    requestRound.countCorrectVotes = defaultBigInt(requestRound.countCorrectVotes).plus(BigInt.fromI32(1));
    requestRound.cumulativeCorrectVoteSlash = defaultBigDecimal(requestRound.cumulativeCorrectVoteSlash).plus(
      voteSlashed.slashAmount
    );
    global.countCorrectVotes = global.countCorrectVotes.plus(BigInt.fromI32(1));
  } else {
    // User has voted incorrectly
    voteSlashed.correctness = false;
    // Only if not a governance vote we update the wrong votes counter
    // In a governance vote there is no notion of correct or incorrect votes
    // and the incorrect vote slashing is zero
    if (!request.isGovernance) {
      user.countWrongVotes = user.countWrongVotes.plus(BigInt.fromI32(1));
      global.countWrongVotes = global.countWrongVotes.plus(BigInt.fromI32(1));
      requestRound.countWrongVotes = defaultBigInt(requestRound.countWrongVotes).plus(BigInt.fromI32(1));
      requestRound.cumulativeWrongVoteSlash = defaultBigDecimal(requestRound.cumulativeWrongVoteSlash).plus(
        voteSlashed.slashAmount
      );
    }
  }

  voteSlashed.save();
  user.save();
  global.save();
  requestRound.save();
}

// event ExecutedUnstake(address indexed voter, uint256 tokensSent, uint256 voterStake);

export function handleExecutedUnstake(event: ExecutedUnstake): void {
  let user = getOrCreateUser(event.params.voter);
  user.voterStake = toDecimal(event.params.voterStake);
  user.save();
}

// event: RequestDeleted(indexed bytes32,indexed uint256,bytes,uint256)
// event RequestDeleted(bytes32 indexed identifier, uint256 indexed time, bytes ancillaryData, uint256 rollCount);
export function handleRequestDeleted(event: RequestDeleted): void {
  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);

  request.isDeleted = true;
  request.save();
}

// event: RequestRolled(indexed bytes32,indexed uint256,bytes,uint256)
// event RequestRolled(bytes32 indexed identifier, uint256 indexed time, bytes ancillaryData, uint256 rollCount);
export function handleRequestRolled(event: RequestRolled): void {
  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);

  request.rollCount = event.params.rollCount;
  request.save();
}

function updateAprs(users: string[], emissionRate: BigInt, cumulativeStake: BigDecimal): void {
  const oneYear = BigInt.fromI32(31536000).toBigDecimal();
  const annualEmission = toDecimal(emissionRate).times(oneYear);
  let global = getOrCreateGlobals();
  global.annualVotingTokenEmission = annualEmission;
  global.emissionRate = toDecimal(emissionRate);

  global.annualPercentageReturn = safeDivBigDecimal(annualEmission, cumulativeStake).times(
    BigInt.fromI32(100).toBigDecimal()
  );

  for (let i = 0; i < users.length; i++) {
    let userAddress = users[i];
    let user = getOrCreateUser(Address.fromString(userAddress as string));

    user.annualReturn = safeDivBigDecimal(defaultBigDecimal(user.voterStake), cumulativeStake).times(annualEmission);
    user.annualPercentageReturn = safeDivBigDecimal(user.annualReturn, defaultBigDecimal(user.voterStake)).times(
      BigInt.fromI32(100).toBigDecimal()
    );
    user.save();
  }
  global.save();
}
