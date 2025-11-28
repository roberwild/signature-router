#!/bin/bash
# Health Check Verification Script for Signature Router
# Author: BMAD DevOps
# Version: 1.0
# Purpose: Verify all Docker Compose services are healthy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}Signature Router - Health Check${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name..."
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e " ${GREEN}✓ HEALTHY${NC}"
        return 0
    elif [ "$http_code" == "000" ]; then
        echo -e " ${RED}✗ UNREACHABLE${NC}"
        return 1
    else
        echo -e " ${RED}✗ UNHEALTHY (Status: $http_code)${NC}"
        return 1
    fi
}

# Function to check Docker container status
check_container_status() {
    local container_name=$1
    
    echo -n "Checking Docker container: $container_name..."
    
    if ! docker inspect "$container_name" &>/dev/null; then
        echo -e " ${RED}✗ NOT FOUND${NC}"
        return 1
    fi
    
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-healthcheck")
    
    if [ "$status" == "healthy" ]; then
        echo -e " ${GREEN}✓ HEALTHY${NC}"
        return 0
    elif [ "$status" == "starting" ]; then
        echo -e " ${YELLOW}⚠ STARTING...${NC}"
        return 1
    elif [ "$status" == "no-healthcheck" ]; then
        # Check if container is running
        running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null)
        if [ "$running" == "true" ]; then
            echo -e " ${GREEN}✓ RUNNING (no healthcheck)${NC}"
            return 0
        else
            echo -e " ${RED}✗ NOT RUNNING${NC}"
            return 1
        fi
    else
        echo -e " ${RED}✗ UNHEALTHY (Status: $status)${NC}"
        return 1
    fi
}

echo -e "${CYAN}1. Docker Container Health Checks${NC}"
echo -e "${CYAN}===================================${NC}"

containers=(
    "signature-router-postgres"
    "signature-router-zookeeper"
    "signature-router-kafka"
    "signature-router-schema-registry"
    "signature-router-vault"
    "signature-router-prometheus"
    "signature-router-grafana"
)

container_healthy=true
for container in "${containers[@]}"; do
    if ! check_container_status "$container"; then
        container_healthy=false
    fi
done

echo ""
echo -e "${CYAN}2. Service HTTP Health Checks${NC}"
echo -e "${CYAN}==============================${NC}"

declare -A services=(
    ["Vault"]="http://localhost:8200/v1/sys/health"
    ["Schema Registry"]="http://localhost:8081/"
    ["Prometheus"]="http://localhost:9090/-/healthy"
    ["Grafana"]="http://localhost:3000/api/health"
)

service_healthy=true
for service_name in "${!services[@]}"; do
    if ! check_service_health "$service_name" "${services[$service_name]}"; then
        service_healthy=false
    fi
done

echo ""
echo -e "${CYAN}3. Optional: Spring Boot Application${NC}"
echo -e "${CYAN}=====================================${NC}"

check_service_health "Spring Boot App" "http://localhost:8080/actuator/health" || true

echo ""
echo -e "${CYAN}======================================${NC}"

if $container_healthy && $service_healthy; then
    echo -e "${GREEN}✓ ALL SERVICES HEALTHY${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME SERVICES UNHEALTHY${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "${YELLOW}  1. Check container logs: docker-compose logs [service-name]${NC}"
    echo -e "${YELLOW}  2. Verify services are running: docker-compose ps${NC}"
    echo -e "${YELLOW}  3. Restart unhealthy services: docker-compose restart [service-name]${NC}"
    echo -e "${YELLOW}  4. Clean restart: docker-compose down -v && docker-compose up -d${NC}"
    exit 1
fi

