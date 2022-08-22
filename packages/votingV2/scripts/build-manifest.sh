#!/bin/bash

NETWORK=$1

FILE=$NETWORK'.json'

DATA=manifest/data/$FILE

echo 'Generating manifest from data file: '$DATA
cat $DATA

mustache \
  -p manifest/templates/VotingV2.template.yaml \
  -p manifest/templates/Store.template.yaml \
  $DATA \
  manifest/templates/subgraph.template.yaml > subgraph.yaml