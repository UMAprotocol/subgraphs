import { FinancialContract } from "../../../generated/schema";

export function getOrCreateFinancialContract(id: String): FinancialContract {
  let contract = FinancialContract.load(id);

  if (contract == null) {
    contract = new FinancialContract(id);
  }

  return contract as FinancialContract;
}
