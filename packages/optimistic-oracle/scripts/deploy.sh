#!/bin/bash
export $(cat .env)

NETWORK=$1
SUBGRAPH_NAME=$NETWORK'-oo'

if [[ "$STAGING" && -z "${STAGING_NAMESPACE}" ]]; then
  echo >&2 "STAGING_NAMESPACE not defined in .env. This should be the github username for the staging namespace"
  exit 1
fi

if [ "$STAGING" ] && [ "$NETWORK" != "mainnet" ]; then
  SUBGRAPH_NAME=$SUBGRAPH_NAME-staging
fi
if [ "$STAGING" ]; then
  NAMESPACE=$STAGING_NAMESPACE
else
  NAMESPACE="umaprotocol"
fi

echo 'Loading graph access token from .env'

if [ "$STAGING" ]; then
  API_KEY=$STAGING_KEY
else
  API_KEY=$PROD_KEY
fi

# Require $GRAPHKEY to be set
if [[ -z "${API_KEY}" ]]; then
  echo >&2 "PROD_KEY not defined in .env. This should be the access token for the $NAMESPACE graph namespace"
  exit 1
fi

echo "$NAMESPACE/$SUBGRAPH_NAME"
yarn graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ $NAMESPACE/$SUBGRAPH_NAME --access-token $API_KEY
