#!/bin/bash
# Health Check Wait Script
# /Users/jakespringer/Desktop/Replytics Website/scripts/wait-for-health.sh

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
}

# Configuration
MAX_WAIT_TIME=300  # 5 minutes
CHECK_INTERVAL=5   # 5 seconds
COMPOSE_FILE="docker-compose.production.yml"

# If services are passed as arguments, use them; otherwise check all services
if [ "$#" -eq 0 ]; then
    SERVICES=$(docker-compose -f "$COMPOSE_FILE" config --services)
else
    SERVICES="$@"
fi

print_status "Waiting for services to be healthy: $SERVICES"

# Function to check if a service is healthy
check_service_health() {
    local service=$1
    local container_id
    
    container_id=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || echo "")
    
    if [ -z "$container_id" ]; then
        return 1
    fi
    
    # Check if container is running
    if ! docker inspect "$container_id" --format='{{.State.Status}}' 2>/dev/null | grep -q "running"; then
        return 1
    fi
    
    # Check health status if health check is defined
    local health_status
    health_status=$(docker inspect "$container_id" --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
    
    if [ "$health_status" = "healthy" ]; then
        return 0
    elif [ "$health_status" = "none" ]; then
        # No health check defined, assume healthy if running
        return 0
    else
        return 1
    fi
}

# Function to get service status
get_service_status() {
    local service=$1
    local container_id
    
    container_id=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || echo "")
    
    if [ -z "$container_id" ]; then
        echo "not_found"
        return
    fi
    
    local status
    status=$(docker inspect "$container_id" --format='{{.State.Status}}' 2>/dev/null || echo "unknown")
    
    local health_status
    health_status=$(docker inspect "$container_id" --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
    
    if [ "$health_status" != "none" ]; then
        echo "${status}(${health_status})"
    else
        echo "$status"
    fi
}

# Main waiting loop
start_time=$(date +%s)
all_healthy=false

while [ $all_healthy = false ]; do
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    
    if [ $elapsed_time -gt $MAX_WAIT_TIME ]; then
        print_error "Timeout waiting for services to be healthy after ${MAX_WAIT_TIME} seconds"
        
        print_status "Final service status:"
        for service in $SERVICES; do
            status=$(get_service_status "$service")
            echo "  $service: $status"
        done
        exit 1
    fi
    
    all_healthy=true
    unhealthy_services=""
    
    for service in $SERVICES; do
        if check_service_health "$service"; then
            print_success "$service is healthy"
        else
            all_healthy=false
            status=$(get_service_status "$service")
            unhealthy_services="$unhealthy_services $service($status)"
        fi
    done
    
    if [ $all_healthy = false ]; then
        remaining_time=$((MAX_WAIT_TIME - elapsed_time))
        print_status "Waiting for services:$unhealthy_services (${remaining_time}s remaining)"
        sleep $CHECK_INTERVAL
    fi
done

print_success "All services are healthy! ✨"

# Display final status
print_status "Service health summary:"
for service in $SERVICES; do
    status=$(get_service_status "$service")
    echo "  ✅ $service: $status"
done