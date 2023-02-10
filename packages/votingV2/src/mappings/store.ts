 import { SetFinalFeeCall } from "../../generated/Store/Store";
import { getOrCreateCollateral } from "../utils/helpers";
import { toDecimal } from "../utils/decimals";

// - function: setFinalFee(address,tuple)
//   handler: handleSetFinalFee

export function handleSetFinalFee(call: SetFinalFeeCall): void {
  let token = getOrCreateCollateral(call.inputs.currency);
  token.finalFee = toDecimal(call.inputs.newFinalFee.rawValue, token.decimals);
  token.save();
}
