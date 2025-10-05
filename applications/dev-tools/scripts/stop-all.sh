#!/usr/bin/env bash

###############################################################################
# Stop all running Liquid Liberty services
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_FILE="$SCRIPT_DIR/.running_services.pid"

log() {
    local color=$2
    case $color in
        red) echo -e "${RED}$1${NC}" ;;
        green) echo -e "${GREEN}$1${NC}" ;;
        yellow) echo -e "${YELLOW}$1${NC}" ;;
        *) echo "$1" ;;
    esac
}

main() {
    log "🛑 Stopping all Liquid Liberty services..." yellow

    local stopped=0

    # Stop services from PID file
    if [ -f "$PID_FILE" ]; then
        while IFS=: read -r pid name; do
            if kill -0 $pid 2>/dev/null; then
                log "  Stopping $name (PID: $pid)..." yellow
                kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
                ((stopped++))
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    fi

    # Also kill any processes on known ports
    local ports=(5173 8545 8888 3000)
    for port in "${ports[@]}"; do
        if lsof -ti :$port >/dev/null 2>&1; then
            log "  Stopping service on port $port..." yellow
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
            ((stopped++))
        fi
    done

    if [ $stopped -gt 0 ]; then
        log "\n✅ Stopped $stopped service(s)" green
    else
        log "\nℹ No running services found" yellow
    fi

    # Clean up log files
    rm -f /tmp/ll-*.log 2>/dev/null || true

    log "✅ All services stopped and cleaned up" green
}

main "$@"
