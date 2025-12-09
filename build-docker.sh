#!/bin/bash

# Ward 14 Voting Tracker - Docker Build Script
# This script builds a single Docker image with all components

set -e

# Configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-your-dockerhub-username}"
IMAGE_NAME="voting-tracker"
VERSION="${VERSION:-latest}"

echo "=========================================="
echo "Ward 14 Voting Tracker - Docker Build"
echo "=========================================="
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Image Name: $IMAGE_NAME"
echo "Version Tag: $VERSION"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Build the image
echo ""
echo "Building Docker image..."
docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION} .

# Tag as latest if version is specified
if [ "$VERSION" != "latest" ]; then
    echo ""
    echo "Tagging image as latest..."
    docker tag ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION} ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
fi

echo ""
echo "=========================================="
echo "✓ Build completed successfully!"
echo "=========================================="
echo ""
echo "Image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""
echo "To test locally:"
echo "  docker run -d -p 80:80 --name voting-tracker ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""
echo "To push to Docker Hub:"
echo "  ./push-docker.sh"
echo ""
