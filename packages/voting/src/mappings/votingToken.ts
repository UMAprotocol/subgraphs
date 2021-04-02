import { Transfer } from "../../generated/VotingToken/VotingToken";
import { getOrCreateUser, getOrCreateVotingTokenHolder } from "../utils/helpers";
import { toDecimal } from "../utils/decimals";

// - event: Transfer(indexed address,indexed address,uint256)
//   handler: handleTransferVotingToken

export function handleTransferVotingToken(event: Transfer): void {
  let fromUser = getOrCreateUser(event.params.from);
  let fromHolder = getOrCreateVotingTokenHolder(event.params.from);
  let toUser = getOrCreateUser(event.params.to);
  let toHolder = getOrCreateVotingTokenHolder(event.params.to);

  fromHolder.votingTokenBalanceRaw =
    fromHolder.votingTokenBalanceRaw - event.params.value;
  toHolder.votingTokenBalanceRaw =
    toHolder.votingTokenBalanceRaw + event.params.value;

  fromHolder.votingTokenBalance = toDecimal(fromHolder.votingTokenBalanceRaw);
  toHolder.votingTokenBalance = toDecimal(toHolder.votingTokenBalanceRaw);

  fromHolder.save();
  toHolder.save();
}
