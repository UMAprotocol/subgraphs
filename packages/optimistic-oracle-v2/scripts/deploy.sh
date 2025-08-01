#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 3 ]]; then
  cat <<EOF
Usage: $0 <network> [variant] [suffix]
Examples:
  $0 mainnet                  -> mainnet-optimistic-oracle-v2
  $0 mainnet managed             -> mainnet-managed-optimistic-oracle-v2
  $0 goerli staging custom    -> goerli-staging-custom
If suffix is omitted it defaults to "optimistic-oracle-v2"
EOF
  exit 1
fi

network=$1
variant=${2:-}                    # optional
suffix=${3:-optimistic-oracle-v2} # default if not provided

# Build subgraph name
if [[ -n "$variant" ]]; then
  subgraph_name="${network}-${variant}-${suffix}"
else
  subgraph_name="${network}-${suffix}"
fi

# Normalize
subgraph_name=$(printf '%s' "$subgraph_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

echo "Deploying subgraph: $subgraph_name"

SUBGRAPH_NAME="$subgraph_name" /bin/bash ../../scripts/deploy.sh