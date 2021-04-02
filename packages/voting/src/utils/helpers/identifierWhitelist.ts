import { PriceIdentifier } from "../../../generated/schema";

export function getOrCreatePriceIdentifier(
  id: String,
  createIfNotFound: boolean = true
): PriceIdentifier {
  let identifier = PriceIdentifier.load(id);

  if (identifier == null && createIfNotFound) {
    identifier = new PriceIdentifier(id);
  }

  return identifier as PriceIdentifier;
}
