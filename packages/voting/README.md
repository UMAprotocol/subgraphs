# Voting Subgraph

## Deploying the subgraph

- Mainnet: `yarn prepare:mainnet && yarn deploy:mainnet`
- Kovan: `yarn prepare:kovan && yarn deploy:kovan`
- Polygon: `yarn prepare:polygon && yarn deploy:polygon`

## Caveats
- Polygon: The Voting subgraph cannot index any Final Fee data for the approved collateral list because indexing this data requires the Graph Hosted service to be able to detect calls to `setFinalFee` instead of querying the `NewFinalFee` event. This is due to an oversight when initially deploying the `Store` contract and not emitting the collateral currency address that the `NewFinalFee` was applied to. Currently the Polygon network does not support indexing callhandlers. If you try to do so, you may see this error:

```
Failed to start subgraph, code: SubgraphStartFailure, error: expected triggers adapter that matches deployment X with required capabilities: archive, traces: A matching Ethereum network with NodeCapabilities { archive: true, traces: true } was not found.
```

This error means that the network (Polygon in this case) does not support traces, so you cannot deploy a subgraph that relies on `callHandlers` or `blockHandlers` with call filters.