import { NewContractRegistered } from "../../generated/Registry/Registry";

import {
  getOrCreateFinancialContract
} from "../utils/helpers";

// - event: NewContractRegistered(indexed address,indexed address,address[])
//   handler: handleNewContractRegistered
export function handleNewContractRegistered(event: NewContractRegistered): void {
    let contract = getOrCreateFinancialContract(event.params.contractAddress.toHexString());
    contract.creator = event.params.creator;
    contract.registrationTimestamp = event.block.timestamp;
    contract.save();
}