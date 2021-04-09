import { User } from "../../../generated/schema";
import {
  BIGINT_ZERO,
  BIGDECIMAL_ZERO
} from "../constants";
import { Address } from "@graphprotocol/graph-ts";

export function getOrCreateUser(
  id: Address,
  createIfNotFound: boolean = true
): User {
  let user = User.load(id.toHexString());

  if (user == null && createIfNotFound) {
    user = new User(id.toHexString());
    user.address = id;
    user.balance = BIGDECIMAL_ZERO;
    user.sendCount = BIGINT_ZERO;
    user.receiveCount = BIGINT_ZERO;
    user.sendBalance = BIGDECIMAL_ZERO;
    user.receiveBalance = BIGDECIMAL_ZERO;
    user.save();
  }

  return user as User;
}
