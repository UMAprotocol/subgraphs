import { Collateral } from "../../../generated/schema";
import { ERC20 } from "../../../generated/templates/AddressWhitelist/ERC20";
import { Address } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS } from "../decimals";
import { BIGDECIMAL_ZERO } from "../constants";

export function getOrCreateCollateral(
    tokenAddress: Address,
    setOnWhitelist: boolean = false
  ): Collateral {
    let addressString = tokenAddress.toHexString();
  
    let token = Collateral.load(addressString);
  
    if (token == null) {
      token = new Collateral(addressString);
      token.address = tokenAddress;
  
      let erc20Token = ERC20.bind(tokenAddress);
  
      let tokenDecimals = erc20Token.try_decimals();
      let tokenName = erc20Token.try_name();
      let tokenSymbol = erc20Token.try_symbol();
  
      token.decimals = !tokenDecimals.reverted ? tokenDecimals.value : DEFAULT_DECIMALS;
      token.name = !tokenName.reverted ? tokenName.value : "";
      token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : "";
      token.isOnWhitelist = false;
      token.finalFee = BIGDECIMAL_ZERO;
  
      if (setOnWhitelist) {
        token.isOnWhitelist = setOnWhitelist;
      }
  
      token.save();
    }
  
    return token as Collateral;
  }
  