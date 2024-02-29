import {
  DisputePrice,
  DisputePriceRequestStruct,
  ProposePrice,
  ProposePriceRequestStruct,
  RequestPrice,
  RequestPriceCall,
  RequestPriceRequestStruct,
  Settle,
  SettleRequestStruct,
  SkinnyOptimisticOracle,
  SkinnyOptimisticOracle__getStateInputRequestStruct,
} from "../../generated/SkinnyOptimisticOracle/SkinnyOptimisticOracle";
import { Store } from "../../generated/templates/Store/Store";
import { BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constants";
import { getOrCreateOptimisticPriceRequest } from "../utils/helpers";

import { Address, BigInt, Bytes, dataSource, ethereum, log } from "@graphprotocol/graph-ts";

let network = dataSource.network();

function getStore(): string {
  if (network == "mainnet") {
    return "0x54f44eA3D2e7aA0ac089c4d8F7C93C27844057BF";
  }
  log.error("No store found for network: {}", [network]);
  return ZERO_ADDRESS;
}

function getState<T extends RequestPriceRequestStruct>(
  ooAddress: Address,
  requester: Address,
  identifier: Bytes,
  timestamp: BigInt,
  ancillaryData: Bytes,
  request: T
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
  let oo = SkinnyOptimisticOracle.bind(ooAddress);
  let req = new SkinnyOptimisticOracle__getStateInputRequestStruct(9);
  req[0] = ethereum.Value.fromAddress(request.proposer);
  req[1] = ethereum.Value.fromAddress(request.disputer);
  req[2] = ethereum.Value.fromAddress(request.currency);
  req[3] = ethereum.Value.fromBoolean(request.settled);
  req[4] = ethereum.Value.fromSignedBigInt(request.proposedPrice);
  req[5] = ethereum.Value.fromSignedBigInt(request.resolvedPrice);
  req[6] = ethereum.Value.fromUnsignedBigInt(request.expirationTime);
  req[7] = ethereum.Value.fromUnsignedBigInt(request.reward);
  req[8] = ethereum.Value.fromUnsignedBigInt(request.finalFee);
  req[9] = ethereum.Value.fromUnsignedBigInt(request.bond);
  req[10] = ethereum.Value.fromUnsignedBigInt(request.customLiveness);

  let state = oo.try_getState(requester, identifier, timestamp, ancillaryData, req);
  return states[state.value];
}

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

  request.state = getState<RequestPriceRequestStruct>(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData,
    event.params.request
  );

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

  request.state = getState<ProposePriceRequestStruct>(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData,
    event.params.request
  );

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

  request.state = getState<DisputePriceRequestStruct>(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData,
    event.params.request
  );

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

  request.state = getState<SettleRequestStruct>(
    event.address,
    event.params.requester,
    event.params.identifier,
    event.params.timestamp,
    event.params.ancillaryData,
    event.params.request
  );

  request.save();
}

// requestPrice(bytes32,uint32,bytes,address,uint256,uint256,uint256)
// requestAndProposePriceFor(bytes32,uint32,bytes,address,uint256,uint256,uint256,address,int256)

export function handleRequestPrice(call: RequestPriceCall): void {
  log.warning(`handleRequestPrice params: {},{},{}`, [
    call.inputs.timestamp.toString(),
    call.inputs.identifier.toString(),
    call.inputs.ancillaryData.toHex(),
  ]);
  let requestId = call.inputs.identifier
    .toString()
    .concat("-")
    .concat(call.inputs.timestamp.toString())
    .concat("-")
    .concat(call.inputs.ancillaryData.toHex());

  let request = getOrCreateOptimisticPriceRequest(requestId);

  let store = Store.bind(Address.fromString(getStore()));
  let finalFee = store.try_computeFinalFee(call.inputs.currency);

  request.identifier = call.inputs.identifier.toString();
  request.time = call.inputs.timestamp;
  request.ancillaryData = call.inputs.ancillaryData.toHex();
  request.requester = call.from
  request.currency = call.inputs.currency;
  request.reward = call.inputs.reward;
  request.bond = call.inputs.bond.gt(BIGINT_ZERO) ? call.inputs.bond : finalFee.reverted ? BIGINT_ZERO : finalFee.value.rawValue;
  request.customLiveness = call.inputs.customLiveness;
  request.requestTimestamp = call.inputs.timestamp;
  request.requestBlockNumber = call.block.number;
  request.requestHash = call.transaction.hash;
  request.save();
}
