#!/bin/bash
export $(cat ../../.env)

NETWORK=$1
SUBGRAPH_NAME=$SUBGRAPH_NAME

if [[ "$STAGING" && -z "${STAGING_NAMESPACE}" ]]; then
    echo >&2 "STAGING_NAMESPACE not defined in .env. This should be the github username for the staging namespace"
    exit 1
fi

if [ "$STAGING" ]; then
    NAMESPACE=$STAGING_NAMESPACE
else
    NAMESPACE="umaprotocol"
fi

if [ "$STAGING" ]; then
    API_KEY=$STAGING_KEY
else
    API_KEY=$PROD_KEY
fi

# Require $GRAPHKEY to be set
if [[ -z "${API_KEY}" ]]; then
    echo >&2 "STAGING_KEY or PROD_KEY not defined in .env. This should be the access token for the $NAMESPACE graph namespace"
    exit 1
fi

# Graph studio deploy key
DEPLOY_KEY=$DEPLOY_KEY

# Require $DEPLOY_KEY to be set if $STUDIO is set
if [[ "$STUDIO" && -z "${DEPLOY_KEY}" ]]; then
    echo >&2 "DEPLOY_KEY not defined in .env. This should be the deploy key for the graph studio"
    exit 1
fi

# Check if goldsky is installed when using Goldsky indexer.
if [ "$GOLDSKY" ] && ! command -v goldsky >/dev/null 2>&1; then
    echo "Error: goldsky command not available. Install it with: curl https://goldsky.com | sh"
    exit 1
fi

# Default values for GRAPH_NODE and IPFS
GRAPH_NODE="${GRAPH_NODE:-https://api.thegraph.com/deploy/}"
IPFS="${IPFS:-https://api.thegraph.com/ipfs/}"

echo "$NAMESPACE/$SUBGRAPH_NAME"
if [ "$DOCKER" ]; then
    echo "Deploying to local docker node"
    yarn graph create --node http://127.0.0.1:8020 $NAMESPACE/$SUBGRAPH_NAME && yarn graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 $NAMESPACE/$SUBGRAPH_NAME
elif [ "$CREATE" ]; then
    echo "Creating and deploying on graph node"
    yarn graph create --node "$GRAPH_NODE" "$NAMESPACE/$SUBGRAPH_NAME" --access-token "$API_KEY" && yarn graph deploy --node "$GRAPH_NODE" --ipfs "$IPFS" "$NAMESPACE/$SUBGRAPH_NAME" --access-token "$API_KEY"
elif [ "$STUDIO" ]; then
    echo "Deploying on graph studio"
    yarn graph deploy --studio "$SUBGRAPH_NAME" --deploy-key "$DEPLOY_KEY"
elif [ "$GOLDSKY" ]; then
    echo "Deploying $SUBGRAPH_NAME on Goldsky indexer"
    echo "Existing versions:"
    goldsky subgraph list "$SUBGRAPH_NAME" --summary --token "$GOLDSKY_API_KEY"
    echo "Enter the version number"
    read VERSION
    goldsky subgraph deploy "$SUBGRAPH_NAME/$VERSION" --path . --token "$GOLDSKY_API_KEY"
else
    echo "Deploying on graph node"
    yarn graph deploy --node "$GRAPH_NODE" --ipfs "$IPFS" "$NAMESPACE/$SUBGRAPH_NAME" --access-token "$API_KEY"
fi