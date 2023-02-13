import {
  AssertionDisputed,
  AssertionMade,
  AssertionSettled
} from "../../generated/OptimisticAsserter/OptimisticAsserter";
import { getAssertionId, getOrCreateAssertion } from "../utils/helpers";

import { log } from "@graphprotocol/graph-ts";

// - event: AssertionMade(indexed bytes32,bytes32,bytes,indexed address,address,indexed address,address,uint64,address,uint256)
//   handler: handleAssertionMade
// event AssertionMade(
//   bytes32 indexed assertionId,
//   bytes32 domainId,
//   bytes claim,
//   address indexed asserter,
//   address callbackRecipient,
//   address indexed escalationManager,
//   address caller,
//   uint64 expirationTime,
//   IERC20 currency,
//   uint256 bond
// );

export function handleAssertionMade(event: AssertionMade): void {
  log.warning(`Assertion params: {},{},{}`, [
    event.params.assertionId.toHexString(),
    event.params.domainId.toHexString(),
    event.params.claim.toHexString(),
  ]);
  let assertionId = getAssertionId(event.params.assertionId);

  let assertion = getOrCreateAssertion(assertionId);

  assertion.assertionId = event.params.assertionId.toHexString();
  assertion.domainId = event.params.domainId.toHexString();
  assertion.claim = event.params.claim.toHexString();
  assertion.asserter = event.params.asserter;
  assertion.callbackRecipient = event.params.callbackRecipient;
  assertion.escalationManager = event.params.escalationManager;
  assertion.caller = event.params.caller;
  assertion.expirationTime = event.params.expirationTime;
  assertion.currency = event.params.currency;
  assertion.bond = event.params.bond;

  assertion.assertionTimestamp = event.block.timestamp;
  assertion.assertionBlockNumber = event.block.number;
  assertion.assertionHash = event.transaction.hash;
  assertion.assertionLogIndex = event.logIndex;

  assertion.save();
}

// - event: AssertionDisputed(indexed bytes32,indexed address,indexed address)
//   handler: handleAssertionDisputed
//  event AssertionDisputed(bytes32 indexed assertionId, address indexed caller, address indexed disputer)

export function handleAssertionDisputed(event: AssertionDisputed): void {
  log.warning(`Assertion disputed params: {},{},{}`, [
    event.params.assertionId.toHexString(),
    event.params.caller.toHexString(),
    event.params.disputer.toHexString(),
  ]);

  let assertionId = getAssertionId(event.params.assertionId);

  let assertion = getOrCreateAssertion(assertionId);

  assertion.disputer = event.params.disputer;

  assertion.disputeTimestamp = event.block.timestamp;
  assertion.disputeBlockNumber = event.block.number;
  assertion.disputeLogIndex = event.logIndex;
  assertion.disputeHash = event.transaction.hash;

  assertion.save();
}

// - event: AssertionSettled(indexed bytes32,indexed address,bool,bool,address)
//   handler: handleAssertionSettled
// event AssertionSettled(
//   bytes32 indexed assertionId,
//   address indexed bondRecipient,
//   bool disputed,
//   bool settlementResolution,
//   address settleCaller
// );

export function handleAssertionSettled(event: AssertionSettled): void {
  log.warning(`Assertion settled params: {},{},{}`, [
    event.params.assertionId.toHexString(),
    event.params.settlementResolution.toString(),
    event.params.settleCaller.toHexString(),
  ]);
  let assertionId = getAssertionId(event.params.assertionId);

  let assertion = getOrCreateAssertion(assertionId);

  assertion.settlementRecipient = event.params.bondRecipient;
  assertion.settlementResolution = event.params.settlementResolution;

  assertion.settlementTimestamp = event.block.timestamp;
  assertion.settlementBlockNumber = event.block.number;
  assertion.settlementLogIndex = event.logIndex;
  assertion.settlementHash = event.transaction.hash;

  assertion.save();
}
