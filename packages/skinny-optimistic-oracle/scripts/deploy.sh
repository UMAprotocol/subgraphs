#!/bin/bash
NETWORK=$1
SUBGRAPH_NAME=$NETWORK'-skinny-oo'

SUBGRAPH_NAME=$SUBGRAPH_NAME /bin/bash ../../scripts/deploy.sh
