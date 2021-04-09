import { Transfer } from "../../generated/VotingToken/VotingToken";
import { getOrCreateUser } from "../utils/helpers";
import { toDecimal } from "../utils/decimals";
import { BIGINT_ONE, BIGINT_ZERO, BIGDECIMAL_ZERO } from "../utils/constants"

// - event: Transfer(indexed address,indexed address,uint256)
//   handler: handleTransferVotingToken
export function handleTransferVotingToken(event: Transfer): void {
    let fromUser = getOrCreateUser(event.params.from);
    let toUser = getOrCreateUser(event.params.to);

    fromUser.sendCount = fromUser.sendCount + BIGINT_ONE;
    fromUser.balance = fromUser.balance - toDecimal(event.params.value);
    fromUser.sendBalance = fromUser.sendBalance + toDecimal(event.params.value);
    toUser.receiveCount = toUser.receiveCount + BIGINT_ONE;
    toUser.balance = toUser.balance + toDecimal(event.params.value);
    toUser.receiveBalance = toUser.receiveBalance + toDecimal(event.params.value);

    // If recipient has never received UMA before, then set first block held:
    if (event.params.value > BIGINT_ZERO && toUser.firstBlockHeld == null) {
        toUser.firstBlockHeld = event.block.number;
    }
    // If sender has no more balance, then reset their first block held:
    if (fromUser.balance == BIGDECIMAL_ZERO) {
        fromUser.firstBlockHeld = null;
    }

    fromUser.save();
    toUser.save();
}