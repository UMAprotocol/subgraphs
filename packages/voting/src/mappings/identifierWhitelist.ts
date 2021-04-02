import { SupportedIdentifierAdded, SupportedIdentifierRemoved } from "../../generated/IdentifierWhitelist/IdentifierWhitelist";
import { getOrCreatePriceIdentifier } from "../utils/helpers";

// - event: SupportedIdentifierAdded(indexed bytes32)
//   handler: handleSupportedIdentifierAdded

export function handleSupportedIdentifierAdded(event: SupportedIdentifierAdded): void {
  let identifier = getOrCreatePriceIdentifier(event.params.identifier.toString())

  identifier.isSupported = true;

  identifier.save();
}

// - event: SupportedIdentifierRemoved(indexed bytes32)
//   handler: handleSupportedIdentifierRemoved

export function handleSupportedIdentifierRemoved(event: SupportedIdentifierRemoved): void {
  let identifier = getOrCreatePriceIdentifier(event.params.identifier.toString())

  identifier.isSupported = false;

  identifier.save();
}
