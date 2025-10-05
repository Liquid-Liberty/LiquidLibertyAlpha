#!/usr/bin/env bash

###############################################################################
# Complete setup script for Liquid Liberty development environment
# Clones repos, installs dependencies, sets up environment files
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
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

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

check_requirements() {
    log "\n📋 Checking system requirements..." cyan

    local all_met=true

    # Check Node.js
    if check_command node; then
        local node_version=$(node --version)
        log "  ✓ Node.js: $node_version" green
    else
        log "  ✗ Node.js: Not found" red
        log "    Install from: https://nodejs.org/" yellow
        all_met=false
    fi

    # Check npm
    if check_command npm; then
        local npm_version=$(npm --version)
        log "  ✓ npm: v$npm_version" green
    else
        log "  ✗ npm: Not found" red
        all_met=false
    fi

    # Check git
    if check_command git; then
        local git_version=$(git --version | cut -d' ' -f3)
        log "  ✓ Git: v$git_version" green
    else
        log "  ✗ Git: Not found" red
        log "    Install from: https://git-scm.com/" yellow
        all_met=false
    fi

    # Check Docker (REQUIRED)
    if check_command docker; then
        local docker_version=$(docker --version | cut -d' ' -f3 | tr -d ',')
        log "  ✓ Docker: v$docker_version" green

        # Check if Docker daemon is running
        if docker ps >/dev/null 2>&1; then
            log "    Docker daemon is running" green
        else
            log "  ⚠ Docker is installed but daemon is not running" yellow
            log "    Start Docker Desktop or run: sudo systemctl start docker" yellow
            all_met=false
        fi
    else
        log "  ✗ Docker: Not found (REQUIRED)" red
        log "" reset
        log "    Docker is required for running backend services." yellow
        log "    Install Docker Desktop:" yellow
        log "" reset
        log "    macOS/Windows:" blue
        log "      Download from: https://www.docker.com/products/docker-desktop" cyan
        log "" reset
        log "    Linux:" blue
        log "      curl -fsSL https://get.docker.com -o get-docker.sh" cyan
        log "      sh get-docker.sh" cyan
        log "" reset
        all_met=false
    fi

    # Check Docker Compose (REQUIRED)
    local has_compose=false

    # Check for docker-compose command
    if check_command docker-compose; then
        local compose_version=$(docker-compose --version | cut -d' ' -f3 | tr -d ',')
        log "  ✓ Docker Compose: v$compose_version" green
        has_compose=true
    # Check for docker compose (v2 syntax)
    elif docker compose version >/dev/null 2>&1; then
        local compose_version=$(docker compose version --short 2>/dev/null || echo "v2+")
        log "  ✓ Docker Compose: $compose_version" green
        has_compose=true
    else
        log "  ✗ Docker Compose: Not found (REQUIRED)" red
        log "" reset
        log "    Docker Compose is required for orchestrating services." yellow
        log "" reset
        log "    If you have Docker Desktop, it includes Compose." blue
        log "    Otherwise install separately:" blue
        log "      https://docs.docker.com/compose/install/" cyan
        log "" reset
        all_met=false
    fi

    if [ "$all_met" = false ]; then
        return 1
    fi
    return 0
}

install_dependencies() {
    log "\n📦 Installing dependencies for all applications..." cyan

    local apps=(
        "applications/liquid-liberty-contracts"
        "applications/liquid-liberty-api"
        "applications/liquid-liberty-frontend"
        "applications/liquid-liberty-indexer"
        "applications/platform-integration-tests"
        "applications/dev-tools"
    )

    for app in "${apps[@]}"; do
        local app_path="$ROOT_DIR/$app"
        local package_json="$app_path/package.json"

        if [ -f "$package_json" ]; then
            log "\n  Installing $app..." blue
            if (cd "$app_path" && npm install --silent); then
                log "  ✓ $app dependencies installed" green
            else
                log "  ✗ Failed to install $app dependencies" red
                return 1
            fi
        else
            log "  - Skipping $app (no package.json)" yellow
        fi
    done

    # Install Playwright browsers
    log "\n  Installing Playwright browsers..." blue
    local test_path="$ROOT_DIR/applications/platform-integration-tests"
    if [ -d "$test_path" ]; then
        (cd "$test_path" && npx playwright install --with-deps > /dev/null 2>&1) || true
        log "  ✓ Playwright browsers installed" green
    fi

    return 0
}

setup_env_files() {
    log "\n🔧 Setting up environment files..." cyan

    local env_configs=(
        "applications/liquid-liberty-contracts"
        "applications/liquid-liberty-api"
        "applications/liquid-liberty-frontend"
        "applications/liquid-liberty-indexer/subgraph/lmkt-subquery"
        "applications/platform-integration-tests"
    )

    for config in "${env_configs[@]}"; do
        local dir="$ROOT_DIR/$config"
        local example="$dir/.env.example"
        local target="$dir/.env"

        if [ -f "$example" ]; then
            if [ ! -f "$target" ]; then
                cp "$example" "$target"
                log "  ✓ Created $config/.env" green
            else
                log "  - $config/.env already exists" yellow
            fi
        fi
    done

    log "\n⚠️  Remember to edit .env files with your configuration!" yellow
}

display_next_steps() {
    log "\n✅ Setup complete!" green
    log "\n📝 Next steps:" cyan
    log "  1. Edit .env files in each application with your configuration" blue
    log "" reset
    log "     Key files to edit:" yellow
    log "       - applications/liquid-liberty-contracts/.env" reset
    log "       - applications/liquid-liberty-api/.env" reset
    log "       - applications/liquid-liberty-frontend/.env" reset
    log "" reset
    log "  2. Start all services using Docker:" blue
    log "     docker-compose up" green
    log "" reset
    log "     Or start individually:" blue
    log "     cd applications/dev-tools && npm run start" green
    log "" reset
    log "  3. Verify services are running:" blue
    log "     npm run status" green
    log "" reset
    log "  4. Run tests:" blue
    log "     cd applications/platform-integration-tests && npm test" green
    log "\n📚 Documentation:" cyan
    log "  - DOCKER_GUIDE.md - Complete Docker guide" blue
    log "  - TESTING_GUIDE.md - Testing guide" blue
    log "  - TESTING_DOCKER_QUICKREF.md - Quick reference" blue
    log "\n🐳 Docker Commands:" cyan
    log "  Start:  docker-compose up" blue
    log "  Stop:   docker-compose down" blue
    log "  Logs:   docker-compose logs -f" blue
    log "  Status: docker ps" blue
}

main() {
    log "🚀 Liquid Liberty Development Environment Setup" cyan
    log "================================================\n" cyan

    # Check requirements
    if ! check_requirements; then
        log "\n❌ Please install missing requirements and try again." red
        exit 1
    fi

    # Install dependencies
    if ! install_dependencies; then
        log "\n❌ Failed to install dependencies." red
        exit 1
    fi

    # Setup environment files
    setup_env_files

    # Display next steps
    display_next_steps
}

main "$@"
