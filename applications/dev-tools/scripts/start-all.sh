#!/usr/bin/env bash

###############################################################################
# Start all Liquid Liberty applications in the correct order
# Monitors health and provides status updates
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# PID file
PID_FILE="$SCRIPT_DIR/.running_services.pid"

log() {
    local color=$2
    case $color in
        red) echo -e "${RED}$1${NC}" ;;
        green) echo -e "${GREEN}$1${NC}" ;;
        yellow) echo -e "${YELLOW}$1${NC}" ;;
        blue) echo -e "${BLUE}$1${NC}" ;;
        cyan) echo -e "${CYAN}$1${NC}" ;;
        magenta) echo -e "${MAGENTA}$1${NC}" ;;
        *) echo "$1" ;;
    esac
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

wait_for_service() {
    local name=$1
    local port=$2
    local max_attempts=30

    log "  Waiting for $name to start..." yellow

    for ((i=1; i<=max_attempts; i++)); do
        if check_port $port; then
            log "  ✓ $name is ready!" green
            return 0
        fi
        sleep 1
    done

    log "  ⚠ $name health check timeout" yellow
    return 1
}

start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    local color=$5
    local delay=$6

    log "\n🚀 Starting $name..." $color
    log "   Directory: $dir" reset
    log "   Command: $cmd" reset

    # Start service in background
    (cd "$dir" && eval "$cmd" > "/tmp/ll-$name.log" 2>&1 &)
    local pid=$!

    # Save PID
    echo "$pid:$name" >> "$PID_FILE"

    log "   PID: $pid" blue

    # Wait for startup delay
    sleep $delay

    # Check health
    if [ ! -z "$port" ]; then
        wait_for_service "$name" $port
    fi
}

cleanup() {
    log "\n\n🛑 Stopping all services..." yellow

    if [ -f "$PID_FILE" ]; then
        while IFS=: read -r pid name; do
            if kill -0 $pid 2>/dev/null; then
                log "  Stopping $name (PID: $pid)..." yellow
                kill $pid 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    fi

    log "✅ All services stopped" green
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

main() {
    log "🚀 Starting Liquid Liberty Development Environment" cyan
    log "================================================\n" cyan

    # Clean up old PID file
    rm -f "$PID_FILE"

    # Start services in order
    start_service \
        "Hardhat Node" \
        "$ROOT_DIR/applications/marketplace-contracts" \
        "npx hardhat node" \
        8545 \
        cyan \
        3

    start_service \
        "Indexer (Docker)" \
        "$ROOT_DIR/applications/marketplace-indexer" \
        "docker-compose up" \
        3000 \
        magenta \
        10

    start_service \
        "API Functions" \
        "$ROOT_DIR/applications/core-api" \
        "npx netlify dev" \
        8888 \
        yellow \
        5

    start_service \
        "Frontend" \
        "$ROOT_DIR/applications/marketplace-ui" \
        "npm run dev" \
        5173 \
        blue \
        3

    log "\n✅ All services started!" green
    log "\n📊 Service Status:" cyan
    log "  Hardhat Node:  http://localhost:8545" cyan
    log "  API Functions: http://localhost:8888" yellow
    log "  GraphQL:       http://localhost:3000" magenta
    log "  Frontend:      http://localhost:5173" blue

    log "\n📝 Commands:" cyan
    log "  Press Ctrl+C to stop all services" yellow
    log "  View logs: tail -f /tmp/ll-*.log" blue

    log "\n📋 Logs available at:" cyan
    log "  /tmp/ll-Hardhat Node.log"
    log "  /tmp/ll-Indexer (Docker).log"
    log "  /tmp/ll-API Functions.log"
    log "  /tmp/ll-Frontend.log"

    # Wait indefinitely
    log "\nRunning... (Press Ctrl+C to stop)\n" green
    while true; do
        sleep 1
    done
}

main "$@"
