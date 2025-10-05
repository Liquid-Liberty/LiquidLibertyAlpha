#!/usr/bin/env bash

###############################################################################
# Docker helper commands for Liquid Liberty
# Quick access to common Docker operations
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

log() {
    local color=$2
    case $color in
        red) echo -e "${RED}$1${NC}" ;;
        green) echo -e "${GREEN}$1${NC}" ;;
        yellow) echo -e "${YELLOW}$1${NC}" ;;
        blue) echo -e "${BLUE}$1${NC}" ;;
        cyan) echo -e "${CYAN}$1${NC}" ;;
        *) echo "$1" ;;
    esac
}

get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    else
        log "❌ Docker Compose not found" red
        exit 1
    fi
}

cmd_start() {
    log "🚀 Starting all services..." green
    cd "$ROOT_DIR"
    $(get_compose_cmd) up -d
    log "✅ Services started" green
}

cmd_stop() {
    log "🛑 Stopping all services..." yellow
    cd "$ROOT_DIR"
    $(get_compose_cmd) down
    log "✅ Services stopped" green
}

cmd_restart() {
    log "🔄 Restarting all services..." cyan
    cd "$ROOT_DIR"
    $(get_compose_cmd) restart
    log "✅ Services restarted" green
}

cmd_logs() {
    local service=$1
    cd "$ROOT_DIR"
    if [ -z "$service" ]; then
        log "📋 Showing all logs (Ctrl+C to exit)..." cyan
        $(get_compose_cmd) logs -f
    else
        log "📋 Showing logs for $service (Ctrl+C to exit)..." cyan
        $(get_compose_cmd) logs -f "$service"
    fi
}

cmd_ps() {
    log "📊 Service Status:" cyan
    cd "$ROOT_DIR"
    $(get_compose_cmd) ps
}

cmd_exec() {
    local service=$1
    shift
    cd "$ROOT_DIR"
    $(get_compose_cmd) exec "$service" "$@"
}

cmd_rebuild() {
    log "🔨 Rebuilding services..." cyan
    cd "$ROOT_DIR"
    $(get_compose_cmd) build --no-cache
    log "✅ Rebuild complete" green
}

cmd_clean() {
    log "🧹 Cleaning up Docker resources..." yellow
    cd "$ROOT_DIR"

    log "  Stopping services..." yellow
    $(get_compose_cmd) down

    log "  Removing volumes..." yellow
    $(get_compose_cmd) down -v

    log "  Pruning unused images..." yellow
    docker image prune -f

    log "✅ Cleanup complete" green
}

cmd_shell() {
    local service=$1
    if [ -z "$service" ]; then
        log "❌ Please specify a service" red
        log "   Available: hardhat-node, api, postgres, subquery-node, graphql-engine" yellow
        exit 1
    fi

    log "🐚 Opening shell in $service..." cyan
    cd "$ROOT_DIR"
    $(get_compose_cmd) exec "$service" sh || $(get_compose_cmd) exec "$service" bash
}

show_usage() {
    log "🐳 Docker Helper Commands" cyan
    log "========================\n" cyan

    log "Usage: $0 <command> [options]\n" blue

    log "Commands:" green
    log "  start              Start all services" reset
    log "  stop               Stop all services" reset
    log "  restart            Restart all services" reset
    log "  logs [service]     View logs (all or specific service)" reset
    log "  ps                 Show service status" reset
    log "  exec <srv> <cmd>   Execute command in service" reset
    log "  shell <service>    Open shell in service" reset
    log "  rebuild            Rebuild all services" reset
    log "  clean              Clean up Docker resources" reset
    log "" reset

    log "Examples:" cyan
    log "  $0 start                    # Start all services" blue
    log "  $0 logs api                 # View API logs" blue
    log "  $0 shell hardhat-node       # Shell into hardhat" blue
    log "  $0 exec postgres psql -U postgres  # Run psql" blue
    log "" reset

    log "Services:" yellow
    log "  hardhat-node      Local blockchain" reset
    log "  api               Netlify functions" reset
    log "  postgres          Database" reset
    log "  subquery-node     Indexer" reset
    log "  graphql-engine    GraphQL API" reset
}

main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi

    local command=$1
    shift

    case $command in
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        logs)
            cmd_logs "$@"
            ;;
        ps|status)
            cmd_ps
            ;;
        exec)
            cmd_exec "$@"
            ;;
        shell|sh)
            cmd_shell "$@"
            ;;
        rebuild)
            cmd_rebuild
            ;;
        clean)
            cmd_clean
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log "❌ Unknown command: $command" red
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
