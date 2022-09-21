import { User } from "../../../generated/schema";
import { BIGINT_ZERO } from "../constants";
import { Address } from "@graphprotocol/graph-ts";
import { VotingToken } from "../../../generated/Voting/VotingToken";
import { VOTING_TOKEN_ADDRESS } from "../../../addresses";
import { getOrCreateGlobals } from "./voting";

export function getOrCreateUser(id: Address, createIfNotFound: boolean = true): User {
  let user = User.load(id.toHexString());

  if (user == null && createIfNotFound) {
    let globals = getOrCreateGlobals();
    user = new User(id.toHexString());
    user.address = id;
    user.countReveals = BIGINT_ZERO;
    user.stakesAmounts = [];
    user.stakesTimestamp = [];
    user.countCorrectVotes = BIGINT_ZERO;
    user.countWrongVotes = BIGINT_ZERO;
    user.countNoVotes = BIGINT_ZERO;

    user.save();
    globals.save();
  }

  return user as User;
}

export function getTokenContract(): VotingToken {
  return VotingToken.bind(Address.fromString(VOTING_TOKEN_ADDRESS));
}
