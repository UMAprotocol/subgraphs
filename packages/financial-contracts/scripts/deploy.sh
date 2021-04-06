#!/bin/bash

NETWORK=$1
SUBGRAPH_NAME=$NETWORK'-contracts'
if [ "$STAGING" ]; then
  SUBGRAPH_NAME=$SUBGRAPH_NAME-staging
fi
if [ "$STAGING" ]; then
  NAMESPACE="nicholaspai"
else 
  NAMESPACE="umaprotocol"
fi

echo 'Loading graph access token from .env'
export $(cat .env)
if [ "$STAGING" ]; then
  API_KEY=$STAGING_KEY
else 
  API_KEY=$PROD_KEY
fi

# Require $GRAPHKEY to be set
if [[ -z "${API_KEY}" ]]; then
>&2 echo "PROD_KEY not defined in .env. This should be the access token for the $NAMESPACE graph namespace"
exit 1
fi

graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ $NAMESPACE/$SUBGRAPH_NAME --access-token $API_KEY