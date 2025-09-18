import { log } from "@graphprotocol/graph-ts";
import { CustomBond, CustomLiveness } from "../../generated/schema";
import { CustomBondSet, CustomLivenessSet } from "../../generated/ManagedOracleV2/ManagedOracleV2";
import { createCustomBondIdFromEvent } from "../utils/helpers/managedOracleV2";

export function handleCustomBondSet(event: CustomBondSet): void {
  const managedRequestId = event.params.managedRequestId.toHexString();
  log.debug("Custom Bond set event. Loading entity with managedRequestId, {}", [managedRequestId]);

  const id = createCustomBondIdFromEvent(event);

  let entity = CustomBond.load(id);

  if (entity == null) {
    entity = new CustomBond(managedRequestId);
    entity.managedRequestId = managedRequestId;
    entity.requester = event.params.requester;
    entity.identifier = event.params.identifier.toString();
    entity.ancillaryData = event.params.ancillaryData.toHex();
    entity.currency = event.params.currency;
  }

  entity.customBond = event.params.bond;
  entity.save();
}

export function handleCustomLivenessSet(event: CustomLivenessSet): void {
  const managedRequestId = event.params.managedRequestId.toHexString();
  log.debug("Custom Liveness set event. Loading entity with managedRequestId, {}", [managedRequestId]);

  let entity = CustomLiveness.load(managedRequestId);

  if (entity == null) {
    entity = new CustomLiveness(managedRequestId);
    entity.managedRequestId = managedRequestId;
    entity.requester = event.params.requester;
    entity.identifier = event.params.identifier.toString();
    entity.ancillaryData = event.params.ancillaryData.toHex();
  }

  entity.customLiveness = event.params.customLiveness;
  entity.save();
}
