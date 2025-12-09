# Ward 14 Voting Tracker - Docker Build Script (Windows PowerShell)
# This script builds a single Docker image with all components

# Configuration
$DOCKERHUB_USERNAME = if ($env:DOCKERHUB_USERNAME) { $env:DOCKERHUB_USERNAME } else { "your-dockerhub-username" }
$IMAGE_NAME = "voting-tracker"
$VERSION = if ($env:VERSION) { $env:VERSION } else { "latest" }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Ward 14 Voting Tracker - Docker Build" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Hub Username: $DOCKERHUB_USERNAME"
Write-Host "Image Name: $IMAGE_NAME"
Write-Host "Version Tag: $VERSION"
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Build the image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed!" -ForegroundColor Red
    exit 1
}

# Tag as latest if version is specified
if ($VERSION -ne "latest") {
    Write-Host ""
    Write-Host "Tagging image as latest..." -ForegroundColor Yellow
    docker tag "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}" "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ Build completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
Write-Host ""
Write-Host "To test locally:"
Write-Host "  docker run -d -p 80:80 --name voting-tracker ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
Write-Host ""
Write-Host "To push to Docker Hub:"
Write-Host "  .\push-docker.ps1"
Write-Host ""
