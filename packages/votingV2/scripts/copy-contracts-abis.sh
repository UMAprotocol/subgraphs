#!/bin/bash

echo 'Copying contracts ABI files to subgraph folder'

# create abis folder if it doesn't exist
mkdir -p abis

# Replace [2][] with [] in VotingV2.json to fix a bug in the graph-cli that prevents it from parsing the ABI
# TODO - remove this once the graph-cli is fixed
sed -E 's/\[2\]\[\]/\[\]/g' \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts/oracle/implementation/VotingV2.sol/VotingV2.json > abis/VotingV2.json

cp \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts/oracle/implementation/Store.sol/Store.json \
abis/Store.json

cp \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts/oracle/implementation/VotingToken.sol/VotingToken.json \
abis/VotingToken.json

cp \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts/oracle/implementation/Registry.sol/Registry.json \
abis/Registry.json

cp \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts/oracle/implementation/IdentifierWhitelist.sol/IdentifierWhitelist.json \
abis/IdentifierWhitelist.json

cp \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts/common/implementation/AddressWhitelist.sol/AddressWhitelist.json \
abis/AddressWhitelist.json

cp \
node_modules/@uma/contracts-node/dist/packages/core/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json \
abis/ERC20.json

