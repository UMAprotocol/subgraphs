import { log, Bytes, crypto } from "@graphprotocol/graph-ts";
import { CustomBond, CustomLiveness, Resolver, ResolverHistory } from "../../generated/schema";
import { CustomBondSet, CustomLivenessSet, RoleGranted, RoleRevoked } from "../../generated/ManagedOracleV2/ManagedOracleV2";
import { createCustomBondIdFromEvent } from "../utils/helpers/managedOracleV2";

// RESOLVER_ROLE = keccak256("RESOLVER_ROLE")
const RESOLVER_ROLE = Bytes.fromHexString("0x92a19c77d2ea87c7f81d50c74403cb2f401780f3ad919571121efe2bdb427eb1");

/**
 * Handles CustomBondSet events from the ManagedOracleV2 contract.
 *
 * Creates or updates a CustomBond entity with a unique ID that includes the currency.
 * This ensures that custom bonds are tied to specific currencies and can only be
 * found when the request currency matches the custom bond currency.
 */
export function handleCustomBondSet(event: CustomBondSet): void {
  const managedRequestId = event.params.managedRequestId.toHexString();
  log.debug("Custom Bond set event. Loading entity with managedRequestId, {}", [managedRequestId]);

  // Generate unique ID that includes currency - this ensures currency matching
  const id = createCustomBondIdFromEvent(event);

  let entity = CustomBond.load(id);

  if (entity == null) {
    entity = new CustomBond(id);
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
    entity.requester = event.params.requester;
    entity.identifier = event.params.identifier.toString();
    entity.ancillaryData = event.params.ancillaryData.toHex();
  }

  entity.customLiveness = event.params.customLiveness;
  entity.save();
}

export function handleRoleGranted(event: RoleGranted): void {
  if (event.params.role != RESOLVER_ROLE) return;

  const id = event.params.account.toHexString();
  let resolver = Resolver.load(id);

  if (resolver == null) {
    resolver = new Resolver(id);
    resolver.address = event.params.account;
  }

  resolver.isActive = true;
  resolver.addedAt = event.block.timestamp;
  resolver.addedTx = event.transaction.hash;
  resolver.save();

  // Create history entry
  const historyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let history = new ResolverHistory(historyId);
  history.resolver = event.params.account;
  history.action = "added";
  history.timestamp = event.block.timestamp;
  history.blockNumber = event.block.number;
  history.transactionHash = event.transaction.hash;
  history.save();

  log.info("Resolver added: {}", [id]);
}

export function handleRoleRevoked(event: RoleRevoked): void {
  if (event.params.role != RESOLVER_ROLE) return;

  const id = event.params.account.toHexString();
  let resolver = Resolver.load(id);

  if (resolver != null) {
    resolver.isActive = false;
    resolver.removedAt = event.block.timestamp;
    resolver.removedTx = event.transaction.hash;
    resolver.save();
  }

  // Create history entry
  const historyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let history = new ResolverHistory(historyId);
  history.resolver = event.params.account;
  history.action = "removed";
  history.timestamp = event.block.timestamp;
  history.blockNumber = event.block.number;
  history.transactionHash = event.transaction.hash;
  history.save();

  log.info("Resolver removed: {}", [id]);
}
