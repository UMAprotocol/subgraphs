import { BigInt, Bytes, crypto } from "@graphprotocol/graph-ts";
import { OptimisticPriceRequest } from "../../../generated/schema";

// Creates a unique ID for an OptimisticPriceRequest entity.
export function createOptimisticPriceRequestId(
  identifier: Bytes,
  timestamp: BigInt,
  ancillaryData: Bytes
): string {
  const ancillaryDataHash = crypto.keccak256(ancillaryData).toHexString();
  return identifier
    .toString()
    .concat("-")
    .concat(timestamp.toString())
    .concat("-")
    .concat(ancillaryDataHash);
}

export function getOrCreateOptimisticPriceRequest(
  id: String,
  createIfNotFound: boolean = true
): OptimisticPriceRequest {
  let request = OptimisticPriceRequest.load(id);

  if (request == null && createIfNotFound) {
    request = new OptimisticPriceRequest(id);
  }

  return request as OptimisticPriceRequest;
}
