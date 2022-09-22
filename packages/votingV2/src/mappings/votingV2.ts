import { PriceRequestRound, RevealedVote, User } from "../../generated/schema";
import {
  ExecutedUnstake,
  PriceRequestAdded,
  PriceResolved,
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

import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  getOrCreateSlashedVote,
  getOrCreateGlobals,
  getPriceRequestId,
  getVoteId,
  getVoteIdNoRoundId,
} from "../utils/helpers/voting";

// - event: PriceRequestAdded(indexed address,indexed uint256,uint256,indexed bytes32,uint256,bytes,bool)
// event PriceRequestAdded(
//   address indexed requester,
//   uint256 indexed roundId,
//   uint256 priceRequestIndex,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData,
//   bool isGovernance
// );

export function handlePriceRequestAdded(event: PriceRequestAdded): void {
  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
  let request = getOrCreatePriceRequest(requestId);
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));

  request.identifier = event.params.identifier.toString();
  request.requestIndex = event.params.priceRequestIndex;
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
// - event: PriceResolved(indexed uint256,uint256,indexed bytes32,uint256,bytes,int256)
// event PriceResolved(
//   uint256 indexed roundId,
//   uint256 priceRequestIndex,
//   bytes32 indexed identifier,
//   uint256 time,
//   bytes ancillaryData,
//   int256 price
// );

export function handlePriceResolved(event: PriceResolved): void {
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
  requestRound.winnerGroup = voterGroup.id;
  requestRound.gat = roundInfo.reverted ? requestRound.gat : toDecimal(roundInfo.value.value0);

  requestRound.gatPercentageRaw = defaultBigDecimal(requestRound.gat).div(
    toDecimal(getTokenContract().try_totalSupply().value)
  );
  requestRound.gatPercentage = defaultBigDecimal(requestRound.gatPercentageRaw).times(BIGDECIMAL_HUNDRED);
  requestRound.cumulativeStakeAtRound = cumulativeStakeAtRound;

  requestRound.save();
  request.save();
  voterGroup.save();

  updateUsersSlashingTrackers(event);
}

function updateUsersSlashingTrackers(event: PriceResolved): void {
  let votingContract = VotingV2.bind(event.address);
  let globals = getOrCreateGlobals();
  let users = globals.userAddresses;

  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );

  let request = getOrCreatePriceRequest(requestId);

  let requestRound: PriceRequestRound = getOrCreatePriceRequestRound(
    requestId.concat("-").concat(event.params.roundId.toString())
  );

  let slashingTrackers = votingContract.try_requestSlashingTrackers(request.requestIndex);

  log.warning(`Updating slashing trackers: {},{},{}`, [
    requestId,
    users.length.toString(),
    event.params.roundId.toString(),
  ]);

  // loop through all users and update their slashing trackers
  for (let i = 0; i < users.length; i++) {
    let userAddress = users[i];
    let user = getOrCreateUser(Address.fromString(userAddress as string));

    var voteId = getVoteId(
      userAddress,
      event.params.identifier.toString(),
      event.params.time.toString(),
      event.params.ancillaryData.toHexString(),
      event.params.roundId.toString()
    );

    let voteSlashedId = getVoteIdNoRoundId(
      userAddress,
      event.params.identifier.toString(),
      event.params.time.toString(),
      event.params.ancillaryData.toHexString()
    );

    let voteSlashed = getOrCreateSlashedVote(voteSlashedId, requestId, user.id);

    // the pending stake of the user during the voting round
    // must be subtracted from the user stake amount during the reveal phase
    let pendingStake = votingContract.try_getVoterPendingStake(
      Address.fromString(userAddress as string),
      event.params.roundId
    );

    // Check if the user voted in the round
    if (RevealedVote.load(voteId) != null) {
      let vote = getOrCreateRevealedVote(voteId);
      if (event.params.price.equals(vote.price)) {
        // User voted correctly

        // This is the slashing calculated as in the contract for correct votes
        let slashing = toDecimal(vote.numTokens.minus(pendingStake.value))
          .times(toDecimal(slashingTrackers.value.totalSlashed))
          .div(toDecimal(slashingTrackers.value.totalCorrectVotes));

        // Update all the slashing trackers
        voteSlashed.correctness = true;
        voteSlashed.slashAmount = slashing;
        user.cumulativeCalculatedSlash = defaultBigDecimal(user.cumulativeCalculatedSlash).plus(slashing);
        user.countCorrectVotes = user.countCorrectVotes.plus(BigInt.fromI32(1));
        globals.countCorrectVotes = globals.countCorrectVotes.plus(BigInt.fromI32(1));
        requestRound.countCorrectVotes = defaultBigInt(requestRound.countCorrectVotes).plus(BigInt.fromI32(1));
        requestRound.cumulativeCorrectVoteSlash = defaultBigDecimal(requestRound.cumulativeCorrectVoteSlash).plus(
          slashing
        );
      } else {
        // User voted incorrectly

        // This is the slashing calculated as in the contract for incorrect votes
        // Should be zero if we are in a governance vote
        let slashing = BIGDECIMAL_ZERO.minus(
          toDecimal(vote.numTokens.minus(pendingStake.value)).times(
            toDecimal(slashingTrackers.value.wrongVoteSlashPerToken)
          )
        );

        // Update all the slashing trackers
        voteSlashed.correctness = false;
        voteSlashed.slashAmount = slashing;
        user.cumulativeCalculatedSlash = defaultBigDecimal(user.cumulativeCalculatedSlash).plus(slashing);
        requestRound.cumulativeWrongVoteSlash = defaultBigDecimal(requestRound.cumulativeWrongVoteSlash).plus(slashing);

        // Only if not a governance vote we update the wrong votes counter
        // In a governance vote there is no notion of correct or incorrect votes
        // and the incorrect vote slashing is zero
        if (!request.isGovernance) {
          user.countWrongVotes = user.countWrongVotes.plus(BigInt.fromI32(1));
          globals.countWrongVotes = globals.countWrongVotes.plus(BigInt.fromI32(1));
          requestRound.countWrongVotes = defaultBigInt(requestRound.countWrongVotes).plus(BigInt.fromI32(1));
        }
      }
    } else {
      // User did not vote

      // We need to find the user's stake amount in the reveal phase of this round
      // The only way to get this information is to store all the user's stake history
      // This is the main reason of having stakesTimestamps and stakesAmounts
      // so we can loop through it to find the stake amount in the reveal phase of this round
      // TODO find a better way to do this
      let activeStake = BIGINT_ZERO;
      for (let i = user.stakesTimestamp.length - 1; i >= 0; i--) {
        if (user.stakesTimestamp[i].lt(defaultBigInt(requestRound.lastRevealTime))) {
          activeStake = user.stakesAmounts[i].minus(pendingStake.value);
        }
      }
      // This is the slashing calculated as in the contract for not voting
      let slashing = BIGDECIMAL_ZERO.minus(
        toDecimal(activeStake).times(toDecimal(slashingTrackers.value.noVoteSlashPerToken))
      );

      // Update all the slashing trackers
      voteSlashed.slashAmount = slashing;
      user.cumulativeCalculatedSlash = defaultBigDecimal(user.cumulativeCalculatedSlash).plus(slashing);
      user.countNoVotes = user.countNoVotes.plus(BigInt.fromI32(1));
      globals.countNoVotes = globals.countNoVotes.plus(BigInt.fromI32(1));
      requestRound.countNoVotes = defaultBigInt(requestRound.countNoVotes).plus(BigInt.fromI32(1));
      requestRound.cumulativeNoVoteSlash = defaultBigDecimal(requestRound.cumulativeNoVoteSlash).plus(slashing);
    }
    user.save();
    voteSlashed.save();
  }

  log.warning(`Finished updating slashing trackers: {},{},{}`, [
    requestId,
    users.length.toString(),
    event.params.roundId.toString(),
  ]);

  requestRound.save();
  globals.save();
}

// - event: VoteCommitted(indexed address,indexed address,uint256,uint256,indexed bytes32,uint256,bytes)
// event VoteCommitted(
//   address indexed voter,
//   address indexed caller,
//   uint256 roundId,
//   uint256 priceRequestIndex,
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

  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );
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
// - event: VoteRevealed(indexed address,indexed address,uint256,uint256,indexed bytes32,uint256,bytes,int256,uint256)
// event VoteRevealed(
//   address indexed voter,
//   address indexed caller,
//   uint256 roundId,
//   uint256 priceRequestIndex,
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

  requestRound.tokenVoteParticipationRatio = cumulativeActiveStakeAtRound.gt(BIGDECIMAL_ZERO)
    ? requestRound.totalVotesRevealed.div(<BigDecimal>cumulativeActiveStakeAtRound)
    : BigDecimal.fromString("0");
  requestRound.tokenVoteParticipationPercentage = defaultBigDecimal(requestRound.tokenVoteParticipationRatio).times(
    BIGDECIMAL_HUNDRED
  );

  requestRound.save();

  let voteSlashedId = getVoteIdNoRoundId(
    event.params.voter.toHexString(),
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );

  vote.save();
  voter.save();
  voterGroup.save();
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
  let globals = getOrCreateGlobals();
  user.voterStake = toDecimal(event.params.voterStake);
  user.voterPendingUnstake = toDecimal(event.params.voterPendingUnstake);
  globals.cumulativeStake = toDecimal(event.params.cumulativeStake);

  let newUserAddresses = globals.userAddresses;
  if (!newUserAddresses.includes(event.params.voter.toHexString()))
    newUserAddresses.push(event.params.voter.toHexString());
  globals.userAddresses = newUserAddresses;

  addStakes(user, event.params.voterStake, event.block.timestamp);

  user.save();
  globals.save();

  let votingContract = VotingV2.bind(event.address);
  let emissionRate = votingContract.try_emissionRate();

  updateAprs(
    globals.userAddresses,
    emissionRate.reverted ? BigInt.fromI32(0) : emissionRate.value,
    globals.cumulativeStake
  );
}

// RequestedUnstake(address indexed voter, uint256 amount, uint256 unstakeTime, uint256 voterStake);

export function handleRequestedUnstake(event: RequestedUnstake): void {
  let user = getOrCreateUser(event.params.voter);
  let globals = getOrCreateGlobals();
  user.voterStake = toDecimal(event.params.voterStake);
  user.voterPendingUnstake = toDecimal(event.params.amount);
  globals.cumulativeStake = globals.cumulativeStake.minus(toDecimal(event.params.amount));

  let newUserAddresses = globals.userAddresses;
  if (!newUserAddresses.includes(event.params.voter.toHexString()))
    newUserAddresses.push(event.params.voter.toHexString());
  globals.userAddresses = newUserAddresses;

  addStakes(user, event.params.voterStake, event.block.timestamp);

  user.save();
  globals.save();

  let votingContract = VotingV2.bind(event.address);
  let emissionRate = votingContract.try_emissionRate();

  updateAprs(
    globals.userAddresses,
    emissionRate.reverted ? BigInt.fromI32(0) : emissionRate.value,
    globals.cumulativeStake
  );
}

// event UpdatedReward(address indexed voter, uint256 newReward, uint256 lastUpdateTime);

export function handleUpdatedReward(event: UpdatedReward): void {
  let user = getOrCreateUser(event.params.voter);
  let globals = getOrCreateGlobals();
  let votingContract = VotingV2.bind(event.address);
  let voterStake = votingContract.try_voterStakes(event.params.voter);
  let nextIndexToProcessChain = voterStake.value.value5;

  user.nextIndexToProcess = nextIndexToProcessChain;

  if (nextIndexToProcessChain.gt(globals.maxNextIndexToProcess)) {
    // This value can be compared to the users' nextIndexToProcess to see if the users'
    // trackers are up to date. This is also demonstrated by the user.cumulativeSlash versus
    // user.cumulativeCalculatedSlash comparison; if they differ, the user's trackers are out of date.
    // It should be noted that user.cumulativeCalculatedSlash is always updated for all users.
    globals.maxNextIndexToProcess = nextIndexToProcessChain;
    globals.save();
  }

  user.save();
}

// event WithdrawnRewards(address indexed voter, address indexed delegate, uint256 tokensWithdrawn);

export function handleWithdrawnRewards(event: WithdrawnRewards): void {
  let user = getOrCreateUser(event.params.voter);

  user.withdrawnRewards = defaultBigDecimal(user.withdrawnRewards).plus(toDecimal(event.params.tokensWithdrawn));

  user.save();
}

// event VoterSlashed(address indexed voter, int256 slashedTokens, uint256 postActiveStake);

export function handleVoterSlashed(event: VoterSlashed): void {
  let user = getOrCreateUser(event.params.voter);

  user.cumulativeSlash = defaultBigDecimal(user.cumulativeSlash).plus(toDecimal(event.params.slashedTokens));
  user.voterStake = toDecimal(event.params.postActiveStake);

  addStakes(user, event.params.postActiveStake, event.block.timestamp);

  user.save();
}

// event ExecutedUnstake(address indexed voter, uint256 tokensSent, uint256 voterStake);

export function handleExecutedUnstake(event: ExecutedUnstake): void {
  let user = getOrCreateUser(event.params.voter);
  user.voterStake = toDecimal(event.params.voterStake);

  addStakes(user, event.params.voterStake, event.block.timestamp);

  user.save();
}

function updateAprs(users: string[], emissionRate: BigInt, cumulativeStake: BigDecimal): void {
  const oneYear = BigInt.fromI32(31536000).toBigDecimal();
  const anualEmission = toDecimal(emissionRate).times(oneYear);
  let globals = getOrCreateGlobals();
  globals.anualVotingTokenEmission = anualEmission;
  globals.emissionRate = toDecimal(emissionRate);

  for (let i = 0; i < users.length; i++) {
    let userAddress = users[i];
    let user = getOrCreateUser(Address.fromString(userAddress as string));

    user.anualReturn = cumulativeStake.equals(BIGDECIMAL_ZERO)
      ? BIGDECIMAL_ZERO
      : defaultBigDecimal(user.voterStake).div(cumulativeStake).times(anualEmission);

    user.anualPercentageReturn = defaultBigDecimal(user.voterStake).equals(BIGDECIMAL_ZERO)
      ? BIGDECIMAL_ZERO
      : user.anualReturn.div(defaultBigDecimal(user.voterStake)).times(BigInt.fromI32(100).toBigDecimal());

    user.save();
  }
  globals.save();
}

// Stores the historic of the user's stake
// This is required to calculate the user stake at a specific time if they didn't vote
function addStakes(user: User, newStake: BigInt, timestamp: BigInt): void {
  let newStakesAmounts = user.stakesAmounts;
  newStakesAmounts.push(newStake);
  user.stakesAmounts = newStakesAmounts;

  let newStakesTimestamp = user.stakesTimestamp;
  newStakesTimestamp.push(timestamp);
  user.stakesTimestamp = newStakesTimestamp;
}
