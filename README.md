# UMA related subgraphs

## Install dependencies

`yarn`

## Running Tests

This repository uses [Matchstick](https://github.com/LimeChain/matchstick) for subgraph testing.

### Prerequisites

- **PostgreSQL 14** must be installed and running on your machine. Matchstick requires this for its testing environment.

### Running the tests

Tests are available for select packages and can be run using the following commands:

```bash
# Run tests for all packages with test suites
yarn test

# Run tests in parallel (faster)
yarn test:parallel

# Run full CI pipeline (prepare and test)
yarn ci
```

The `yarn test` command runs tests for the following packages (when available):

- `managed-optimistic-oracle-v2-subgraph`
- `optimistic-oracle-subgraph`
- `optimistic-oracle-v2-subgraph`
- `optimistic-oracle-v3-subgraph`
- `skinny-optimistic-oracle-subgraph`
- `votingV2-subgraph`

To run tests for a specific package, navigate to the package directory and run `yarn test` or `graph test` directly.

## Voting V1 Events

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/voting`

- Mainnet
  - TheGraph: <https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-voting>
- (testnet) Sepolia
  - TheGraph: <https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-voting-staging>

## Skinny Optimistic Oracle Events

This subgraph indexes events emitted by the "Skinny Optimistic Oracle" contracts. The code can be found in `packages/skinny-optimistic-oracle`

- Mainnet
  - TheGraph: <https://api.studio.thegraph.com/query/1057/mainnet-skinny-oo/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/mainnet-skinny-optimistic-oracle/1.1.0/gn>
- (testnet) Sepolia
  - TheGraph: <https://api.studio.thegraph.com/query/1057/sepolia-skinny-oo/1.2.1>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/sepolia-skinny-optimistic-oracle/1.1.0/gn>

## Optimistic Oracle Events

This subgraph indexes events emitted by the "Optimistic Oracle" contracts. The code can be found in `packages/optimistic-oracle`

- Mainnet
  - TheGraph: <https://api.studio.thegraph.com/query/1057/mainnet-optimistic-oracle/1.2.0>
  - Goldsky:
- Polygon
  - TheGraph: <https://api.studio.thegraph.com/query/1057/polygon-optimistic-oracle/1.2.0>
  - Goldsky:
- Arbitrum
  - TheGraph: <https://api.studio.thegraph.com/query/1057/arbitrum-optimistic-oracle/1.2.0>
  - Goldsky:
- Optimism
  - TheGraph: <https://api.studio.thegraph.com/query/1057/optimism-optimistic-oracle/1.2.0>
  - Goldsky:
- Boba
  - TheGraph: <https://api.studio.thegraph.com/query/1057/boba-optimistic-oracle/1.2.0>
  - Goldsky:
- (staging) Goerli
  - TheGraph: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle>
  - Goldsky:
- (staging) Core Testnet
  - TheGraph: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-oracle>
  - Goldsky:
- Core
  - TheGraph: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-oracle>
  - Goldsky:
- (testnet) Sepolia
  - TheGraph: <https://api.studio.thegraph.com/query/1057/sepolia-optimistic-oracle/1.2.0>
  - Goldsky:
- Base
  - TheGraph: <https://api.studio.thegraph.com/query/1057/base-optimistic-oracle/1.2.0>
  - Goldsky:
- Blast
  - TheGraph:
  - Goldsky:
- Story
  - TheGraph:
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/story-optimistic-oracle/0.0.1/gn>

## Optimistic Oracle V2 Events and Calls

This subgraph indexes events and function calls by the "Optimistic Oracle V2" contracts. The code can be found in `packages/optimistic-oracle-v2`

**Note:** L2 chains does not support `callHandlers`. This means we cannot use callHandlers to index the `setBond`, `setCustomLiveness`, and `setEventBased` function calls. These properties are also not available via events. Our compromise here is that in the case of L2 chains, we read this data from the contract state in the event handler instead. **This workaround works when `setCustomLiveness` and `setEventBased` are called in the same transaction as `requestPrice`. So it doesn't work for all cases. Ideally we should have `callHandlers` in the chains that support this.** We therefore must also remove the call handlers from the subgraph.yaml file for Polygon. See `scripts/remove-call-handlers.js` for implementation.

- Mainnet
  - TheGraph: <https://api.studio.thegraph.com/query/1057/mainnet-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/mainnet-optimistic-oracle-v2/latest/gn>
- Polygon
  - TheGraph: <https://api.studio.thegraph.com/query/1057/polygon-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/polygon-optimistic-oracle-v2/1.1.0/gn>
- Arbitrum
  - TheGraph: <https://api.studio.thegraph.com/query/1057/arbitrum-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/arbitrum-optimistic-oracle-v2/1.1.0/gn>
- Optimism
  - TheGraph: <https://api.studio.thegraph.com/query/1057/optimism-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/optimism-optimistic-oracle-v2/1.1.0/gn>
- Boba
  - TheGraph: <https://api.studio.thegraph.com/query/1057/boba-optimistic-oracle-v2/1.2.0>
  - Goldsky:
- (staging) Core Testnet
  - TheGraph: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-oracle-v2>
- Core
  - TheGraph: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-oracle-v2>
- (testnet) Sepolia
  - TheGraph: <https://api.studio.thegraph.com/query/1057/sepolia-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/sepolia-optimistic-oracle-v2/1.1.0/gn>
- Base
  - TheGraph: <https://api.studio.thegraph.com/query/1057/base-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/base-optimistic-oracle-v2/1.1.0/gn>
- (staging) Base Sepolia
  - TheGraph: <https://thegraph.com/studio/subgraph/base-sepolia-oo-v2>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/base-sepolia-optimistic-oracle-v2/1.1.0/gn>
- Blast
  - TheGraph:
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/blast-optimistic-oracle-v2/1.1.0/gn>
- Story
  - TheGraph:
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/story-optimistic-oracle-v2/1.1.0/gn>

## Managed Optimistic Oracle V2 Events and Calls

This subgraph indexes events and function calls by the "Managed Optimistic Oracle V2" contracts. We reuse the code from `packages/optimistic-oracle-v2` because the events emitted are the same.

- Amoy
  - TheGraph:
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/amoy-managed-optimistic-oracle-v2/1.1.0/gn>
- Polygon
  - TheGraph: <https://api.studio.thegraph.com/query/1057/polygon-managed-optimistic-oracle-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/polygon-managed-optimistic-oracle-v2/1.0.5/gn>

## Financial Contract Events

This subgraph indexes events emitted by the ExpiringMultiParty and Perpetual contracts. The code can be found in `packages/financial-contracts`

- Mainnet
  - TheGraph: <https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-contracts>
  - Goldsky:
- (staging) Mainnet
  - TheGraph: <https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-contracts-staging>
  - Goldsky:

## Token Events

This subgraph indexes events emitted by the UMA voting token contracts. The code can be found in `packages/token`

- Mainnet
  - TheGraph: <https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-token>
  - Goldsky:
- (staging) Mainnet
  - TheGraph: <https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-token-staging>
  - Goldsky:

## Voting V2 Events

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/votingV2`

- Mainnet
  - TheGraph: <https://api.studio.thegraph.com/query/1057/mainnet-voting-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/mainnet-voting-v2/0.1.1/gn>
- (testnet) Sepolia
  - TheGraph: <https://api.studio.thegraph.com/query/1057/sepolia-voting-v2/1.2.0>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/sepolia-voting-v2/1.0.0/gn>

## Optimistic Oracle V3 Events

This subgraph indexes events emitted by the "Optimistic Oracle V3" contracts. The code can be found in `packages/optimistic-oracle-v3`

- Mainnet
  - TheGraph: <https://thegraph.com/studio/subgraph/mainnet-optimistic-oracle-v3>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/mainnet-optimistic-oracle-v3/latest/gn>
- Polygon
  - TheGraph: <https://thegraph.com/studio/subgraph/polygon-optimistic-oracle-v3>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/polygon-optimistic-oracle-v3/1/gn>
- Arbitrum
  - TheGraph: <https://thegraph.com/studio/subgraph/arbitrum-optimistic-oracle-v3>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/arbitrum-optimistic-oracle-v3/1/gn>
- Optimism
  - TheGraph: <https://thegraph.com/studio/subgraph/optimism-optimistic-oracle-v3>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/optimism-optimistic-oracle-v3/1/gn>
- Boba
  - TheGraph: <https://thegraph.com/studio/subgraph/boba-optimistic-oracle-v3>
  - Goldsky:
- Avalanche
  - TheGraph: <https://thegraph.com/studio/subgraph/avalanche-optimistic-oracle-v3>
  - Goldsky:
- Gnosis
  - TheGraph: <https://thegraph.com/studio/subgraph/gnosis-optimistic-oracle-v3>
  - Goldsky:
- (staging) Core Testnet
  - TheGraph: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-oracle-v3>
  - Goldsky:
- Core
  - TheGraph: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-oracle-v3>
  - Goldsky:
- (testnet) Sepolia
  - TheGraph:
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/sepolia-optimistic-oracle-v3/1.0.0/gn>
- Base
  - TheGraph: <https://thegraph.com/studio/subgraph/base-optimistic-oracle-v3>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/base-optimistic-oracle-v3/latest/gn>
- (testnet) Base Sepolia
  - TheGraph: <https://thegraph.com/studio/subgraph/base-sepolia-oo-v3>
  - Goldsky:
- Blast
  - TheGraph: <https://thegraph.com/studio/subgraph/blast-optimistic-oracle-v3>
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/blast-goldsky-optimistic-oracle-v3/1/gn>
- Story
  - TheGraph:
  - Goldsky: <https://api.goldsky.com/api/public/project_clus2fndawbcc01w31192938i/subgraphs/story-optimistic-oracle-v3/0.0.1/gn>

## Optimistic Governor Events

This subgraph indexes events emitted by all the Optimistic Governor deployments.

- Mainnet
  - TheGraph: <https://thegraph.com/studio/subgraph/mainnet-optimistic-governor>
- Polygon
  - TheGraph: <https://thegraph.com/studio/subgraph/polygon-optimistic-governor>
- Arbitrum
  - TheGraph: <https://thegraph.com/studio/subgraph/arbitrum-optimistic-governor>
- Optimism
  - TheGraph: <https://thegraph.com/studio/subgraph/optimism-optimistic-governor>
- Avalanche
  - TheGraph: <https://thegraph.com/studio/subgraph/avalanche-optimistic-governor>
- Gnosis
  - TheGraph: <https://thegraph.com/studio/subgraph/gnosis-optimistic-governor>
- (testnet) Goerli
  - TheGraph: <https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-governor>
- (staging) Core Testnet
  - TheGraph: <https://thegraph.test.btcs.network/subgraphs/name/Reinis-FRP/core-testnet-optimistic-governor>
- Core
  - TheGraph: <https://thegraph.coredao.org/subgraphs/name/umaprotocol/core-optimistic-governor>
- Base
  - TheGraph: <https://thegraph.com/studio/subgraph/base-optimistic-governor>
- (testnet) Sepolia
  - TheGraph: <https://thegraph.com/studio/subgraph/sepolia-optimistic-governor>

## Resources

- Really well done subgraph repository: [aragon/connect](https://github.com/aragon/connect/tree/master/packages/connect-thegraph/subgraph)

- Run a local graph node: [graph-node](https://github.com/graphprotocol/graph-node/blob/master/docker/README.md)
