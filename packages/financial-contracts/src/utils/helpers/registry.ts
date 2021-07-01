import { FinancialContract, ContractCreator, Token } from "../../../generated/schema";
import {
  ExpiringMultiParty,
  ExpiringMultiPartyCreator,
  Perpetual,
  PerpetualCreator,
} from "../../../generated/templates";
import { ERC20 } from "../../../generated/templates/ExpiringMultiPartyCreator/ERC20";
import { Address } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS } from "../decimals";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO } from "../constants";

export function getOrCreateFinancialContract(id: String, createIfNotFound: boolean = true): FinancialContract {
  let contract = FinancialContract.load(id);

  if (contract == null && createIfNotFound) {
    contract = new FinancialContract(id);
    contract.cumulativeFeeMultiplier = BIGDECIMAL_ONE; // Hardcoded in the contract

    ExpiringMultiParty.create(Address.fromString(id));
  }

  return contract as FinancialContract;
}

export function getOrCreatePerpetualContract(id: String, createIfNotFound: boolean = true): FinancialContract {
  let contract = FinancialContract.load(id);

  if (contract == null && createIfNotFound) {
    contract = new FinancialContract(id);
    contract.cumulativeFeeMultiplier = BIGDECIMAL_ONE; // Hardcoded in the contract

    Perpetual.create(Address.fromString(id));
  }

  return contract as FinancialContract;
}

export function getOrCreateContractCreator(id: String, createIfNotFound: boolean = true): ContractCreator {
  let contractCreator = ContractCreator.load(id);

  if (contractCreator == null && createIfNotFound) {
    contractCreator = new ContractCreator(id);

    ExpiringMultiPartyCreator.create(Address.fromString(id));
  }

  return contractCreator as ContractCreator;
}

export function getOrCreatePerpetualCreator(id: String, createIfNotFound: boolean = true): ContractCreator {
  let contractCreator = ContractCreator.load(id);

  if (contractCreator == null && createIfNotFound) {
    contractCreator = new ContractCreator(id);

    PerpetualCreator.create(Address.fromString(id));
  }

  return contractCreator as ContractCreator;
}

export function getOrCreateToken(
  tokenAddress: Address,
  persist: boolean = true,
  indexAsCollateral: boolean = false,
  isOnWhitelist: boolean = false
): Token {
  let addressString = tokenAddress.toHexString();

  let token = Token.load(addressString);

  if (token == null) {
    token = new Token(addressString);
    token.address = tokenAddress;

    let erc20Token = ERC20.bind(tokenAddress);

    let tokenDecimals = erc20Token.try_decimals();
    let tokenName = erc20Token.try_name();
    let tokenSymbol = erc20Token.try_symbol();

    token.decimals = !tokenDecimals.reverted ? tokenDecimals.value : DEFAULT_DECIMALS;
    token.name = !tokenName.reverted ? tokenName.value : "";
    token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : "";
    token.indexingAsCollateral = false;
    token.isOnWhitelist = false;
    token.finalFee = BIGDECIMAL_ZERO;

    if (indexAsCollateral) {
      token.indexingAsCollateral = true;
    }
    if (isOnWhitelist) {
      token.isOnWhitelist = true;
    }

    if (persist) {
      token.save();
    }
  }

  if (indexAsCollateral && !token.indexingAsCollateral) {
    token.indexingAsCollateral = true;
    token.save();
  }

  if (isOnWhitelist && !token.isOnWhitelist) {
    token.isOnWhitelist = true;
    token.save();
  }

  return token as Token;
}
