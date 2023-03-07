import {
  DisputePrice,
  ProposePrice,
  RequestPrice,
  Settle,
  SkinnyOptimisticOracle__getStateInputRequestStruct,
} from "../../generated/SkinnyOptimisticOracle/SkinnyOptimisticOracle";
import { getOrCreateOptimisticPriceRequest } from "../utils/helpers";

import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

// event RequestPrice(
//   address indexed requester,
//   bytes32 indexed identifier,
//   uint32 timestamp,
//   bytes ancillaryData,
//   Request request
// );

export function handleOptimisticRequestPrice(event: RequestPrice): void {
  log.warning(`(ancillary) OO PriceRequest params: {},{},{}`, [
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
  request.currency = event.params.request.currency;
  request.reward = event.params.request.reward;
  request.finalFee = event.params.request.finalFee;
  request.requestTimestamp = event.block.timestamp;
  request.requestBlockNumber = event.block.number;
  request.requestLogIndex = event.logIndex;
  request.requestHash = event.transaction.hash;

  new SkinnyOptimisticOracle__getStateInputRequestStruct();

  request.save();
}

// event ProposePrice(
//   address indexed requester,
//   bytes32 indexed identifier,
//   uint32 timestamp,
//   bytes ancillaryData,
//   Request request
// );

export function handleOptimisticProposePrice(event: ProposePrice): void {
  log.warning(`(ancillary) OO PriceProposed params: {},{},{}`, [
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

  request.proposer = event.params.request.proposer;
  request.proposedPrice = event.params.request.proposedPrice;
  request.proposalExpirationTimestamp = event.params.request.expirationTime;

  request.proposalTimestamp = event.block.timestamp;
  request.proposalBlockNumber = event.block.number;
  request.proposalLogIndex = event.logIndex;
  request.proposalHash = event.transaction.hash;

  request.save();
}

// event DisputePrice(
//   address indexed requester,
//   bytes32 indexed identifier,
//   uint32 timestamp,
//   bytes ancillaryData,
//   Request request
// );

export function handleOptimisticDisputePrice(event: DisputePrice): void {
  log.warning(`(ancillary) OO PriceDisputed params: {},{},{}`, [
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

  request.disputer = event.params.request.disputer;

  request.disputeTimestamp = event.block.timestamp;
  request.disputeBlockNumber = event.block.number;
  request.disputeLogIndex = event.logIndex;
  request.disputeHash = event.transaction.hash;

  request.save();
}

// event Settle(
//   address indexed requester,
//   bytes32 indexed identifier,
//   uint32 timestamp,
//   bytes ancillaryData,
//   Request request
// );

export function handleOptimisticSettle(event: Settle): void {
  log.warning(`(ancillary) OO Settled params: {},{},{}`, [
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

  request.settlementPrice = event.params.request.resolvedPrice;
  request.settlementPayout = event.params.request.bond
    .plus(event.params.request.finalFee)
    .plus(event.params.request.reward);

  if (!request.disputer || request.proposedPrice!.equals(event.params.request.resolvedPrice)) {
    request.settlementRecipient = request.proposer;
  } else {
    request.settlementRecipient = request.disputer;
  }

  request.settlementTimestamp = event.block.timestamp;
  request.settlementBlockNumber = event.block.number;
  request.settlementLogIndex = event.logIndex;
  request.settlementHash = event.transaction.hash;

  request.save();
}
