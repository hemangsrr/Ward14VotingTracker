# Ward 14 Voting Tracker - Docker Push Script (Windows PowerShell)
# This script pushes the Docker image to Docker Hub

# Configuration
$DOCKERHUB_USERNAME = if ($env:DOCKERHUB_USERNAME) { $env:DOCKERHUB_USERNAME } else { "your-dockerhub-username" }
$IMAGE_NAME = "voting-tracker"
$VERSION = if ($env:VERSION) { $env:VERSION } else { "latest" }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Ward 14 Voting Tracker - Docker Push" -ForegroundColor Cyan
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

# Login to Docker Hub
Write-Host ""
Write-Host "Logging in to Docker Hub..." -ForegroundColor Yellow
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker login failed!" -ForegroundColor Red
    exit 1
}

# Push the image
Write-Host ""
Write-Host "Pushing image to Docker Hub..." -ForegroundColor Yellow
docker push "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker push failed!" -ForegroundColor Red
    exit 1
}

# Push latest tag if version is specified
if ($VERSION -ne "latest") {
    Write-Host ""
    Write-Host "Pushing latest tag..." -ForegroundColor Yellow
    docker push "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ Push completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image available at:"
Write-Host "  docker pull ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
Write-Host ""
Write-Host "To deploy on DigitalOcean:"
Write-Host "  1. Go to DigitalOcean App Platform"
Write-Host "  2. Create new app from Docker Hub"
Write-Host "  3. Use image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
Write-Host "  4. Set port to 80"
Write-Host "  5. Add environment variables from .env.docker"
Write-Host ""
