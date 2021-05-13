import {
    SetFinalFeeCall
} from "../../generated/Store/Store";
import {
    getOrCreateToken
} from "../utils/helpers";
import { toDecimal } from "../utils/decimals";
import { log } from "@graphprotocol/graph-ts";


// - function: setFinalFee(address,tuple)
//   handler: handleSetFinalFee

export function handleSetFinalFee(call: SetFinalFeeCall): void {
    let token = getOrCreateToken(call.inputs.currency);
    token.finalFee = toDecimal(call.inputs.newFinalFee.rawValue, token.decimals);
    token.save();
}