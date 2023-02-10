import {
  DisputePrice,
  OptimisticOracleV2,
  ProposePrice,
  RequestPrice,
  SetBondCall,
  SetCustomLivenessCall,
  Settle,
} from "../../generated/OptimisticOracleV2/OptimisticOracleV2";
import { getOrCreateOptimisticPriceRequest } from "../utils/helpers";

import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

function getState(
  ooAddress: Address,
  requester: Address,
  identifier: Bytes,
  timestamp: BigInt,
  ancillaryData: Bytes
): string {
  const states = [
    "Invalid", // Never requested.
    "Requested", // Requested, no other actions taken.
    "Proposed", // Proposed, but not expired or disputed yet.
    "Expired", // Proposed, not disputed, past liveness.
    "Disputed", // Disputed, but no DVM price returned yet.
    "Resolved", // Disputed and DVM price is available.
    "Settled", // Final price has been set in the contract (can get here from Expired or Resolved).
  ];
  let oov2 = OptimisticOracleV2.bind(ooAddress);
  let state = oov2.try_getState(requester, identifier, timestamp, ancillaryData);
  return states[state.value];
}

// - event: RequestPrice(indexed address,bytes32,uint256,bytes,address,uint256,uint256)
//   handler: handleOptimisticRequestPrice
// - event RequestPrice(
//     address indexed requester,
//     bytes32 identifier,
//     uint256 timestamp,
//     bytes ancillaryData,
//     address currency,
//     uint256 reward,
//     uint256 finalFee
//   );

export function handleOptimisticRequestPrice(event: RequestPrice): void {
  log.warning(`(ancillary) OOV2 PriceRequest params: {},{},{}`, [
    event.params.timestamp.toString(),
    event.params.identifier.toString(),
    event.params.ancillaryData.toHex(),
  ]);
  let requestId = event.params.identifier
    .toString()
    .concat("-")
    .concat(event.params.timestamp.toString())
    .concat("-")
    .concat(event.params.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);

  request.identifier = event.params.identifier.toString();
  request.time = event.params.timestamp;
  request.ancillaryData = event.params.ancillaryData.toHex();
  request.requester = event.params.requester;
  request.currency = event.params.currency;
  request.reward = event.params.reward;
  request.finalFee = event.params.finalFee;
  request.requestTimestamp = event.block.timestamp;
  request.requestBlockNumber = event.block.number;
  request.requestLogIndex = event.logIndex;
  request.requestHash = event.transaction.hash;

  request.state = getState(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData
  );

  request.save();
}

// - event: ProposePrice(indexed address,indexed address,bytes32,uint256,bytes,int256,uint256,address)
//   handler: handleOptimisticProposePrice
// - event ProposePrice(
//     address indexed requester,
//     address indexed proposer,
//     bytes32 identifier,
//     uint256 timestamp,
//     bytes ancillaryData,
//     int256 proposedPrice,
//     uint256 expirationTimestamp,
//     address currency
// );

export function handleOptimisticProposePrice(event: ProposePrice): void {
  log.warning(`(ancillary) OOV2 PriceProposed params: {},{},{}`, [
    event.params.timestamp.toString(),
    event.params.identifier.toString(),
    event.params.ancillaryData.toHex(),
  ]);
  let requestId = event.params.identifier
    .toString()
    .concat("-")
    .concat(event.params.timestamp.toString())
    .concat("-")
    .concat(event.params.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);

  request.proposer = event.params.proposer;
  request.proposedPrice = event.params.proposedPrice;
  request.proposalExpirationTimestamp = event.params.expirationTimestamp;

  request.proposalTimestamp = event.block.timestamp;
  request.proposalBlockNumber = event.block.number;
  request.proposalLogIndex = event.logIndex;
  request.proposalHash = event.transaction.hash;

  request.state = getState(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData
  );

  request.save();
}

// - event: DisputePrice(indexed address,indexed address,indexed address,bytes32,uint256,bytes,int256)
//   handler: handleOptimisticDisputePrice
// - event DisputePrice(
//     address indexed requester,
//     address indexed proposer,
//     address indexed disputer,
//     bytes32 identifier,
//     uint256 timestamp,
//     bytes ancillaryData,
//     int256 proposedPrice
//   );

export function handleOptimisticDisputePrice(event: DisputePrice): void {
  log.warning(`(ancillary) OOV2 PriceDisputed params: {},{},{}`, [
    event.params.timestamp.toString(),
    event.params.identifier.toString(),
    event.params.ancillaryData.toHex(),
  ]);
  let requestId = event.params.identifier
    .toString()
    .concat("-")
    .concat(event.params.timestamp.toString())
    .concat("-")
    .concat(event.params.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);

  request.disputer = event.params.disputer;

  request.disputeTimestamp = event.block.timestamp;
  request.disputeBlockNumber = event.block.number;
  request.disputeLogIndex = event.logIndex;
  request.disputeHash = event.transaction.hash;

  request.state = getState(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData
  );

  request.save();
}

// - event: Settle(indexed address,indexed address,indexed address,bytes32,uint256,bytes,int256,uint256)
//   handler: handleOptimisticSettle
//  - event Settle(
//     address indexed requester,
//     address indexed proposer,
//     address indexed disputer,
//     bytes32 identifier,
//     uint256 timestamp,
//     bytes ancillaryData,
//     int256 price,
//     uint256 payout
// );

export function handleOptimisticSettle(event: Settle): void {
  log.warning(`(ancillary) OOV2 Settled params: {},{},{}`, [
    event.params.timestamp.toString(),
    event.params.identifier.toString(),
    event.params.ancillaryData.toHex(),
  ]);
  let requestId = event.params.identifier
    .toString()
    .concat("-")
    .concat(event.params.timestamp.toString())
    .concat("-")
    .concat(event.params.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);

  request.settlementPrice = event.params.price;
  request.settlementPayout = event.params.payout;

  if (!request.disputer || request.proposedPrice!.equals(event.params.price)) {
    request.settlementRecipient = request.proposer;
  } else {
    request.settlementRecipient = request.disputer;
  }

  request.settlementTimestamp = event.block.timestamp;
  request.settlementBlockNumber = event.block.number;
  request.settlementLogIndex = event.logIndex;
  request.settlementHash = event.transaction.hash;

  request.state = getState(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData
  );

  request.save();
}

export function handleSetCustomLiveness(call: SetCustomLivenessCall): void {
  log.warning(`OOV2 set custom liveness inputs: {},{},{},{}`, [
    call.inputs.timestamp.toString(),
    call.inputs.identifier.toString(),
    call.inputs.ancillaryData.toHex(),
    call.inputs.customLiveness.toString(),
  ]);
  let requestId = call.inputs.identifier
    .toString()
    .concat("-")
    .concat(call.inputs.timestamp.toString())
    .concat("-")
    .concat(call.inputs.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);
  request.customLiveness = call.inputs.customLiveness;
}

export function handleSetBond(call: SetBondCall): void {
  log.warning(`OOV2 set bond inputs: {},{},{},{}`, [
    call.inputs.timestamp.toString(),
    call.inputs.identifier.toString(),
    call.inputs.ancillaryData.toHex(),
    call.inputs.bond.toString(),
  ]);
  let requestId = call.inputs.identifier
    .toString()
    .concat("-")
    .concat(call.inputs.timestamp.toString())
    .concat("-")
    .concat(call.inputs.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);
  request.bond = call.inputs.bond;
}
