import { log } from "@graphprotocol/graph-ts";
import { CustomLivenessSet, CustomBondSet } from "../../generated/ManagedOracleV2/ManagedOracleV2";

export function handleCustomBondSet(event: CustomBondSet): void {
  const requestId = event.params.managedRequestId.managedRequestId.toString();
  log.debug("Custom Bond set event. Loading entity with request id, {}", [requestId]);

  let entity = getOrCreateOptimisticPriceRequest(requestId);
  //   add fields
  entity.save();
}

export function handleCustomLivenessSet(event: CustomLivenessSet): void {
  const requestId = event.params.managedRequestId.toString();
  log.debug("Custom Liveness set event. Loading entity with request id, {}", [requestId]);

  let entity = getOrCreateOptimisticPriceRequest(requestId);
  //   add fields
  entity.save();
}
