import { Bytes } from "@graphprotocol/graph-ts";
import { OptimisticPriceRequest } from "../../../generated/schema";
import { BIGINT_ZERO } from "../constants";

export function getOrCreateOptimisticPriceRequest(
  id: String,
  createIfNotFound: boolean = true
): OptimisticPriceRequest {
  let request = OptimisticPriceRequest.load(id);

  if (request == null && createIfNotFound) {
    request = new OptimisticPriceRequest(id);
    request.identifier = "";
    request.ancillaryData = "";
    request.time = BIGINT_ZERO;
    request.requester = Bytes.fromI32(0);
    request.currency = Bytes.fromI32(0);
    request.reward = BIGINT_ZERO;
    request.finalFee = BIGINT_ZERO;
    request.lastUpdated = BIGINT_ZERO;
  }

  return request as OptimisticPriceRequest;
}
