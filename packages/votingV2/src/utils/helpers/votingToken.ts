import { User } from "../../../generated/schema";
import { VotingToken } from "../../../generated/VotingAncillary/VotingToken";
import { VOTING_TOKEN_ADDRESS, BIGINT_ZERO } from "../constants";
import { Address } from "@graphprotocol/graph-ts";

export function getOrCreateUser(id: Address, createIfNotFound: boolean = true): User {
  let user = User.load(id.toHexString());

  if (user == null && createIfNotFound) {
    user = new User(id.toHexString());
    user.address = id;
    user.countReveals = BIGINT_ZERO;
    user.countRetrievals = BIGINT_ZERO;

    user.save();
  }

  return user as User;
}

export function getTokenContract(): VotingToken {
  return VotingToken.bind(VOTING_TOKEN_ADDRESS);
}
