import { createMockedFunction, newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import { CustomBondSet, CustomLivenessSet, RequestPrice } from "../../generated/ManagedOracleV2/ManagedOracleV2";

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
