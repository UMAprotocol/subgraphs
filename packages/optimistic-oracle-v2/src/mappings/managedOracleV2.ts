import { log } from "@graphprotocol/graph-ts";
import { CustomBondSet, CustomLivenessSet } from "../../generated/OptimisticOracleV2/OptimisticOracleV2";
import { CustomBond, CustomLiveness } from "../../generated/schema";

export function handleCustomBondSet(event: CustomBondSet): void {
  const managedRequestId = event.params.managedRequestId.toString();
  log.debug("Custom Bond set event. Loading entity with managedRequestId, {}", [managedRequestId]);

  let entity = CustomBond.load(managedRequestId);

  if (entity == null) {
    entity = new CustomBond(managedRequestId);
    entity.requester = event.params.requester;
    entity.identifier = event.params.identifier.toString();
    entity.ancillaryData = event.params.ancillaryData.toHex();
  }

  entity.customBond = event.params.bond;
  entity.save();
}

export function handleCustomLivenessSet(event: CustomLivenessSet): void {
  const managedRequestId = event.params.managedRequestId.toString();
  log.debug("Custom Liveness set event. Loading entity with managedRequestId, {}", [managedRequestId]);

  let entity = CustomLiveness.load(managedRequestId);

  if (entity == null) {
    entity = new CustomLiveness(managedRequestId);
    entity.requester = event.params.requester;
    entity.identifier = event.params.identifier.toString();
    entity.ancillaryData = event.params.ancillaryData.toHex();
  }

  entity.customLiveness = event.params.customLiveness;
  entity.save();
}
