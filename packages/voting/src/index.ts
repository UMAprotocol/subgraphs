export { handleTransferVotingToken } from "./mappings/votingToken";

export {
  handleVoteRevealed,
  handleVoteCommitted,
  handlePriceRequestAdded,
  handlePriceResolved,
  handleRewardsRetrieved
} from "./mappings/voting";

export {
  handleVoteRevealed as handleVoteRevealedAncillary,
  handleVoteCommitted as handleVoteCommittedAncillary,
  handlePriceResolved as handlePriceResolvedAncillary,
  handleRewardsRetrieved as handleRewardsRetrievedAncillary
} from "./mappings/votingAncillary";

export {
  handleSupportedIdentifierAdded,
  handleSupportedIdentifierRemoved
} from "./mappings/identifierWhitelist";
