# UMA related subgraphs

## Install dependencies

`yarn`

## Voting Events:

This subgraph indexes events emitted by the core Oracle contracts. The code can be found in `packages/voting`

- Kovan: https://thegraph.com/explorer/subgraph/umaprotocol/kovan-voting
- Mainnet: https://thegraph.com/explorer/subgraph/umaprotocol/mainnet-voting
- (staging) Kovan: https://thegraph.com/explorer/subgraph/nicholaspai/kovan-voting-staging
- (staging) Mainnet: https://thegraph.com/explorer/subgraph/nicholaspai/mainnet-voting-staging

## Skinny Optimistic Oracle Events::

This subgraph indexes events emitted by the "Skinny Optimistic Oracle" contracts. The code can be found in `packages/skinny-optimistic-oracle`

- Mainnet: https://thegraph.com/hosted-service/subgraph/umaprotocol/mainnet-skinny-oo

## Optimistic Oracle Events:

This subgraph indexes events emitted by the "Optimistic Oracle" contracts. The code can be found in `packages/optimistic-oracle`

- Mainnet: https://thegraph.com/hosted-service/subgraph/umaprotocol/mainnet-optimistic-oracle
- Polygon: https://thegraph.com/hosted-service/subgraph/umaprotocol/polygon-optimistic-oracle
- Arbitrum: https://thegraph.com/hosted-service/subgraph/umaprotocol/arbitrum-optimistic-oracle
- Optimism: https://thegraph.com/hosted-service/subgraph/umaprotocol/optimism-optimistic-oracle
- Boba: https://thegraph.com/hosted-service/subgraph/umaprotocol/boba-optimistic-oracle
- (staging) Goerli: https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle

## Optimistic Oracle V2 Events and Calls:

This subgraph indexes events and function calls by the "Optimistic Oracle V2" contracts. The code can be found in `packages/optimistic-oracle-v2`

**Note:** L2 chains does not support `callHandlers`. This means we cannot use callHandlers to index the `setBond`, `setCustomLiveness`, and `setEventBased` function calls. These properties are also not available via events. Our compromise here is that in the case of L2 chains, we read this data from the contract state in the event handler instead. **This workaround works when `setCustomLiveness` and `setEventBased` are called in the same transaction as `requestPrice`. So it doesn't work for all cases. Ideally we should have `callHandlers` in the chains that support this.** We therefore must also remove the call handlers from the subgraph.yaml file for Polygon. See `scripts/remove-call-handlers.js` for implementation.

- Mainnet: https://thegraph.com/hosted-service/subgraph/umaprotocol/mainnet-optimistic-oracle-v2
- Polygon: https://thegraph.com/hosted-service/subgraph/umaprotocol/polygon-optimistic-oracle-v2
- Arbitrum: https://thegraph.com/hosted-service/subgraph/umaprotocol/arbitrum-optimistic-oracle-v2
- Optimism: https://thegraph.com/hosted-service/subgraph/umaprotocol/optimism-optimistic-oracle-v2
- Boba: https://thegraph.com/hosted-service/subgraph/umaprotocol/boba-optimistic-oracle-v2
- (staging) Goerli: https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle-v2

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

- Mainnet: https://thegraph.com/hosted-service/subgraph/umaprotocol/mainnet-voting-v2
- Goerli: https://thegraph.com/hosted-service/subgraph/md0x/goerli-voting-v2

## Optimistic Oracle V3 Events:

This subgraph indexes events emitted by the "Optimistic Oracle V3" contracts. The code can be found in `packages/optimistic-oracle-v3`

- Mainnet: https://thegraph.com/hosted-service/subgraph/umaprotocol/mainnet-optimistic-oracle-v3
- Polygon: https://thegraph.com/hosted-service/subgraph/umaprotocol/polygon-optimistic-oracle-v3
- Arbitrum: https://thegraph.com/hosted-service/subgraph/umaprotocol/arbitrum-optimistic-oracle-v3
- Optimism: https://thegraph.com/hosted-service/subgraph/umaprotocol/optimism-optimistic-oracle-v3
- Boba: https://thegraph.com/hosted-service/subgraph/umaprotocol/boba-optimistic-oracle-v3
- (staging) Goerli: https://thegraph.com/hosted-service/subgraph/md0x/goerli-optimistic-oracle-v3

## Resources

- Really well done subgraph repository: [aragon/connect](https://github.com/aragon/connect/tree/master/packages/connect-thegraph/subgraph)

- Run a local graph node: [graph-node](https://github.com/graphprotocol/graph-node/blob/master/docker/README.md)
