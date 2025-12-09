#!/bin/bash

# Ward 14 Voting Tracker - Docker Push Script
# This script pushes the Docker image to Docker Hub

set -e

# Configuration
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:-hemangsrr}"
IMAGE_NAME="voting-tracker"
VERSION="${VERSION:-latest}"

echo "=========================================="
echo "Ward 14 Voting Tracker - Docker Push"
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

# Login to Docker Hub
echo ""
echo "Logging in to Docker Hub..."
docker login

# Push the image
echo ""
echo "Pushing image to Docker Hub..."
docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}

# Push latest tag if version is specified
if [ "$VERSION" != "latest" ]; then
    echo ""
    echo "Pushing latest tag..."
    docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
fi

echo ""
echo "=========================================="
echo "✓ Push completed successfully!"
echo "=========================================="
echo ""
echo "Image available at:"
echo "  docker pull ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""
echo "To deploy on DigitalOcean:"
echo "  1. Go to DigitalOcean App Platform"
echo "  2. Create new app from Docker Hub"
echo "  3. Use image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "  4. Set port to 80"
echo "  5. Add environment variables from .env.docker"
echo ""
