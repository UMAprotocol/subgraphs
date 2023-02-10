#!/bin/bash
NETWORK=$1
SUBGRAPH_NAME=$NETWORK'-oov2'

SUBGRAPH_NAME=$SUBGRAPH_NAME /bin/bash ../../scripts/deploy.sh
