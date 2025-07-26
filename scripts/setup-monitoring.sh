#!/bin/bash

# Replytics Voice-Bot Integration - Monitoring Setup Script
# Comprehensive monitoring stack deployment for production environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
CONFIG_DIR="$PROJECT_ROOT/config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    log "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    log "Checking Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    success "Docker Compose is available"
}

# Create monitoring directory structure
create_directories() {
    log "Creating monitoring directory structure..."
    
    mkdir -p "$MONITORING_DIR"/{prometheus,grafana,alertmanager,data}
    mkdir -p "$MONITORING_DIR/prometheus"/{data,rules}
    mkdir -p "$MONITORING_DIR/grafana"/{data,dashboards,provisioning/{dashboards,datasources}}
    mkdir -p "$MONITORING_DIR/alertmanager"/{data,templates}
    
    success "Directory structure created"
}

# Generate Docker Compose configuration
generate_docker_compose() {
    log "Generating Docker Compose configuration..."
    
    cat > "$MONITORING_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

networks:
  monitoring:
    driver: bridge
  app-network:
    external: true

volumes:
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  alertmanager_data:
    driver: local

services:
  # Prometheus - Metrics collection and storage
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: replytics-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.retention.size=10GB'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
      - '--log.level=info'
    networks:
      - monitoring
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Grafana - Visualization and dashboards
  grafana:
    image: grafana/grafana:10.0.0
    container_name: replytics-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
      - GF_SERVER_DOMAIN=grafana.replytics.local
      - GF_SERVER_ROOT_URL=http://grafana.replytics.local:3001
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=smtp.gmail.com:587
      - GF_SMTP_USER=alerts@replytics.com
      - GF_SMTP_PASSWORD=your-app-password
      - GF_SMTP_FROM_ADDRESS=alerts@replytics.com
      - GF_ALERTING_ENABLED=true
    networks:
      - monitoring
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Alertmanager - Alert routing and notifications
  alertmanager:
    image: prom/alertmanager:v0.25.0
    container_name: replytics-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - ./alertmanager/templates:/etc/alertmanager/templates:ro
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
      - '--log.level=info'
    networks:
      - monitoring
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Node Exporter - System metrics
  node-exporter:
    image: prom/node-exporter:v1.6.0
    container_name: replytics-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring
    restart: unless-stopped

  # cAdvisor - Container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.0
    container_name: replytics-cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - monitoring
    restart: unless-stopped

  # Redis Exporter - Cache metrics
  redis-exporter:
    image: oliver006/redis_exporter:v1.51.0
    container_name: replytics-redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://host.docker.internal:6379
    networks:
      - monitoring
    restart: unless-stopped

  # Postgres Exporter - Database metrics
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.12.0
    container_name: replytics-postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://username:password@host.docker.internal:5432/database?sslmode=disable
    networks:
      - monitoring
    restart: unless-stopped

  # Blackbox Exporter - Endpoint monitoring
  blackbox-exporter:
    image: prom/blackbox-exporter:v0.24.0
    container_name: replytics-blackbox-exporter
    ports:
      - "9115:9115"
    volumes:
      - ./blackbox/blackbox.yml:/etc/blackbox_exporter/config.yml:ro
    networks:
      - monitoring
    restart: unless-stopped
EOF

    success "Docker Compose configuration generated"
}

# Copy configuration files
copy_configurations() {
    log "Copying configuration files..."
    
    # Copy Prometheus configuration
    cp "$CONFIG_DIR/prometheus.yml" "$MONITORING_DIR/prometheus/"
    cp "$CONFIG_DIR/alert_rules.yml" "$MONITORING_DIR/prometheus/rules/"
    
    # Copy Alertmanager configuration
    cp "$CONFIG_DIR/alertmanager.yml" "$MONITORING_DIR/alertmanager/"
    
    # Copy Grafana configurations
    cp -r "$CONFIG_DIR/grafana/dashboards/"* "$MONITORING_DIR/grafana/dashboards/"
    
    success "Configuration files copied"
}

# Generate Grafana provisioning configurations
generate_grafana_config() {
    log "Generating Grafana provisioning configurations..."
    
    # Datasource configuration
    cat > "$MONITORING_DIR/grafana/provisioning/datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
      queryTimeout: 60s
      httpMethod: POST
EOF

    # Dashboard configuration
    cat > "$MONITORING_DIR/grafana/provisioning/dashboards/dashboards.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'Replytics Dashboards'
    orgId: 1
    folder: 'Replytics'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    success "Grafana provisioning configurations generated"
}

# Generate Blackbox Exporter configuration
generate_blackbox_config() {
    log "Generating Blackbox Exporter configuration..."
    
    mkdir -p "$MONITORING_DIR/blackbox"
    
    cat > "$MONITORING_DIR/blackbox/blackbox.yml" << 'EOF'
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []  # Defaults to 2xx
      method: GET
      headers:
        User-Agent: "Replytics-Blackbox-Exporter"
      no_follow_redirects: false
      fail_if_ssl: false
      fail_if_not_ssl: false
      tls_config:
        insecure_skip_verify: false
      preferred_ip_protocol: "ip4"

  http_post_2xx:
    prober: http
    timeout: 5s
    http:
      method: POST
      headers:
        Content-Type: application/json
      body: '{"health": "check"}'

  tcp_connect:
    prober: tcp
    timeout: 5s
    tcp:
      preferred_ip_protocol: "ip4"

  icmp:
    prober: icmp
    timeout: 5s
    icmp:
      preferred_ip_protocol: "ip4"
EOF

    success "Blackbox Exporter configuration generated"
}

# Start monitoring stack
start_monitoring() {
    log "Starting monitoring stack..."
    
    cd "$MONITORING_DIR"
    
    # Create external network if it doesn't exist
    docker network create app-network 2>/dev/null || true
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    success "Monitoring stack started successfully"
}

# Check service health
check_service_health() {
    log "Checking service health..."
    
    services=("prometheus:9090" "grafana:3000" "alertmanager:9093")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -s -f "http://localhost:$port" > /dev/null; then
            success "$name is healthy"
        else
            warning "$name may not be fully ready yet"
        fi
    done
}

# Generate environment-specific configurations
generate_env_configs() {
    log "Generating environment-specific configurations..."
    
    # Create .env file for monitoring
    cat > "$MONITORING_DIR/.env" << EOF
# Replytics Monitoring Environment Configuration
COMPOSE_PROJECT_NAME=replytics-monitoring
PROMETHEUS_RETENTION_TIME=30d
PROMETHEUS_RETENTION_SIZE=10GB
GRAFANA_ADMIN_PASSWORD=admin123
ALERTMANAGER_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
POSTGRES_CONNECTION_STRING=postgresql://username:password@host.docker.internal:5432/database?sslmode=disable
REDIS_CONNECTION_STRING=redis://host.docker.internal:6379
EOF

    success "Environment configurations generated"
}

# Setup monitoring for existing application
setup_app_monitoring() {
    log "Setting up application monitoring integration..."
    
    # Check if metrics endpoint exists
    if [ -f "$PROJECT_ROOT/app/api/metrics/route.ts" ]; then
        warning "Metrics endpoint already exists - skipping creation"
    else
        log "Creating metrics API endpoint..."
        mkdir -p "$PROJECT_ROOT/app/api/metrics"
        
        cat > "$PROJECT_ROOT/app/api/metrics/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/lib/monitoring/metrics-collector';

export async function GET(request: NextRequest) {
  try {
    const metrics = await getMetrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Metrics collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
EOF
        success "Metrics API endpoint created"
    fi
    
    # Check if health endpoint exists
    if [ -f "$PROJECT_ROOT/app/api/health/route.ts" ]; then
        warning "Health endpoint already exists - skipping creation"
    else
        log "Creating health check API endpoint..."
        mkdir -p "$PROJECT_ROOT/app/api/health"
        
        cat > "$PROJECT_ROOT/app/api/health/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { createHealthCheckMiddleware } from '@/lib/monitoring/health-checker';

const healthCheckHandler = createHealthCheckMiddleware();

export async function GET(request: NextRequest) {
  return new Promise((resolve) => {
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          resolve(NextResponse.json(data, { status: code }));
        }
      })
    };
    
    healthCheckHandler(request, mockRes);
  });
}
EOF
        success "Health check API endpoint created"
    fi
}

# Display access information
display_access_info() {
    log "Monitoring stack setup complete!"
    echo
    echo "Access Information:"
    echo "=================="
    echo -e "${GREEN}Prometheus:${NC}     http://localhost:9090"
    echo -e "${GREEN}Grafana:${NC}        http://localhost:3001 (admin/admin123)"
    echo -e "${GREEN}Alertmanager:${NC}   http://localhost:9093"
    echo -e "${GREEN}Node Exporter:${NC}  http://localhost:9100"
    echo -e "${GREEN}cAdvisor:${NC}       http://localhost:8080"
    echo
    echo "Next Steps:"
    echo "==========="
    echo "1. Configure Slack webhook URL in alertmanager.yml"
    echo "2. Update database connection strings in docker-compose.yml"
    echo "3. Import Grafana dashboards from config/grafana/dashboards/"
    echo "4. Review and adjust alert thresholds in prometheus/rules/alert_rules.yml"
    echo "5. Test alerting by triggering test alerts"
    echo
    echo -e "${YELLOW}Important:${NC} Remember to secure these services in production!"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add any cleanup tasks here
}

# Main execution
main() {
    log "Starting Replytics monitoring setup..."
    
    # Trap for cleanup
    trap cleanup EXIT
    
    # Run setup steps
    check_docker
    check_docker_compose
    create_directories
    generate_docker_compose
    copy_configurations
    generate_grafana_config
    generate_blackbox_config
    generate_env_configs
    setup_app_monitoring
    start_monitoring
    display_access_info
    
    success "Monitoring setup completed successfully!"
}

# Script options
case "${1:-}" in
    "start")
        cd "$MONITORING_DIR" && docker-compose up -d
        ;;
    "stop")
        cd "$MONITORING_DIR" && docker-compose down
        ;;
    "restart")
        cd "$MONITORING_DIR" && docker-compose restart
        ;;
    "logs")
        cd "$MONITORING_DIR" && docker-compose logs -f "${2:-}"
        ;;
    "status")
        cd "$MONITORING_DIR" && docker-compose ps
        ;;
    "clean")
        cd "$MONITORING_DIR" && docker-compose down -v
        rm -rf "$MONITORING_DIR"
        ;;
    *)
        main
        ;;
esac