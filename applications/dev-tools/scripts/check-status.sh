#!/usr/bin/env bash

###############################################################################
# Check status of all Liquid Liberty services
###############################################################################

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local color=$2
    case $color in
        red) echo -e "${RED}$1${NC}" ;;
        green) echo -e "${GREEN}$1${NC}" ;;
        yellow) echo -e "${YELLOW}$1${NC}" ;;
        cyan) echo -e "${CYAN}$1${NC}" ;;
        *) echo "$1" ;;
    esac
}

check_port() {
    local name=$1
    local port=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log "  ✓ $name (port $port): Running" green
        return 0
    else
        log "  ✗ $name (port $port): Not running" red
        return 1
    fi
}

check_url() {
    local name=$1
    local url=$2

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
        log "  ✓ $name: Accessible" green
        return 0
    else
        log "  ✗ $name: Not accessible" red
        return 1
    fi
}

main() {
    log "📊 Liquid Liberty Service Status" cyan
    log "================================\n" cyan

    local running=0
    local total=4

    # Check services
    check_port "Hardhat Node" 8545 && ((running++))
    check_port "API Functions" 8888 && ((running++))
    check_port "GraphQL Engine" 3000 && ((running++))
    check_port "Frontend" 5173 && ((running++))

    log "\n📈 Summary:" cyan
    log "  Running: $running/$total services" $([ $running -eq $total ] && echo green || echo yellow)

    if [ $running -eq $total ]; then
        log "\n✅ All services are running!" green
        log "\n🌐 Service URLs:" cyan
        log "  Frontend:      http://localhost:5173"
        log "  API:           http://localhost:8888"
        log "  Hardhat RPC:   http://localhost:8545"
        log "  GraphQL:       http://localhost:3000"
    elif [ $running -gt 0 ]; then
        log "\n⚠ Some services are not running" yellow
        log "  Start all: ./scripts/start-all.sh" cyan
    else
        log "\n⚠ No services are running" yellow
        log "  Start all: ./scripts/start-all.sh" cyan
    fi
}

main "$@"
