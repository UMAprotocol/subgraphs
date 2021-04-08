import { User } from "../../../generated/schema";
import { VotingToken } from "../../../generated/VotingToken/VotingToken";
import {
  VOTING_TOKEN_ADDRESS
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

    user.save();
  }

  return user as User;
}

export function getTokenContract(): VotingToken {
  return VotingToken.bind(VOTING_TOKEN_ADDRESS);
}
