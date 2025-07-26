#!/bin/bash
# Production Startup Script
# /Users/jakespringer/Desktop/Replytics Website/scripts/start-production.sh

set -euo pipefail

echo "🚀 Starting Replytics Production Environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Validate environment configuration
print_status "Validating environment configuration..."
if [ ! -f .env.production ]; then
    print_error ".env.production file not found"
fi

# Source environment variables for validation
set -a
source .env.production
set +a

# Validate required environment variables
required_vars=(
    "DATABASE_URL" 
    "REDIS_URL" 
    "NEXTAUTH_SECRET" 
    "NEXTAUTH_URL"
    "NEXT_PUBLIC_API_URL"
    "VOICE_BOT_DATABASE_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
        print_error "Required environment variable $var is not set"
    fi
done

print_success "Environment validation passed"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl config voice-bot-logs voice-bot-data

# Generate SSL certificates if not present
if [ ! -f ssl/replytics.crt ] || [ ! -f ssl/replytics.key ]; then
    print_status "Generating SSL certificates..."
    if [ -f scripts/generate-ssl.sh ]; then
        ./scripts/generate-ssl.sh
    else
        print_warning "SSL certificate generator not found. Creating self-signed certificates..."
        openssl req -x509 -newkey rsa:4096 -keyout ssl/replytics.key -out ssl/replytics.crt -days 365 -nodes \
            -subj "/C=US/ST=CA/L=San Francisco/O=Replytics/CN=localhost"
        chmod 600 ssl/replytics.key
    fi
    print_success "SSL certificates ready"
fi

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.production.yml pull --quiet

# Build custom images
print_status "Building application images..."
docker-compose -f docker-compose.production.yml build --parallel

# Perform pre-deployment checks
print_status "Performing pre-deployment checks..."

# Check if ports are available
check_port() {
    if netstat -tuln | grep -q ":$1 "; then
        print_warning "Port $1 is already in use"
        return 1
    fi
    return 0
}

ports_to_check=(80 443 3000 8000 9090 3001)
for port in "${ports_to_check[@]}"; do
    if ! check_port $port; then
        print_error "Port $port is already in use. Please stop conflicting services."
    fi
done

# Check disk space (require at least 5GB free)
available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available_space" -lt 5 ]; then
    print_error "Insufficient disk space. At least 5GB required, only ${available_space}GB available."
fi

print_success "Pre-deployment checks passed"

# Start services with zero-downtime deployment strategy
print_status "Starting production services..."

# Start infrastructure services first
docker-compose -f docker-compose.production.yml up -d --remove-orphans \
    duckling prometheus grafana

# Wait for infrastructure to be healthy
print_status "Waiting for infrastructure services to be healthy..."
./scripts/wait-for-health.sh duckling prometheus grafana

# Start application services
docker-compose -f docker-compose.production.yml up -d \
    backend frontend nginx

# Wait for all services to be healthy
print_status "Waiting for application services to be healthy..."
./scripts/wait-for-health.sh backend frontend nginx

# Verify deployment
print_status "Verifying deployment..."
sleep 10

# Test endpoints
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        print_success "✅ $url is responding correctly"
        return 0
    else
        print_error "❌ $url is not responding correctly"
        return 1
    fi
}

# Test main application endpoints
test_endpoint "http://localhost/api/health"
test_endpoint "http://localhost:8000/health"
test_endpoint "http://localhost:9090/-/healthy"

print_success "🎉 Production deployment complete!"

echo ""
echo "📊 Service URLs:"
echo "  Frontend (HTTPS): https://localhost"
echo "  Frontend (HTTP):  http://localhost"
echo "  Backend API:      http://localhost:8000"
echo "  Monitoring:       http://localhost:3001 (admin/\$GRAFANA_ADMIN_PASSWORD)"
echo "  Metrics:          http://localhost:9090"
echo ""

print_status "Deployment summary:"
docker-compose -f docker-compose.production.yml ps

print_status "To view logs: docker-compose -f docker-compose.production.yml logs -f [service]"
print_status "To stop services: docker-compose -f docker-compose.production.yml down"

echo ""
print_success "Replytics is now running in production mode! 🎊"