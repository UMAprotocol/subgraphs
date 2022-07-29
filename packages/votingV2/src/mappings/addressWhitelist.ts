import { RemovedFromWhitelist, AddedToWhitelist } from "../../generated/AddressWhitelist/AddressWhitelist";
import { getOrCreateCollateral } from "../utils/helpers";

// - event: AddedToWhitelist(indexed address)
//   handler: handleAddedToWhitelist

export function handleAddedToWhitelist(event: AddedToWhitelist): void {
  getOrCreateCollateral(event.params.addedAddress, true);
}

// - event: RemovedFromWhitelist(indexed address)
//   handler: handleRemovedFromWhitelist

export function handleRemovedFromWhitelist(event: RemovedFromWhitelist): void {
  let token = getOrCreateCollateral(event.params.removedAddress);
  token.isOnWhitelist = false;
  token.save();
}
