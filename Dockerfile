# Multi-stage Dockerfile for Ward 14 Voting Tracker
# This creates a single container with PostgreSQL, Django backend, and React frontend

FROM node:18-alpine AS frontend-builder

# Build React frontend
WORKDIR /frontend
COPY Frontend/package*.json ./
RUN npm ci --only=production
COPY Frontend/ ./
RUN npm run build

# Main image with all services
FROM python:3.11-slim

# Install system dependencies including PostgreSQL
RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    POSTGRES_USER=voting_admin \
    POSTGRES_PASSWORD=voting_secure_pass \
    POSTGRES_DB=voting_tracker_db

# Create application directory
WORKDIR /app

# Copy backend code
COPY BackEnd/ /app/backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copy built frontend from builder stage
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /var/log/supervisor /var/run/postgresql

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /app/entrypoint.sh

# Make scripts executable
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
