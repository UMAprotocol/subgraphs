# UMA related subgraphs

## Install dependencies

`yarn`

## Voting Events:

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/voting`

- Kovan: https://thegraph.com/explorer/subgraph/umaprotocol/kovan-voting
- Mainnet: https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-voting
- (staging) Kovan: https://thegraph.com/explorer/subgraph/nicholaspai/kovan-voting-staging
- (staging) Mainnet: https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-voting-staging

## Optimistic Oracle Events:

This subgraph indexes events emitted by the "Optimistic Oracle" contracts. The code can be found in `packages/optimistic-oracle`

- (unofficial) Mainnet: https://thegraph.com/hosted-service/subgraph/md0x/mainnet-oo-staging
- (unofficial) Polygon: https://thegraph.com/hosted-service/subgraph/md0x/polygon-oo-staging
- (unofficial) Arbitrum: https://thegraph.com/hosted-service/subgraph/md0x/arbitrum-oo-staging
- (unofficial) Optimism: https://thegraph.com/hosted-service/subgraph/md0x/optimism-oo-staging
- (unofficial) Boba: https://thegraph.com/hosted-service/subgraph/md0x/boba-oo-staging
- (staging) Goerli: https://thegraph.com/hosted-service/subgraph/md0x/goerli-oo-staging

## Optimistic Oracle V2 Events and Calls:

This subgraph indexes events and function calls by the "Optimistic Oracle V2" contracts. The code can be found in `packages/optimistic-oracle-v2`

**Note:** Polygon does not support `callHandlers`. This means we cannot use callHandlers to index the `setBond`, `setCustomLiveness`, and `setEventBased` function calls. These properties are also not available via events. Our compromise here is that in the case of Polygon, we read this data from the contract state in the event handler instead. **This workaround works when `setCustomLiveness` and `setEventBased` are called in the same transaction as `requestPrice`. So it doesn't work for all cases. Ideally we should have `callHandlers` in the chains that support this.**

- (unofficial) Mainnet: https://thegraph.com/hosted-service/subgraph/ryanwolhuter/mainnet-oov2-staging
- (unofficial) Polygon: https://thegraph.com/hosted-service/subgraph/ryanwolhuter/polygon-oov2-staging
- (unofficial) Arbitrum: https://thegraph.com/hosted-service/subgraph/ryanwolhuter/arbitrum-oov2-staging
- (unofficial) Optimism: https://thegraph.com/hosted-service/subgraph/ryanwolhuter/optimism-oov2-staging
- (unofficial) Boba: https://thegraph.com/hosted-service/subgraph/ryanwolhuter/boba-oov2-staging
- (staging) Goerli: https://thegraph.com/hosted-service/subgraph/ryanwolhuter/goerli-oov2-staging


## Financial Contract Events:

This subgraph indexes events emitted by the ExpiringMultiParty and Perpetual contracts. The code can be found in `packages/financial-contracts`

- Kovan: https://thegraph.com/explorer/subgraph/umaprotocol/kovan-contracts
- Mainnet: https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-contracts
- (staging) Kovan: https://thegraph.com/explorer/subgraph/nicholaspai/kovan-contracts-staging
- (staging) Mainnet: https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-contracts-staging

## Token Events:

This subgraph indexes events emitted by the UMA voting token contracts. The code can be found in `packages/token`

- Kovan: https://thegraph.com/explorer/subgraph/umaprotocol/kovan-token
- Mainnet: https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-token
- (staging) Kovan: https://thegraph.com/explorer/subgraph/nicholaspai/kovan-token-staging
- (staging) Mainnet: https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-token-staging

## Voting V2 Events:

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/votingV2`

- Goerli: https://thegraph.com/hosted-service/subgraph/md0x/goerli-votingv2-staging

## Resources

- Really well done subgraph repository: [aragon/connect](https://github.com/aragon/connect/tree/master/packages/connect-thegraph/subgraph)

- Run a local graph node: [graph-node](https://github.com/graphprotocol/graph-node/blob/master/docker/README.md)
