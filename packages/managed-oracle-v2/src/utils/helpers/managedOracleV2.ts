import { Address, ByteArray, Bytes, crypto } from "@graphprotocol/graph-ts";
import { CustomBondSet } from "../../../generated/ManagedOracleV2/ManagedOracleV2";

export function getManagedRequestId(requester: Address, identifier: Bytes, ancillaryData: Bytes): ByteArray {
  let packed = requester.concat(identifier).concat(ancillaryData);
  return crypto.keccak256(packed);
}

export function createCustomBondId(requester: Bytes, identifier: Bytes, ancillaryData: Bytes, currency: Bytes): string {
  let packed = requester.concat(identifier).concat(ancillaryData).concat(currency);
  return crypto.keccak256(packed).toHexString();
}

export function createCustomBondIdFromEvent(event: CustomBondSet): string {
  return createCustomBondId(
    event.params.requester,
    event.params.identifier,
    event.params.ancillaryData,
    event.params.currency
  );
}
