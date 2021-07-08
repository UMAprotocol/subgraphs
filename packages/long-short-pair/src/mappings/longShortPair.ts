import {
  getOrCreateLongShortPairContract,
  getOrCreateToken,
  getOrCreateTokensCreatedEvent,
  getOrCreateTokensRedeemedEvent,
  getOrCreateContractExpiredEvent,
  getOrCreatePositionSettledEvent,
} from "../utils/helpers";

import {
  LongShortPair,
  TokensCreated,
  TokensRedeemed,
  ContractExpired,
  PositionSettled,
} from "../../generated/templates/LongShortPair/LongShortPair";

import { toDecimal } from "../utils/decimals";
import { CONTRACT_EXPIRED_PRICE_REQUESTED, CONTRACT_EXPIRED_PRICE_RECEIVED } from "../utils/constants";
import { log, Address, BigInt } from "@graphprotocol/graph-ts";

function updateLSPBalances(
  lspAddress: Address,
  collateralChange: BigInt,
  longTokensChange: BigInt,
  shortTokensChange: BigInt
): void {
  let lsp = getOrCreateLongShortPairContract(lspAddress.toHexString());
  let lspContract = LongShortPair.bind(lspAddress);
  let collateralToken = getOrCreateToken(lspContract.collateralToken());

  lsp.totalCollateralLocked = lsp.totalCollateralLocked.plus(toDecimal(collateralChange, collateralToken.decimals));
  lsp.longTokensOutstanding = lsp.longTokensOutstanding.plus(toDecimal(longTokensChange, collateralToken.decimals));
  lsp.shortTokensOutstanding = lsp.shortTokensOutstanding.plus(toDecimal(shortTokensChange, collateralToken.decimals));

  lsp.save();
}

function updateLSPState(lspAddress: Address, updateContractState: String): void {
  let lsp = getOrCreateLongShortPairContract(lspAddress.toHexString());

  lsp.contractState = updateContractState.toString();

  lsp.save();
}

// - event: TokensCreated(indexed address,indexed uint256,indexed uint256)
//   handler: handleTokensCreated
// event TokensCreated(address indexed sponsor, uint256 indexed collateralUsed, uint256 indexed tokensMinted);
export function handleTokensCreated(event: TokensCreated): void {
  log.warning(`TokensCreated on LSP: {} with params: {},{},{}`, [
    event.address.toString(),
    event.params.sponsor.toString(),
    event.params.collateralUsed.toString(),
    event.params.tokensMinted.toString(),
  ]);

  updateLSPBalances(event.address, event.params.collateralUsed, event.params.tokensMinted, event.params.tokensMinted);

  let tokensCreatedEvent = getOrCreateTokensCreatedEvent(event);
  tokensCreatedEvent.contract = event.address.toHexString();
  tokensCreatedEvent.sponsor = event.params.sponsor.toHexString();
  tokensCreatedEvent.collateralUsed = event.params.collateralUsed;
  tokensCreatedEvent.tokensMinted = event.params.tokensMinted;

  tokensCreatedEvent.save();
}

// - event: TokensRedeemed(indexed address,indexed uint256,indexed uint256)
//   handler: handleTokensRedeemed
// event TokensRedeemed(address indexed sponsor, uint256 indexed collateralReturned, uint256 indexed tokensRedeemed);
export function handleTokensRedeemed(event: TokensRedeemed): void {
  log.warning(`TokensRedeemed on LSP: {} with params: {},{},{}`, [
    event.address.toString(),
    event.params.sponsor.toString(),
    event.params.collateralReturned.toString(),
    event.params.tokensRedeemed.toString(),
  ]);

  updateLSPBalances(
    event.address,
    event.params.collateralReturned.times(BigInt.fromString("-1")),
    event.params.tokensRedeemed.times(BigInt.fromString("-1")),
    event.params.tokensRedeemed.times(BigInt.fromString("-1"))
  );

  let tokensRedeemedEvent = getOrCreateTokensRedeemedEvent(event);
  tokensRedeemedEvent.contract = event.address.toHexString();
  tokensRedeemedEvent.sponsor = event.params.sponsor.toHexString();
  tokensRedeemedEvent.collateralReturned = event.params.collateralReturned;
  tokensRedeemedEvent.tokensRedeemed = event.params.tokensRedeemed;

  tokensRedeemedEvent.save();
}

// - event: ContractExpired(indexed address,indexed uint256,indexed uint256)
//   handler: handleContractExpired
// event ContractExpired(address indexed caller)
export function handleContractExpired(event: ContractExpired): void {
  log.warning(`ContractExpired on LSP: {} with params: {}`, [event.address.toString(), event.params.caller.toString()]);

  updateLSPState(event.address, CONTRACT_EXPIRED_PRICE_REQUESTED);

  let contractExpiredEvent = getOrCreateContractExpiredEvent(event);
  contractExpiredEvent.contract = event.address.toHexString();
  contractExpiredEvent.caller = event.params.caller.toHexString();

  contractExpiredEvent.save();
}

// - event: PositionSettled(indexed address,uint256,uint256,uint256)
//   handler: handlePositionSettled
// event PositionSettled(address indexed sponsor, uint256 collateralReturned, uint256 longTokens, uint256 shortTokens);
export function handlePositionSettled(event: PositionSettled): void {
  log.warning(`PositionSettled on LSP: {} with params: {},{},{},{}`, [
    event.address.toString(),
    event.params.sponsor.toString(),
    event.params.collateralReturned.toString(),
    event.params.longTokens.toString(),
    event.params.shortTokens.toString(),
  ]);

  updateLSPBalances(
    event.address,
    event.params.collateralReturned.times(BigInt.fromString("-1")),
    event.params.longTokens.times(BigInt.fromString("-1")),
    event.params.shortTokens.times(BigInt.fromString("-1"))
  );

  updateLSPState(event.address, CONTRACT_EXPIRED_PRICE_RECEIVED);

  let positionSettledEvent = getOrCreatePositionSettledEvent(event);
  positionSettledEvent.contract = event.address.toHexString();
  positionSettledEvent.sponsor = event.params.sponsor.toHexString();
  positionSettledEvent.collateralReturned = event.params.collateralReturned;
  positionSettledEvent.longTokens = event.params.longTokens;
  positionSettledEvent.shortTokens = event.params.shortTokens;

  positionSettledEvent.save();
}
