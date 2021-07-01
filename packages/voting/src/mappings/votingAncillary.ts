import {
    PriceRequestAdded,
    PriceResolved,
    VoteCommitted,
    VoteRevealed,
    RewardsRetrieved,
    VotingAncillary
  } from "../../generated/VotingAncillary/VotingAncillary";
  import { VoterGroup } from "../../generated/schema";
  import {
    getOrCreateUser,
    getOrCreateCommittedVote,
    getOrCreatePriceRequest,
    getOrCreateRevealedVote,
    getOrCreateRewardsClaimed,
    getOrCreatePriceRequestRound,
    getTokenContract,
    getOrCreateVoterGroup
  } from "../utils/helpers";
  import { toDecimal } from "../utils/decimals";
  import {
    BIGDECIMAL_HUNDRED,
    BIGDECIMAL_ONE,
    BIGDECIMAL_ZERO,
    BIGINT_ZERO,
    BIGINT_ONE
  } from "../utils/constants";
  
  import { log, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
  
// - event: PriceRequestAdded(indexed uint256,indexed bytes32,uint256)
//   handler: handlePriceRequestAdded
//  event PriceRequestAdded(uint256 indexed roundId, bytes32 indexed identifier, uint256 time);

export function handlePriceRequestAdded(event: PriceRequestAdded): void {
  let requestId = event.params.identifier
    .toString()
    .concat("-")
    .concat(event.params.time.toString());
  let request = getOrCreatePriceRequest(requestId);

  request.identifier = event.params.identifier.toString();
  request.time = event.params.time;

  // PriceRequestAdded currently does not include `ancillaryData` so we cannot create the PriceRequestRound entity 
  // until we detect the ancillaryData from the first VoteCommitted event.
    
  request.save();
}

  // - event: PriceResolved(indexed uint256,indexed bytes32,uint256,int256,bytes)
  //   handler: handlePriceResolved
  //  event PriceResolved(uint256 indexed roundId, bytes32 indexed identifier, uint256 time, int256 price, bytes ancillaryData);
  
  export function handlePriceResolved(event: PriceResolved): void {
    let requestId = event.params.identifier
      .toString()
      .concat("-")
      .concat(event.params.time.toString());
    let request = getOrCreatePriceRequest(requestId);
    let requestRound = getOrCreatePriceRequestRound(
      requestId
        .concat("-").concat(event.params.roundId.toString())
        .concat("-").concat(event.params.ancillaryData.toHex())
    );
    let groupId = requestRound.id
      .concat("-")
      .concat(event.params.price.toString());
    let voterGroup = getOrCreateVoterGroup(groupId);
    let votingContract = VotingAncillary.bind(event.address);
    let roundInfo = votingContract.try_rounds(event.params.roundId);

    request.latestRound = requestRound.id;
    request.ancillaryData = event.params.ancillaryData.toHex();
    request.price = event.params.price;
    request.resolutionTransaction = event.transaction.hash;
    request.resolutionTimestamp = event.block.timestamp;
    request.resolutionBlock = event.block.number;
    request.isResolved = true;
  
    voterGroup.won = true;
  
    requestRound.request = request.id;
    requestRound.identifier = event.params.identifier.toString();
    requestRound.ancillaryData = event.params.ancillaryData.toHex();
    requestRound.time = event.params.time;
    requestRound.roundId = event.params.roundId;
    requestRound.votersEligibleForRewardsRatio =
      voterGroup.votersAmount / requestRound.votersAmount;
    requestRound.votersEligibleForRewardsPercentage =
      requestRound.votersEligibleForRewardsRatio * BIGDECIMAL_HUNDRED;
    requestRound.winnerGroup = voterGroup.id;
    requestRound.inflationRateRaw = roundInfo.reverted
      ? requestRound.inflationRateRaw
      : toDecimal(roundInfo.value.value1.rawValue);
    requestRound.gatPercentageRaw = roundInfo.reverted
      ? requestRound.gatPercentageRaw
      : toDecimal(roundInfo.value.value2.rawValue);
    requestRound.inflationRate =
      requestRound.inflationRateRaw * BIGDECIMAL_HUNDRED;
    requestRound.gatPercentage =
      requestRound.gatPercentageRaw * BIGDECIMAL_HUNDRED;
  
    requestRound.save();
    request.save();
    voterGroup.save();
  }
  
  // - event: RewardsRetrieved(indexed address,indexed uint256,indexed bytes32,uint256,bytes,uint256)
  //   handler: handleRewardsRetrieved
  //  event RewardsRetrieved(
  //      address indexed voter,
  //      uint256 indexed roundId,
  //      bytes32 indexed identifier,
  //      uint256 time,
  //      bytes ancillaryData,
  //      uint256 numTokens
  //  );
  
  export function handleRewardsRetrieved(event: RewardsRetrieved): void {
    let rewardClaimedId = event.params.voter
      .toHexString()
      .concat("-")
      .concat(event.params.identifier.toString())
      .concat("-")
      .concat(event.params.time.toString())
      .concat("-")
      .concat(event.params.roundId.toString())
      .concat("-")
      .concat(event.params.ancillaryData.toHex());
    let rewardClaimed = getOrCreateRewardsClaimed(rewardClaimedId);
    let claimer = getOrCreateUser(event.params.voter);
    let requestId = event.params.identifier
      .toString()
      .concat("-")
      .concat(event.params.time.toString());
    let requestRound = getOrCreatePriceRequestRound(
      requestId
        .concat("-").concat(event.params.roundId.toString())
        .concat("-").concat(event.params.ancillaryData.toHex())
    );
    let winnerGroup: VoterGroup | null =
      requestRound.winnerGroup != null
        ? getOrCreateVoterGroup(requestRound.winnerGroup)
        : null;
  
    rewardClaimed.claimer = claimer.id;
    rewardClaimed.round = requestRound.id;
    rewardClaimed.request = requestId;
    rewardClaimed.identifier = event.params.identifier.toString();
    rewardClaimed.ancillaryData = event.params.ancillaryData.toHex();
    rewardClaimed.time = event.params.time;
    rewardClaimed.numTokens = event.params.numTokens;
  
    // If rewards > 0, then voter correctly voted for this round.
    if (event.params.numTokens > BIGINT_ZERO) {
      claimer.countRetrievals = claimer.countRetrievals + BIGINT_ONE;
    }

    requestRound.request = requestId;
    requestRound.identifier = event.params.identifier.toString();
    requestRound.ancillaryData = event.params.ancillaryData.toHex();
    requestRound.time = event.params.time;
    requestRound.roundId = event.params.roundId;
    requestRound.totalRewardsClaimed =
      requestRound.totalRewardsClaimed + toDecimal(rewardClaimed.numTokens);
    if (
      rewardClaimed.numTokens > BIGINT_ZERO && 
      winnerGroup.votersAmount > BIGDECIMAL_ZERO && 
      requestRound.totalSupplyAtSnapshot > BIGDECIMAL_ZERO
    ) {      
      requestRound.votersClaimedAmount =
        requestRound.votersClaimedAmount + BIGDECIMAL_ONE;
      requestRound.votersClaimedRatio =
        winnerGroup != null && winnerGroup.votersAmount != BIGDECIMAL_ZERO
          ? requestRound.votersClaimedAmount / winnerGroup.votersAmount
          : requestRound.votersClaimedRatio;
      requestRound.votersClaimedPercentage =
        requestRound.votersClaimedRatio * BIGDECIMAL_HUNDRED;
      requestRound.tokensClaimedRatio =
        requestRound.inflationRateRaw != null &&
        requestRound.inflationRateRaw != BIGDECIMAL_ZERO
          ? requestRound.totalRewardsClaimed /
            (requestRound.totalSupplyAtSnapshot *
              <BigDecimal>requestRound.inflationRateRaw)
          : requestRound.tokensClaimedRatio;
      requestRound.tokensClaimedPercentage =
        requestRound.tokensClaimedRatio * BIGDECIMAL_HUNDRED;
    }
  
    requestRound.save();
    rewardClaimed.save();
    claimer.save();
  }
  
  // - event: VoteCommitted(indexed address,indexed uint256,indexed bytes32,uint256)
  //   handler: handleVoteCommitted
  //  event VoteCommitted(address indexed voter, uint256 indexed roundId, bytes32 indexed identifier, uint256 time, bytes ancillaryData);
  
  export function handleVoteCommitted(event: VoteCommitted): void {
    let voteId = event.params.voter
      .toHexString()
      .concat("-")
      .concat(event.params.identifier.toString())
      .concat("-")
      .concat(event.params.time.toString())
      .concat("-")
      .concat(event.params.roundId.toString())
      .concat("-")
      .concat(event.params.ancillaryData.toHex());
    let vote = getOrCreateCommittedVote(voteId);
    let voter = getOrCreateUser(event.params.voter);
    let requestId = event.params.identifier
      .toString()
      .concat("-")
      .concat(event.params.time.toString());
    let requestRound = getOrCreatePriceRequestRound(
      requestId
        .concat("-").concat(event.params.roundId.toString())
        .concat("-").concat(event.params.ancillaryData.toHex())
    );
  
    vote.voter = voter.id;
    vote.request = requestId;
    vote.identifier = event.params.identifier.toString();
    vote.ancillaryData = event.params.ancillaryData.toHex();
    vote.time = event.params.time;
    vote.round = requestRound.id;
  
    requestRound.request = requestId;
    requestRound.identifier = event.params.identifier.toString();
    requestRound.ancillaryData = event.params.ancillaryData.toHex();
    requestRound.time = event.params.time;
    requestRound.roundId = event.params.roundId;
  
    requestRound.save();
    vote.save();
    voter.save();
  }
  
  // - event: VoteRevealed(indexed address,indexed uint256,indexed bytes32,uint256,int256,bytes,uint256)
  //   handler: handleVoteRevealed
  //  event VoteRevealed(
  //      address indexed voter,
  //      uint256 indexed roundId,
  //      bytes32 indexed identifier,
  //      uint256 time,
  //      int256 price,
  //      bytes ancillaryData,
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
      .concat(event.params.roundId.toString())
      .concat("-")
      .concat(event.params.ancillaryData.toHex());
    let vote = getOrCreateRevealedVote(voteId);
    let voter = getOrCreateUser(event.params.voter);
    let requestId = event.params.identifier
      .toString()
      .concat("-")
      .concat(event.params.time.toString());
    let requestRound = getOrCreatePriceRequestRound(
      requestId
        .concat("-").concat(event.params.roundId.toString())
        .concat("-").concat(event.params.ancillaryData.toHex())
    );
    let groupId = requestRound.id
      .concat("-")
      .concat(event.params.price.toString());
    let voterGroup = getOrCreateVoterGroup(groupId);
    let votingContract = VotingAncillary.bind(event.address);
    let roundInfo = votingContract.try_rounds(event.params.roundId);
  
    vote.voter = voter.id;
    vote.round = requestRound.id;
    vote.request = requestId;
    vote.identifier = event.params.identifier.toString();
    vote.ancillaryData = event.params.ancillaryData.toHex();
    vote.time = event.params.time;
    vote.price = event.params.price;
    vote.numTokens = event.params.numTokens;
    vote.group = voterGroup.id;
  
    voter.countReveals = voter.countReveals + BIGINT_ONE;

    voterGroup.price = event.params.price;
    voterGroup.round = requestRound.id;
    voterGroup.totalVoteAmount =
      voterGroup.totalVoteAmount + toDecimal(vote.numTokens);
    voterGroup.votersAmount = voterGroup.votersAmount + BIGDECIMAL_ONE;
  
    requestRound.request = requestId;
    requestRound.identifier = event.params.identifier.toString();
    requestRound.ancillaryData = event.params.ancillaryData.toHex();
    requestRound.time = event.params.time;
    requestRound.roundId = event.params.roundId;
    requestRound.totalVotesRevealed =
      requestRound.totalVotesRevealed + toDecimal(vote.numTokens);
    requestRound.votersAmount = requestRound.votersAmount + BIGDECIMAL_ONE;
    requestRound.snapshotId = roundInfo.reverted ? null : roundInfo.value.value0;
    if (
      requestRound.snapshotId != null &&
      requestRound.totalSupplyAtSnapshot == null
    ) {
      let supply = getTokenContract().try_totalSupplyAt(
        <BigInt>requestRound.snapshotId
      );
      requestRound.totalSupplyAtSnapshot = supply.reverted
        ? null
        : toDecimal(supply.value as BigInt);
    }
    requestRound.tokenVoteParticipationRatio =
      requestRound.totalSupplyAtSnapshot != null
        ? requestRound.totalVotesRevealed /
          <BigDecimal>requestRound.totalSupplyAtSnapshot
        : null;
    requestRound.tokenVoteParticipationPercentage =
      requestRound.tokenVoteParticipationRatio * BIGDECIMAL_HUNDRED;
  
    requestRound.save();
    vote.save();
    voter.save();
    voterGroup.save();
  }
  