import { Bytes } from "@graphprotocol/graph-ts";
import { Assertion } from "../../../generated/schema";

export function getAssertionId(assertionId: Bytes): String {
  return assertionId.toString();
}

export function getOrCreateAssertion(id: String, createIfNotFound: boolean = true): Assertion {
  let request = Assertion.load(id);

  if (request == null && createIfNotFound) {
    request = new Assertion(id);
  }

  return request as Assertion;
}
