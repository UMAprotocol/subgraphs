import {
    RequestPrice,
    ProposePrice,
    DisputePrice,
    Settle
  } from "../../generated/OptimisticOracle/OptimisticOracle";
  import {
    getOrCreateOptimisticPriceRequest
  } from "../utils/helpers";
  import { toDecimal } from "../utils/decimals";
  
  import { log, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
  
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
  log.warning(
    `(ancillary) OO PriceRequest params: {},{},{}`, 
    [
      event.params.timestamp.toString(),
      event.params.identifier.toString(),
      event.params.ancillaryData.toHex()
    ]
  ); 
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
  log.warning(
    `(ancillary) OO PriceProposed params: {},{},{}`, 
    [
      event.params.timestamp.toString(),
      event.params.identifier.toString(),
      event.params.ancillaryData.toHex()
    ]
  ); 
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
  log.warning(
    `(ancillary) OO PriceDisputed params: {},{},{}`, 
    [
      event.params.timestamp.toString(),
      event.params.identifier.toString(),
      event.params.ancillaryData.toHex()
    ]
  ); 
    let requestId = event.params.identifier
      .toString()
      .concat("-")
      .concat(event.params.timestamp.toString())
      .concat("-")
      .concat(event.params.ancillaryData.toHex());
  
    let request = getOrCreateOptimisticPriceRequest(requestId);
  
    request.disputer = event.params.disputer;
      
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
  log.warning(
    `(ancillary) OO Settled params: {},{},{}`, 
    [
      event.params.timestamp.toString(),
      event.params.identifier.toString(),
      event.params.ancillaryData.toHex()
    ]
  ); 
    let requestId = event.params.identifier
      .toString()
      .concat("-")
      .concat(event.params.timestamp.toString())
      .concat("-")
      .concat(event.params.ancillaryData.toHex());
  
    let request = getOrCreateOptimisticPriceRequest(requestId);
  
    request.settlementPrice = event.params.price;
    request.settlementPayout = event.params.payout;

    if (
        request.disputer == null ||
        (request.proposedPrice as BigInt == request.settlementPrice as BigInt)
    ) {
        request.settlementRecipient = request.proposer;
    } else {
        request.settlementRecipient = request.disputer;
    }
    request.save();
}