#!/bin/bash
set -e

if [ -z "$PUBLISHED_PACKAGES" ]; then
  echo "PUBLISHED_PACKAGES is empty. Exiting."
  exit 0
fi

IS_SERVER_RELEASED=$(echo "$PUBLISHED_PACKAGES" | jq 'any(.[]; .name == "@modb.us/server")')

if [ "$IS_SERVER_RELEASED" = "true" ]; then
  echo "Server package updated. Building and pushing Docker image..."

  VERSION=$(node -p "require('./apps/server/package.json').version")

  OWNER_LC=$(echo "$REPO_OWNER" | tr '[:upper:]' '[:lower:]')
  IMAGE_ID="ghcr.io/$OWNER_LC/modb.us-server"

  npx nx docker-build server

  docker tag mussonindustrial/modb.us-server:latest "$IMAGE_ID:latest"
  docker tag mussonindustrial/modb.us-server:latest "$IMAGE_ID:$VERSION"

  docker push "$IMAGE_ID:latest"
  docker push "$IMAGE_ID:$VERSION"

  echo "Successfully pushed $IMAGE_ID:$VERSION"
else
  echo "Server package was not updated in this release. Skipping Docker push."
fi