import { Address, ByteArray, Bytes, crypto } from "@graphprotocol/graph-ts";
import { CustomBondSet } from "../../../generated/ManagedOracleV2/ManagedOracleV2";

export function getManagedRequestId(requester: Address, identifier: Bytes, ancillaryData: Bytes): ByteArray {
  let packed = requester.concat(identifier).concat(ancillaryData);
  return crypto.keccak256(packed);
}

/**
 * Creates a unique ID for a custom bond entity.
 *
 * Including the currency in the ID ensures that custom bonds are tied to specific currencies.
 * This means that custom bonds set for different currencies will have different IDs,
 * even if all other parameters (requester, identifier, ancillary data) are the same.
 *
 * This is crucial for the currency matching logic - we can only find custom bonds
 * that match the exact currency used in a request.
 */
export function createCustomBondId(requester: Bytes, identifier: Bytes, ancillaryData: Bytes, currency: Bytes): string {
  let packed = requester.concat(identifier).concat(ancillaryData).concat(currency);
  return crypto.keccak256(packed).toHexString();
}

/**
 * Creates a custom bond ID from a CustomBondSet event.
 * This is a convenience function that extracts the parameters from the event
 * and passes them to createCustomBondId.
 */
export function createCustomBondIdFromEvent(event: CustomBondSet): string {
  return createCustomBondId(
    event.params.requester,
    event.params.identifier,
    event.params.ancillaryData,
    event.params.currency
  );
}
