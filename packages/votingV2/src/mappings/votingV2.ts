import { PriceRequestRound, RevealedVote, SlashedVote, TransactionSlashedVotes, User } from "../../generated/schema";
import {
  ExecutedUnstake,
  RequestAdded,
  RequestResolved,
  RequestedUnstake,
  Staked,
  UpdatedReward,
  VoteCommitted,
  VoteRevealed,
  VoterSlashed,
  VotingV2,
  WithdrawnRewards,
  RequestDeleted,
  RequestRolled,
} from "../../generated/Voting/VotingV2";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ONE, BIGINT_ZERO } from "../utils/constants";
import {
  defaultBigDecimal,
  defaultBigInt,
  safeDivBigDecimal,
  toDecimal,
  absMax,
  bigDecimalMin,
} from "../utils/decimals";
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

  requestRound.gatPercentageRaw = safeDivBigDecimal(
    defaultBigDecimal(requestRound.gat),
    toDecimal(getTokenContract().try_totalSupply().value)
  );
  requestRound.gatPercentage = defaultBigDecimal(requestRound.gatPercentageRaw).times(BIGDECIMAL_HUNDRED);
  requestRound.cumulativeStakeAtRound = cumulativeStakeAtRound;

  requestRound.save();
  request.save();
  voterGroup.save();

  updateUsersSlashingTrackers(event);
}

function updateUsersSlashingTrackers(event: RequestResolved): void {
  let votingContract = VotingV2.bind(event.address);
  let global = getOrCreateGlobals();
  let users = global.userAddresses;

  let requestId = getPriceRequestId(
    event.params.identifier.toString(),
    event.params.time.toString(),
    event.params.ancillaryData.toHexString()
  );

  let request = getOrCreatePriceRequest(requestId);

  let requestRound: PriceRequestRound = getOrCreatePriceRequestRound(
    requestId.concat("-").concat(event.params.roundId.toString())
  );

  log.warning(`Updating slashing trackers: {},{},{}`, [
    requestId,
    users.length.toString(),
    event.params.roundId.toString(),
  ]);

  // loop through all users and update their slashing trackers
  for (let i = 0; i < users.length; i++) {
    let userAddress = users[i];
    let user = getOrCreateUser(Address.fromString(userAddress as string));

    // save the old calculated stake
    let oldUserCalculatedStake = user.voterCalculatedStake;

    // store the new calculated stake
    user.voterCalculatedStake = toDecimal(
      votingContract.try_getVoterStakePostUpdate(Address.fromString(userAddress as string)).value
    );

    // This is the more accurate way to calculate the user's slash amount.
    // We just need to handle appropriately the case where there is more than one price request
    // resolved in the same transaction, this is done in processSlashesInSameTransaction function.
    let slashing = user.voterCalculatedStake.minus(oldUserCalculatedStake);

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

    let voteSlashed = getOrCreateSlashedVote(voteSlashedId, requestId, user.id, event.transaction.hash.toHexString());
    let transactionSlashedVotes = TransactionSlashedVotes.load(
      voteSlashed.transactionSlashedVotes
    ) as TransactionSlashedVotes;

    voteSlashed.resolutionTimestamp = event.block.timestamp;
    voteSlashed.isGovernance = request.isGovernance;

    if (voteSlashed.slashAmount.notEqual(BIGDECIMAL_ZERO)) {
      voteSlashed.slashAmount = slashing;
    }

    // Check if the user voted in the round
    if (RevealedVote.load(voteId) != null) {
      let vote = getOrCreateRevealedVote(voteId);
      if (event.params.price.equals(vote.price)) {
        // User voted correctly
        // Update all the slashing trackers
        voteSlashed.voted = true;
        voteSlashed.correctness = true;
        voteSlashed.staking = true;
        user.cumulativeCalculatedSlash = defaultBigDecimal(user.cumulativeCalculatedSlash).plus(slashing);
        user.cumulativeCalculatedSlashPercentage = safeDivBigDecimal(
          defaultBigDecimal(user.cumulativeCalculatedSlash),
          user.cumulativeStakeNoSlashing
        ).times(BigInt.fromI32(100).toBigDecimal());
        user.countCorrectVotes = user.countCorrectVotes.plus(BigInt.fromI32(1));
        global.countCorrectVotes = global.countCorrectVotes.plus(BigInt.fromI32(1));
        requestRound.countCorrectVotes = defaultBigInt(requestRound.countCorrectVotes).plus(BigInt.fromI32(1));
        requestRound.cumulativeCorrectVoteSlash = defaultBigDecimal(requestRound.cumulativeCorrectVoteSlash).plus(
          slashing
        );
        transactionSlashedVotes.countCorrectVotes = transactionSlashedVotes.countCorrectVotes.plus(BigInt.fromI32(1));
      } else {
        // User voted incorrectly
        // Update all the slashing trackers
        voteSlashed.voted = true;
        voteSlashed.correctness = false;
        voteSlashed.staking = true;
        user.cumulativeCalculatedSlash = defaultBigDecimal(user.cumulativeCalculatedSlash).plus(slashing);
        user.cumulativeCalculatedSlashPercentage = safeDivBigDecimal(
          defaultBigDecimal(user.cumulativeCalculatedSlash),
          user.cumulativeStakeNoSlashing
        ).times(BigInt.fromI32(100).toBigDecimal());
        requestRound.cumulativeWrongVoteSlash = defaultBigDecimal(requestRound.cumulativeWrongVoteSlash).plus(slashing);

        // Only if not a governance vote we update the wrong votes counter
        // In a governance vote there is no notion of correct or incorrect votes
        // and the incorrect vote slashing is zero
        if (!request.isGovernance) {
          user.countWrongVotes = user.countWrongVotes.plus(BigInt.fromI32(1));
          global.countWrongVotes = global.countWrongVotes.plus(BigInt.fromI32(1));
          requestRound.countWrongVotes = defaultBigInt(requestRound.countWrongVotes).plus(BigInt.fromI32(1));
          transactionSlashedVotes.countWrongVotes = transactionSlashedVotes.countWrongVotes.plus(BigInt.fromI32(1));
        }
      }
    } else {
      // User did not vote
      // Update all the slashing trackers
      voteSlashed.staking = slashing.notEqual(BIGDECIMAL_ZERO) ? true : false;
      user.cumulativeCalculatedSlash = defaultBigDecimal(user.cumulativeCalculatedSlash).plus(slashing);
      user.cumulativeCalculatedSlashPercentage = safeDivBigDecimal(
        defaultBigDecimal(user.cumulativeCalculatedSlash),
        user.cumulativeStakeNoSlashing
      ).times(BigInt.fromI32(100).toBigDecimal());
      user.countNoVotes = user.countNoVotes.plus(BigInt.fromI32(1));
      global.countNoVotes = global.countNoVotes.plus(BigInt.fromI32(1));
      requestRound.countNoVotes = defaultBigInt(requestRound.countNoVotes).plus(BigInt.fromI32(1));
      requestRound.cumulativeNoVoteSlash = defaultBigDecimal(requestRound.cumulativeNoVoteSlash).plus(slashing);
      transactionSlashedVotes.countNoVotes = transactionSlashedVotes.countNoVotes.plus(BigInt.fromI32(1));
    }

    user.save();
    voteSlashed.save();

    // Finally update votes slashed in the same transaction
    processSlashesInSameTransaction(
      transactionSlashedVotes,
      voteSlashed,
      oldUserCalculatedStake,
      votingContract,
      defaultBigInt(request.resolvedPriceRequestIndex)
    );
  }

  log.warning(`Finished updating slashing trackers: {},{},{}`, [
    requestId,
    users.length.toString(),
    event.params.roundId.toString(),
  ]);

  requestRound.save();
  global.save();
}

function processSlashesInSameTransaction(
  transactionSlashedVotes: TransactionSlashedVotes,
  voteSlashed: SlashedVote,
  oldUserCalculatedStake: BigDecimal,
  votingContract: VotingV2,
  resolvedPriceRequestIndex: BigInt
): void {
  let slashingTrackers = votingContract.try_requestSlashingTrackers(resolvedPriceRequestIndex);

  let oldSlashedVotesIDs = transactionSlashedVotes.slashedVotesIDs;
  oldSlashedVotesIDs.push(voteSlashed.id);
  transactionSlashedVotes.slashedVotesIDs = oldSlashedVotesIDs;

  // One of the slashes contains the cumulative sum of the others, so we look for the maximum in absolute value.
  transactionSlashedVotes.cumulativeTransactionSlashAmount = absMax(
    voteSlashed.slashAmount,
    transactionSlashedVotes.cumulativeTransactionSlashAmount
  );

  // The staked amount is the minimum quantity of tokens that the wallet possessed before these slashes
  // were applied
  transactionSlashedVotes.stakedAmount =
    transactionSlashedVotes.stakedAmount === null
      ? oldUserCalculatedStake
      : bigDecimalMin(transactionSlashedVotes.stakedAmount as BigDecimal, oldUserCalculatedStake);

  // If this transaction contains more than one slashed vote, we rebalance the slash amounts such that the
  // offchain computations are correct.
  if (transactionSlashedVotes.slashedVotesIDs.length > 1) {
    // Find the slash amounts
    // This is the slashing calculated as in the contract for correct votes
    let totalPositiveSlashAmount = transactionSlashedVotes.countCorrectVotes
      .toBigDecimal()
      .times(
        safeDivBigDecimal(
          defaultBigDecimal(transactionSlashedVotes.stakedAmount).times(toDecimal(slashingTrackers.value.totalSlashed)),
          toDecimal(slashingTrackers.value.totalCorrectVotes)
        )
      );
    // We derive totalNegativeSlashAmount from totalPositiveSlashAmount to ensure that their sum is accurate; otherwise,
    // there would be slight differences due to the use of transactionSlashedVotes. stakedAmount to calculate rather than
    // considering the variation in staked amount after each slash. We do this for convenience
    let totalNegativeSlashAmount =
      transactionSlashedVotes.cumulativeTransactionSlashAmount.minus(totalPositiveSlashAmount);

    let totalWrongVoteSlashAmount = transactionSlashedVotes.countWrongVotes
      .toBigDecimal()
      .times(
        defaultBigDecimal(transactionSlashedVotes.stakedAmount).times(
          toDecimal(slashingTrackers.value.wrongVoteSlashPerToken)
        )
      )
      .neg();

    // Similarly we derive totalNoVoteSlashAmount from totalNegativeSlashAmount to ensure that their sum is accurate.
    let totalNoVoteSlashAmount = totalNegativeSlashAmount.minus(totalWrongVoteSlashAmount);

    // Update all slashed votes in the transaction
    for (let i = 0; i < transactionSlashedVotes.slashedVotesIDs.length; i++) {
      let slashedVote = SlashedVote.load(transactionSlashedVotes.slashedVotesIDs[i]) as SlashedVote;
      if (slashedVote.voted) {
        if (slashedVote.correctness) {
          slashedVote.slashAmount = safeDivBigDecimal(
            totalPositiveSlashAmount,
            transactionSlashedVotes.countCorrectVotes.toBigDecimal()
          );
        } else {
          if (slashedVote.isGovernance) {
            slashedVote.slashAmount = BIGDECIMAL_ZERO;
          } else {
            slashedVote.slashAmount = safeDivBigDecimal(
              totalWrongVoteSlashAmount,
              transactionSlashedVotes.countWrongVotes.toBigDecimal()
            );
          }
        }
      } else {
        slashedVote.slashAmount = safeDivBigDecimal(
          totalNoVoteSlashAmount,
          transactionSlashedVotes.countNoVotes.toBigDecimal()
        );
      }
      slashedVote.save();
    }
  }

  transactionSlashedVotes.save();
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
  let requestRound = getOrCreatePriceRequestRound(requestId.concat("-").concat(event.params.roundId.toString()));
  let groupId = requestRound.id.concat("-").concat(event.params.price.toString());
  let voterGroup = getOrCreateVoterGroup(groupId);
  let votingContract = VotingV2.bind(event.address);
  let roundInfo = votingContract.try_rounds(event.params.roundId);
  let cumulativeStakeAtRound = roundInfo.reverted
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

  requestRound.tokenVoteParticipationRatio = safeDivBigDecimal(
    requestRound.totalVotesRevealed,
    <BigDecimal>cumulativeStakeAtRound
  );
  requestRound.tokenVoteParticipationPercentage = defaultBigDecimal(requestRound.tokenVoteParticipationRatio).times(
    BIGDECIMAL_HUNDRED
  );

  requestRound.save();

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
  let user = getOrCreateUser(event.params.voter);
  let votingContract = VotingV2.bind(event.address);
  let priceRequestId = votingContract.try_resolvedPriceRequestIds(event.params.requestIndex);
  let priceRequest = votingContract.try_priceRequests(priceRequestId.value);

  user.cumulativeSlash = defaultBigDecimal(user.cumulativeSlash).plus(toDecimal(event.params.slashedTokens));
  user.cumulativeSlashPercentage = safeDivBigDecimal(user.cumulativeSlash, user.cumulativeStakeNoSlashing).times(
    BigInt.fromI32(100).toBigDecimal()
  );
  user.voterStake = user.voterStake.plus(toDecimal(event.params.slashedTokens));

  // Update the voteSlashed
  let voteSlashedId = getVoteIdNoRoundId(
    event.params.voter.toHexString(),
    priceRequest.value.getIdentifier().toString(),
    priceRequest.value.getTime().toString(),
    priceRequest.value.getAncillaryData().toHexString()
  );

  let requestId = getPriceRequestId(
    priceRequest.value.getIdentifier().toString(),
    priceRequest.value.getTime().toString(),
    priceRequest.value.getAncillaryData().toHexString()
  );

  let voteSlashed = getOrCreateSlashedVote(voteSlashedId, requestId, user.id, event.transaction.hash.toHexString());
  voteSlashed.slashAmount = toDecimal(event.params.slashedTokens);

  voteSlashed.save();
  user.save();
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
