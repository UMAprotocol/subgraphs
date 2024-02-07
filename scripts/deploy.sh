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

# Default values for NODE and IPFS
NODE="${NODE:-https://api.thegraph.com/deploy/}"
IPFS="${IPFS:-https://api.thegraph.com/ipfs/}"

echo "$NAMESPACE/$SUBGRAPH_NAME"
if [ "$DOCKER" ]; then
    echo "Deploying to local docker node"
    yarn graph create --node http://127.0.0.1:8020 $NAMESPACE/$SUBGRAPH_NAME && yarn graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 $NAMESPACE/$SUBGRAPH_NAME
else
    if [ "$CREATE" ]; then
        yarn graph create --node "$NODE" "$NAMESPACE/$SUBGRAPH_NAME" --access-token "$API_KEY"
    fi
    yarn graph deploy --node "$NODE" --ipfs "$IPFS" "$NAMESPACE/$SUBGRAPH_NAME" --access-token "$API_KEY"
fi
