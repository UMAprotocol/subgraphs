#!/bin/bash

NETWORK=$1
FILE=$NETWORK'.json'
DATA=manifest/data/$FILE

echo "Generating manifest from data file: $DATA"

# If OVERRIDE_CHAIN_ID is set, update the network field in the JSON data on the fly
if [[ -n "$OVERRIDE_CHAIN_ID" ]]; then
  echo "Updating network field to: $OVERRIDE_CHAIN_ID"
  UPDATED_DATA=$(jq --arg newNetwork "$OVERRIDE_CHAIN_ID" '.network = $newNetwork' "$DATA")
else
  UPDATED_DATA=$(cat "$DATA")
fi

# Output the modified JSON data for debugging
echo "$UPDATED_DATA"

# Create a temporary file to store the modified JSON data
TEMP_JSON=$(mktemp)
echo "$UPDATED_DATA" > "$TEMP_JSON"

# Generate subgraph.yaml using mustache with the modified JSON data
mustache \
  -p manifest/templates/OptimisticOracleV2.template.yaml \
  "$TEMP_JSON" \
  manifest/templates/subgraph.template.yaml > subgraph.yaml

# Clean up the temporary file
rm "$TEMP_JSON"