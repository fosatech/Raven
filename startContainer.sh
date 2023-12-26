#!/bin/bash

set -x

echo "Building Docker container..."

docker build -t sweep .

echo "Starting Docker container..."
docker compose run --publish 5000:5000 stk_sweep