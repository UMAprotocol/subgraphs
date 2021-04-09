import {
    RemovedFromWhitelist,
    AddedToWhitelist
} from "../../generated/AddressWhitelist/AddressWhitelist";
import {
    getOrCreateToken
} from "../utils/helpers";

// - event: AddedToWhitelist(indexed address)
//   handler: handleAddedToWhitelist

export function handleAddedToWhitelist(event: AddedToWhitelist): void {
    getOrCreateToken(event.params.addedAddress, true, false, true);  
}
  
  // - event: RemovedFromWhitelist(indexed address)
  //   handler: handleRemovedFromWhitelist
  
  export function handleRemovedFromWhitelist(event: RemovedFromWhitelist): void {
    let token = getOrCreateToken(event.params.removedAddress);
    token.isOnWhitelist = false;
    token.save();
}