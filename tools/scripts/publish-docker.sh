#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${PUBLISHED_PACKAGES:-}" ]]; then
  echo "PUBLISHED_PACKAGES is empty. Nothing to publish."
  exit 0
fi

if [[ -z "${REPO_OWNER:-}" ]]; then
  echo "REPO_OWNER is required."
  exit 1
fi

OWNER_LC=$(printf '%s' "$REPO_OWNER" | tr '[:upper:]' '[:lower:]')

is_package_released() {
  local package_name="$1"

  jq -e \
    --arg package_name "$package_name" \
    'any(.[]; .name == $package_name)' \
    <<<"$PUBLISHED_PACKAGES" \
    >/dev/null
}

publish_image() {
  local project_name="$1"
  local package_path="$2"
  local image_name="$3"

  local version
  local image_id

  version=$(node -p "require('./${package_path}/package.json').version")
  image_id="ghcr.io/${OWNER_LC}/${image_name}"

  echo
  echo "Publishing ${project_name} ${version}"
  echo "Image: ${image_id}"

  # Build the Nx application output first.
  npx nx build "$project_name"

  # Both Dockerfiles use the monorepo root as their build context.
  docker build \
    --file "${package_path}/Dockerfile" \
    --tag "${image_id}:${version}" \
    --tag "${image_id}:latest" \
    .

  docker push "${image_id}:${version}"
  docker push "${image_id}:latest"

  echo "Successfully published:"
  echo "  ${image_id}:${version}"
  echo "  ${image_id}:latest"
}

if is_package_released "@modb.us/server"; then
  publish_image \
    "server" \
    "apps/server" \
    "modb.us-server"
else
  echo "Server package was not updated. Skipping server image."
fi

if is_package_released "@modb.us/web"; then
  publish_image \
    "web" \
    "apps/web" \
    "modb.us-web"
else
  echo "Web package was not updated. Skipping web image."
fi