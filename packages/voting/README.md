# voting-subgraph
Voting Contract Events Subgraph

# Deploying subgraph

1. Generate code: `yarn codegen`
- In order to make working smart contracts, events and entities easy and type-safe, the Graph CLI can generate AssemblyScript types from the subgraph's GraphQL schema and the contract ABIs included in the data sources.
- This will generate an AssemblyScript class for every smart contract in the ABI files mentioned in `subgraph.yaml`, allowing you to bind these contracts to specific addresses in the mappings and call read-only contract methods against the block being processed. It will also generate a class for every contract event to provide easy access to event parameters as well as the block and transaction the event originated from. 
- In addition to this, one class is generated for each entity type in the subgraph's GraphQL schema. These classes provide type-safe entity loading, read and write access to entity fields as well as a save() method to write entities to store. All entity classes are written to `<OUTPUT_DIR>/schema.ts`, allowing mappings to import them with
- Note: The code generation must be performed again after every change to the GraphQL schema or the ABIs included in the manifest. It must also be performed at least once before building or deploying the subgraph.

2. Build mapping code: `yarn build`
- Code generation does not check your mapping code in `src/mapping.ts`. If you want to check that before trying to deploy your subgraph to the Graph Explorer, you can run yarn build and fix any syntax errors that the TypeScript compiler might find.

3. Deploy: `yarn deploy --key XXX`
- Deploys to subgraph described in the `package.json` script command, requires an API key.
- Learn more [here](https://thegraph.com/docs/deploy-a-subgraph).
# (WIP) Testing:
- Run Ganache on localhost:0.0.0.0 so that it is accessible from within Docker and from other machines. 
By default, Ganache only binds to 127.0.0.1, which can only be accessed from the host machine that Ganache runs on.
- Deploy contracts, simulate multiple voting rounds
- Index using local graph node (see instructions for setup below):
- NOTE: Using ganache for subgraph testing can lead to unexpected consequences. Ganache will take snapshots of the 
blockchain state, and revert the chain to a clean deployment of the contracts while running tests. If your truffle 
tests are set up like this, the graph node will seize, since it is not expecting the blockchain to roll back its state. 
Also, if you keep deploying new instances of your contracts within your tests, the contract addresses will not match 
with the contract address from the deployer, and thus you will not have 1 single address to add to the subgraph.yaml 
manifest. It is recommended for users to fully understand how ganache is running tests, otherwise it will appear the 
graph node is not running handlers.
- Run test script against indexed local node

# Running a local Graph node:
- `git clone https://github.com/graphprotocol/graph-node/`
- `cd graph-node/docker`
- Start a local Graph Node that will connect to Ganache on your host: `docker-compose up`