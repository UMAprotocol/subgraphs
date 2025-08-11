import { Address, Bytes, crypto } from "@graphprotocol/graph-ts";

export function getManagedRequestId(requester: Address, identifier: Bytes, ancillaryData: Bytes): Bytes {
  let packed = requester.concat(identifier).concat(ancillaryData);
  return crypto.keccak256(packed);
}
