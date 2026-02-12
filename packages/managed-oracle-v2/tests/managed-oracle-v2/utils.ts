import { createMockedFunction, newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  CustomBondSet,
  CustomLivenessSet,
  ProposePrice,
  RequestPrice,
  RoleGranted,
  RoleRevoked,
} from "../../generated/ManagedOracleV2/ManagedOracleV2";

// RESOLVER_ROLE = keccak256("RESOLVER_ROLE")
export const RESOLVER_ROLE = Bytes.fromHexString("0x92a19c77d2ea87c7f81d50c74403cb2f401780f3ad919571121efe2bdb427eb1");

export const contractAddress = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"); // Default test contract address

export function createCustomLivenessSetEvent(
  managedRequestId: string, // Bytes,
  requester: string, // Address,
  identifier: string, // Bytes,
  ancillaryData: string, // Bytes,
  customLiveness: i32 // BigInt
): CustomLivenessSet {
  let customLivenessEvent = changetype<CustomLivenessSet>(newMockEvent());
  customLivenessEvent.address = contractAddress;
  customLivenessEvent.parameters = new Array();
  // managedRequestId
  customLivenessEvent.parameters.push(
    new ethereum.EventParam("managedRequestId", ethereum.Value.fromBytes(Bytes.fromHexString(managedRequestId)))
  );
  // requester
  customLivenessEvent.parameters.push(
    new ethereum.EventParam("requester", ethereum.Value.fromAddress(Address.fromString(requester)))
  );
  // identifier
  customLivenessEvent.parameters.push(
    new ethereum.EventParam("identifier", ethereum.Value.fromBytes(Bytes.fromHexString(identifier)))
  );
  // ancillaryData
  customLivenessEvent.parameters.push(
    new ethereum.EventParam("ancillaryData", ethereum.Value.fromBytes(Bytes.fromHexString(ancillaryData)))
  );
  // customLiveness
  customLivenessEvent.parameters.push(
    new ethereum.EventParam("customLiveness", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(customLiveness)))
  );

  return customLivenessEvent;
}

export function createCustomBondSetEvent(
  managedRequestId: string, // Bytes,
  requester: string, // Address,
  identifier: string, // Bytes,
  ancillaryData: string, // Bytes,
  currency: string, // Address,
  bond: i32 // BigInt
): CustomBondSet {
  let customBondEvent = changetype<CustomBondSet>(newMockEvent());
  customBondEvent.address = contractAddress;
  customBondEvent.parameters = new Array();
  // managedRequestId
  customBondEvent.parameters.push(
    new ethereum.EventParam("managedRequestId", ethereum.Value.fromBytes(Bytes.fromHexString(managedRequestId)))
  );
  // requester
  customBondEvent.parameters.push(
    new ethereum.EventParam("requester", ethereum.Value.fromAddress(Address.fromString(requester)))
  );
  // identifier
  customBondEvent.parameters.push(
    new ethereum.EventParam("identifier", ethereum.Value.fromBytes(Bytes.fromHexString(identifier)))
  );
  // ancillaryData
  customBondEvent.parameters.push(
    new ethereum.EventParam("ancillaryData", ethereum.Value.fromBytes(Bytes.fromHexString(ancillaryData)))
  );
  // currency
  customBondEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(Address.fromString(currency)))
  );
  // bond
  customBondEvent.parameters.push(
    new ethereum.EventParam("bond", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(bond)))
  );

  return customBondEvent;
}

export function createRequestPriceEvent(
  requester: string, // Address,
  identifier: string, // Bytes,
  timestamp: i32, // BigInt,
  ancillaryData: string, // Bytes,
  currency: string, // Address,
  reward: i32, // BigInt,
  finalFee: i32 // BigInt
): RequestPrice {
  let requestPriceEvent = changetype<RequestPrice>(newMockEvent());
  requestPriceEvent.address = contractAddress;

  requestPriceEvent.parameters = new Array();
  // requester
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("requester", ethereum.Value.fromAddress(Address.fromString(requester)))
  );
  // identifier
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("identifier", ethereum.Value.fromBytes(Bytes.fromHexString(identifier)))
  );
  // timestamp
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("timestamp", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timestamp)))
  );
  // ancillaryData
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("ancillaryData", ethereum.Value.fromBytes(Bytes.fromHexString(ancillaryData)))
  );
  // currency
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(Address.fromString(currency)))
  );
  // reward
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(reward)))
  );
  // finalFee
  requestPriceEvent.parameters.push(
    new ethereum.EventParam("finalFee", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(finalFee)))
  );

  return requestPriceEvent;
}

export function createProposePriceEvent(
  requester: string, // Address,
  proposer: string, // Address,
  identifier: string, // Bytes,
  timestamp: i32, // BigInt,
  ancillaryData: string, // Bytes,
  proposedPrice: i32, // BigInt,
  expirationTimestamp: i32, // BigInt,
  currency: string // Address
): ProposePrice {
  let proposePriceEvent = changetype<ProposePrice>(newMockEvent());
  proposePriceEvent.address = contractAddress;
  proposePriceEvent.parameters = new Array();

  // requester
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("requester", ethereum.Value.fromAddress(Address.fromString(requester)))
  );
  // proposer
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("proposer", ethereum.Value.fromAddress(Address.fromString(proposer)))
  );
  // identifier
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("identifier", ethereum.Value.fromBytes(Bytes.fromHexString(identifier)))
  );
  // timestamp
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("timestamp", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timestamp)))
  );
  // ancillaryData
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("ancillaryData", ethereum.Value.fromBytes(Bytes.fromHexString(ancillaryData)))
  );
  // proposedPrice
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("proposedPrice", ethereum.Value.fromSignedBigInt(BigInt.fromI32(proposedPrice)))
  );
  // expirationTimestamp
  proposePriceEvent.parameters.push(
    new ethereum.EventParam(
      "expirationTimestamp",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(expirationTimestamp))
    )
  );
  // currency
  proposePriceEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(Address.fromString(currency)))
  );

  return proposePriceEvent;
}

// https://github.com/UMAprotocol/protocol/blob/99b96247d27ec8a5ea9dbf3eef1dcd71beb0dc41/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol#L51
export namespace State {
  export const Invalid = 0; // Never requested
  export const Requested = 1; // Requested, no other actions taken
  export const Proposed = 2; // Proposed, but not expired or disputed yet
  export const Expired = 3; // Proposed, not disputed, past liveness
  export const Disputed = 4; // Disputed, but no DVM price returned yet
  export const Resolved = 5; // Disputed and DVM price is available
  export const Settled = 6; // Final price has been set in the contract (can get here from Expired or Resolved).
}

export function mockGetState(
  requester: string, // Address,
  identifier: string, // Bytes,
  timestamp: i32, // ethereum.Value,
  ancillaryData: string, // Bytes
  expectedState: i32 // i32 => State
): void {
  createMockedFunction(contractAddress, "getState", "getState(address,bytes32,uint256,bytes):(uint8)")
    .withArgs([
      ethereum.Value.fromAddress(Address.fromString(requester)),
      ethereum.Value.fromFixedBytes(Bytes.fromHexString(identifier)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timestamp)),
      ethereum.Value.fromBytes(Bytes.fromHexString(ancillaryData)),
    ])
    .returns([ethereum.Value.fromI32(expectedState)]);
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: string,
  sender: string
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent());
  roleGrantedEvent.address = contractAddress;
  roleGrantedEvent.parameters = new Array();

  // role
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  );
  // account
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.fromString(account)))
  );
  // sender
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(Address.fromString(sender)))
  );

  return roleGrantedEvent;
}

// Function signatures used by the generated ABI bindings
const GET_REQUEST_NEW_SIG = "getRequest(address,bytes32,uint256,bytes):((address,address,address,bool,(bool,bool,bool,bool,bool,uint256,uint256),int256,int256,uint256,uint256,uint256,uint256))";
const GET_REQUEST_LEGACY_SIG = "getRequest(address,bytes32,uint256,bytes):((address,address,address,bool,(bool,bool,bool,bool,bool,uint256,uint256),int256,int256,uint256,uint256,uint256))";

function getRequestArgs(
  requester: string,
  identifier: string,
  timestamp: i32,
  ancillaryData: string
): ethereum.Value[] {
  return [
    ethereum.Value.fromAddress(Address.fromString(requester)),
    ethereum.Value.fromFixedBytes(Bytes.fromHexString(identifier)),
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(timestamp)),
    ethereum.Value.fromBytes(Bytes.fromHexString(ancillaryData)),
  ];
}

function buildRequestSettingsTuple(
  bond: i32,
  eventBased: bool,
  customLiveness: i32
): ethereum.Tuple {
  let settings = new ethereum.Tuple();
  settings.push(ethereum.Value.fromBoolean(eventBased));
  settings.push(ethereum.Value.fromBoolean(false)); // refundOnDispute
  settings.push(ethereum.Value.fromBoolean(false)); // callbackOnPriceProposed
  settings.push(ethereum.Value.fromBoolean(false)); // callbackOnPriceDisputed
  settings.push(ethereum.Value.fromBoolean(false)); // callbackOnPriceSettled
  settings.push(ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(bond)));
  settings.push(ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(customLiveness)));
  return settings;
}

/**
 * Mocks getRequest with the new ABI (includes proposalTime field).
 * Used when simulating a contract deployed from audit-permissioned-resolver.
 */
export function mockGetRequestNewABI(
  requester: string,
  identifier: string,
  timestamp: i32,
  ancillaryData: string,
  bond: i32,
  eventBased: bool,
  customLiveness: i32
): void {
  let requestTuple = new ethereum.Tuple();
  requestTuple.push(ethereum.Value.fromAddress(Address.zero())); // proposer
  requestTuple.push(ethereum.Value.fromAddress(Address.zero())); // disputer
  requestTuple.push(ethereum.Value.fromAddress(Address.zero())); // currency
  requestTuple.push(ethereum.Value.fromBoolean(false)); // settled
  requestTuple.push(ethereum.Value.fromTuple(buildRequestSettingsTuple(bond, eventBased, customLiveness)));
  requestTuple.push(ethereum.Value.fromSignedBigInt(BigInt.zero())); // proposedPrice
  requestTuple.push(ethereum.Value.fromSignedBigInt(BigInt.zero())); // resolvedPrice
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // expirationTime
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // reward
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // finalFee
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // proposalTime

  createMockedFunction(contractAddress, "getRequest", GET_REQUEST_NEW_SIG)
    .withArgs(getRequestArgs(requester, identifier, timestamp, ancillaryData))
    .returns([ethereum.Value.fromTuple(requestTuple)]);
}

/**
 * Mocks getRequest with the new ABI to revert.
 * Simulates calling a contract that doesn't have the proposalTime field.
 */
export function mockGetRequestNewABIReverts(
  requester: string,
  identifier: string,
  timestamp: i32,
  ancillaryData: string
): void {
  createMockedFunction(contractAddress, "getRequest", GET_REQUEST_NEW_SIG)
    .withArgs(getRequestArgs(requester, identifier, timestamp, ancillaryData))
    .reverts();
}

/**
 * Mocks getRequest with the legacy ABI (no proposalTime field).
 * Used when simulating a pre-upgrade or opt-in-early-resolution contract.
 */
export function mockGetRequestLegacyABI(
  requester: string,
  identifier: string,
  timestamp: i32,
  ancillaryData: string,
  bond: i32,
  eventBased: bool,
  customLiveness: i32
): void {
  let requestTuple = new ethereum.Tuple();
  requestTuple.push(ethereum.Value.fromAddress(Address.zero())); // proposer
  requestTuple.push(ethereum.Value.fromAddress(Address.zero())); // disputer
  requestTuple.push(ethereum.Value.fromAddress(Address.zero())); // currency
  requestTuple.push(ethereum.Value.fromBoolean(false)); // settled
  requestTuple.push(ethereum.Value.fromTuple(buildRequestSettingsTuple(bond, eventBased, customLiveness)));
  requestTuple.push(ethereum.Value.fromSignedBigInt(BigInt.zero())); // proposedPrice
  requestTuple.push(ethereum.Value.fromSignedBigInt(BigInt.zero())); // resolvedPrice
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // expirationTime
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // reward
  requestTuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.zero())); // finalFee

  createMockedFunction(contractAddress, "getRequest", GET_REQUEST_LEGACY_SIG)
    .withArgs(getRequestArgs(requester, identifier, timestamp, ancillaryData))
    .returns([ethereum.Value.fromTuple(requestTuple)]);
}

/**
 * Mocks getRequest with the legacy ABI to revert.
 */
export function mockGetRequestLegacyABIReverts(
  requester: string,
  identifier: string,
  timestamp: i32,
  ancillaryData: string
): void {
  createMockedFunction(contractAddress, "getRequest", GET_REQUEST_LEGACY_SIG)
    .withArgs(getRequestArgs(requester, identifier, timestamp, ancillaryData))
    .reverts();
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: string,
  sender: string
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent());
  roleRevokedEvent.address = contractAddress;
  roleRevokedEvent.parameters = new Array();

  // role
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  );
  // account
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.fromString(account)))
  );
  // sender
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(Address.fromString(sender)))
  );

  return roleRevokedEvent;
}
