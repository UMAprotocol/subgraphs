export {
  handleVoteRevealed,
  handleVoteCommitted,
  handlePriceRequestAdded,
  handlePriceResolved,
  handleStaked,
  handleUpdatedReward,
  handleWithdrawnRewards,
  handleVoterSlashed
} from "./mappings/votingV2";

export { handleSupportedIdentifierAdded, handleSupportedIdentifierRemoved } from "./mappings/identifierWhitelist";

export { handleAddedToWhitelist, handleRemovedFromWhitelist } from "./mappings/addressWhitelist";

export { handleNewContractRegistered } from "./mappings/registry";

export { handleSetFinalFee } from "./mappings/store";
