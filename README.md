# UMA related subgraphs

## Install dependencies

`yarn`

## Voting Events

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/voting`

- Kovan: <https://thegraph.com/explorer/subgraph/umaprotocol/kovan-voting>
- Mainnet: <https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-voting>
- (staging) Kovan: <https://thegraph.com/explorer/subgraph/nicholaspai/kovan-voting-staging>
- (staging) Mainnet: <https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-voting-staging>

## Skinny Optimistic Oracle Events

This subgraph indexes events emitted by the "Skinny Optimistic Oracle" contracts. The code can be found in `packages/skinny-optimistic-oracle`

- Mainnet: <https://thegraph.com/studio/subgraph/mainnet-skinny-oo>
- (testnet) Sepolia: <https://thegraph.com/studio/subgraph/sepolia-skinny-oo>

## Optimistic Oracle Events

This subgraph indexes events emitted by the "Optimistic Oracle" contracts. The code can be found in `packages/optimistic-oracle`

- Mainnet: <https://thegraph.com/studio/subgraph/mainnet-optimistic-oracle>
- Polygon: <https://thegraph.com/studio/subgraph/polygon-optimistic-oracle>
- Arbitrum: <https://thegraph.com/studio/subgraph/arbitrum-optimistic-oracle>
- Optimism: <https://thegraph.com/studio/subgraph/optimism-optimistic-oracle>
- Boba: <https://thegraph.com/studio/subgraph/boba-optimistic-oracle>
- (staging) Goerli: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle>
- (staging) Core Testnet: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-oracle>
- Core: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-oracle>
- (testnet) Sepolia: <https://thegraph.com/studio/subgraph/sepolia-optimistic-oracle>
- Base: <https://thegraph.com/studio/subgraph/base-optimistic-oracle>
- Blast: <https://thegraph.com/studio/subgraph/blast-optimistic-oracle>
- Story Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/story-optimistic-oracle/0.0.1/gn>

## Optimistic Oracle V2 Events and Calls

This subgraph indexes events and function calls by the "Optimistic Oracle V2" contracts. The code can be found in `packages/optimistic-oracle-v2`

**Note:** L2 chains does not support `callHandlers`. This means we cannot use callHandlers to index the `setBond`, `setCustomLiveness`, and `setEventBased` function calls. These properties are also not available via events. Our compromise here is that in the case of L2 chains, we read this data from the contract state in the event handler instead. **This workaround works when `setCustomLiveness` and `setEventBased` are called in the same transaction as `requestPrice`. So it doesn't work for all cases. Ideally we should have `callHandlers` in the chains that support this.** We therefore must also remove the call handlers from the subgraph.yaml file for Polygon. See `scripts/remove-call-handlers.js` for implementation.

- Mainnet: <https://thegraph.com/studio/subgraph/mainnet-optimistic-oracle-v2>
- Polygon TheGraph: <https://thegraph.com/studio/subgraph/polygon-optimistic-oracle-v2>
- Polygon Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/polygon-optimistic-oracle-v2/latest/gn>
- Arbitrum TheGraph: <https://thegraph.com/studio/subgraph/arbitrum-optimistic-oracle-v2>
- Arbitrum Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/arbitrum-optimistic-oracle-v2/latest/gn>
- Optimism TheGraph: <https://thegraph.com/studio/subgraph/optimism-optimistic-oracle-v2>
- Optimism Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/optimism-optimistic-oracle-v2/latest/gn>
- Boba: <https://thegraph.com/studio/subgraph/boba-optimistic-oracle-v2>
- (staging) Goerli: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle-v2>
- (staging) Core Testnet: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-oracle-v2>
- Core: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-oracle-v2>
- (testnet) Sepolia: <https://thegraph.com/studio/subgraph/sepolia-optimistic-oracle-v2>
- Base TheGraph: <https://thegraph.com/studio/subgraph/base-optimistic-oracle-v2>
- Base Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/base-optimistic-oracle-v2/latest/gn>
- (staging) Base Sepolia: <https://thegraph.com/studio/subgraph/base-sepolia-oo-v2>
- Blast TheGraph: <https://thegraph.com/studio/subgraph/blast-optimistic-oracle-v2>
- Blast Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/blast-optimistic-oracle-v2/1.0.0/gn>
- Story Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/story-optimistic-oracle-v2/0.0.1/gn>

## Financial Contract Events

This subgraph indexes events emitted by the ExpiringMultiParty and Perpetual contracts. The code can be found in `packages/financial-contracts`

- Kovan: <https://thegraph.com/explorer/subgraph/umaprotocol/kovan-contracts>
- Mainnet: <https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-contracts>
- (staging) Kovan: <https://thegraph.com/explorer/subgraph/nicholaspai/kovan-contracts-staging>
- (staging) Mainnet: <https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-contracts-staging>

## Token Events

This subgraph indexes events emitted by the UMA voting token contracts. The code can be found in `packages/token`

- Kovan: <https://thegraph.com/explorer/subgraph/umaprotocol/kovan-token>
- Mainnet: <https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-token>
- (staging) Kovan: <https://thegraph.com/explorer/subgraph/nicholaspai/kovan-token-staging>
- (staging) Mainnet: <https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-token-staging>

## Voting V2 Events

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/votingV2`

- Mainnet: <https://thegraph.com/studio/subgraph/mainnet-voting-v2>
- Goerli: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-voting-v2>
- (testnet) Sepolia: <https://thegraph.com/studio/subgraph/sepolia-voting-v2>

## Optimistic Oracle V3 Events

This subgraph indexes events emitted by the "Optimistic Oracle V3" contracts. The code can be found in `packages/optimistic-oracle-v3`

- Mainnet TheGraph: <https://thegraph.com/studio/subgraph/mainnet-optimistic-oracle-v3>
- Mainnet Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/mainnet-optimistic-oracle-v3/latest/gn>
- Polygon TheGraph: <https://thegraph.com/studio/subgraph/polygon-optimistic-oracle-v3>
- Polygon Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/polygon-optimistic-oracle-v3/1/gn>
- Arbitrum TheGraph: <https://thegraph.com/studio/subgraph/arbitrum-optimistic-oracle-v3>
- Arbitrum Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/arbitrum-optimistic-oracle-v3/1/gn>
- Optimism TheGraph: <https://thegraph.com/studio/subgraph/optimism-optimistic-oracle-v3>
- Optimism Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/optimism-optimistic-oracle-v3/1/gn>
- Boba: <https://thegraph.com/studio/subgraph/boba-optimistic-oracle-v3>
- Avalanche: <https://thegraph.com/studio/subgraph/avalanche-optimistic-oracle-v3>
- Gnosis: <https://thegraph.com/studio/subgraph/gnosis-optimistic-oracle-v3>
- (staging) Goerli: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle-v3>
- (staging) Core Testnet: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-oracle-v3>
- Core: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-oracle-v3>
- (testnet) Sepolia: <https://thegraph.com/studio/subgraph/sepolia-optimistic-oracle-v3>
- Base TheGraph: <https://thegraph.com/studio/subgraph/base-optimistic-oracle-v3>
- Base Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/base-optimistic-oracle-v3/latest/gn>
- (staging) Base Sepolia: <https://thegraph.com/studio/subgraph/base-sepolia-oo-v3>
- Blast TheGraph: <https://thegraph.com/studio/subgraph/blast-optimistic-oracle-v3>
- Blast Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/blast-goldsky-optimistic-oracle-v3/1/gn>
- Story Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/story-optimistic-oracle-v3/0.0.1/gn>

## Optimistic Governor Events

This subgraph indexes events emitted by all the Optimistic Governor deployments.

- Mainnet: <https://thegraph.com/studio/subgraph/mainnet-optimistic-governor>
- Polygon: <https://thegraph.com/studio/subgraph/polygon-optimistic-governor>
- Arbitrum: <https://thegraph.com/studio/subgraph/arbitrum-optimistic-governor>
- Optimism: <https://thegraph.com/studio/subgraph/optimism-optimistic-governor>
- Avalanche: <https://thegraph.com/studio/subgraph/avalanche-optimistic-governor>
- Gnosis: <https://thegraph.com/studio/subgraph/gnosis-optimistic-governor>
- (testnet) Goerli: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-governor>
- (staging) Core Testnet: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-governor>
- Core: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-governor>
- Base: <https://thegraph.com/studio/subgraph/base-optimistic-governor>
- (testnet) Sepolia: <https://thegraph.com/studio/subgraph/sepolia-optimistic-governor>

## Resources

- Really well done subgraph repository: [aragon/connect](https://github.com/aragon/connect/tree/master/packages/connect-thegraph/subgraph)

- Run a local graph node: [graph-node](https://github.com/graphprotocol/graph-node/blob/master/docker/README.md)
