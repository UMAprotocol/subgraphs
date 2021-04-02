import { User, VotingTokenHolder } from "../../../generated/schema";
import { VotingToken } from "../../../generated/VotingToken/VotingToken";
import {
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
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
    user.votingTokenHolder = user.id; // If a token holder with that ID hasn't been created it will just return null on queries

    user.save();
  }

  return user as User;
}

export function getOrCreateVotingTokenHolder(
  id: Address,
  createIfNotFound: boolean = true
): VotingTokenHolder {
  let tokenHolder = VotingTokenHolder.load(id.toHexString());

  if (tokenHolder == null && createIfNotFound) {
    tokenHolder = new VotingTokenHolder(id.toHexString());
    tokenHolder.votingTokenBalanceRaw = BIGINT_ZERO;
    tokenHolder.votingTokenBalance = BIGDECIMAL_ZERO;
    tokenHolder.address = id;

    tokenHolder.save();
  }

  return tokenHolder as VotingTokenHolder;
}

export function getTokenContract(): VotingToken {
  return VotingToken.bind(VOTING_TOKEN_ADDRESS);
}
