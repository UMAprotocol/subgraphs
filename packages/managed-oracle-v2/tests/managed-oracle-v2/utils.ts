import { newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import { CustomBondSet, CustomLivenessSet, RequestPrice } from "../../generated/ManagedOracleV2/ManagedOracleV2";

export function createCustomLivenessSetEvent(
  managedRequestId: string, // Bytes,
  requester: string, // Address,
  identifier: string, // Bytes,
  ancillaryData: string, // Bytes,
  customLiveness: i32 // BigInt
): CustomLivenessSet {
  let customLivenessEvent = changetype<CustomLivenessSet>(newMockEvent());

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
