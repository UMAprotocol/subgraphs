export {
  handleVoteRevealed,
  handleVoteCommitted,
  handlePriceRequestAdded,
  handlePriceResolved,
  handleRewardsRetrieved,
} from "./mappings/voting";

export {
  handlePriceRequestAdded as handlePriceRequestAddedAncillary,
  handleVoteRevealed as handleVoteRevealedAncillary,
  handleVoteCommitted as handleVoteCommittedAncillary,
  handlePriceResolved as handlePriceResolvedAncillary,
  handleRewardsRetrieved as handleRewardsRetrievedAncillary,
} from "./mappings/votingAncillary";

export { handleSupportedIdentifierAdded, handleSupportedIdentifierRemoved } from "./mappings/identifierWhitelist";

export { handleAddedToWhitelist, handleRemovedFromWhitelist } from "./mappings/addressWhitelist";

export { handleNewContractRegistered } from "./mappings/registry";

export { handleSetFinalFee } from "./mappings/store";
