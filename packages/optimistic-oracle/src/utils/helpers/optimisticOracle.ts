import { OptimisticPriceRequest } from "../../../generated/schema";

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
