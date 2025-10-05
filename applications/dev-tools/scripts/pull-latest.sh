#!/usr/bin/env bash

###############################################################################
# Pull latest changes from all repositories
# Updates all applications to latest main/master branch
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null
}

has_uncommitted_changes() {
    if [ -n "$(git status --porcelain)" ]; then
        return 0
    else
        return 1
    fi
}

pull_repository() {
    local dir=$1
    local name=$2

    log "\n📦 Updating $name..." cyan

    cd "$dir"

    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        log "  ⚠ Not a git repository, skipping" yellow
        return 1
    fi

    local branch=$(get_current_branch)
    log "  Current branch: $branch" blue

    # Check for uncommitted changes
    if has_uncommitted_changes; then
        log "  ⚠ Uncommitted changes detected" yellow
        log "  Stashing changes..." yellow
        git stash
    fi

    # Pull latest changes
    log "  Pulling latest changes..." blue
    if git pull origin "$branch"; then
        log "  ✓ Updated successfully" green
    else
        log "  ✗ Failed to pull" red
        return 1
    fi

    # Check for stashed changes
    if git stash list | grep -q "stash@"; then
        log "  ℹ You have stashed changes. Apply with: git stash pop" cyan
    fi

    return 0
}

main() {
    log "🔄 Updating All Repositories" cyan
    log "============================\n" cyan

    local repos=(
        "$ROOT_DIR:Root"
        "$ROOT_DIR/applications/liquid-liberty-contracts:Contracts"
        "$ROOT_DIR/applications/liquid-liberty-api:API"
        "$ROOT_DIR/applications/liquid-liberty-frontend:Frontend"
        "$ROOT_DIR/applications/liquid-liberty-indexer:Indexer"
        "$ROOT_DIR/applications/platform-integration-tests:Integration Tests"
    )

    local success_count=0
    local skip_count=0

    for repo_info in "${repos[@]}"; do
        IFS=: read -r path name <<< "$repo_info"

        if [ -d "$path" ]; then
            if pull_repository "$path" "$name"; then
                ((success_count++))
            fi
        else
            log "\n⚠ $name not found at $path" yellow
            ((skip_count++))
        fi
    done

    log "\n================================================" cyan
    log "\n✅ Update Summary:" green
    log "  Updated: $success_count repositories" green
    if [ $skip_count -gt 0 ]; then
        log "  Skipped: $skip_count repositories" yellow
    fi

    log "\n📦 Next steps:" cyan
    log "  1. Review changes: git log" blue
    log "  2. Update dependencies: ./scripts/update-deps.sh" blue
    log "  3. Run tests: cd ../platform-integration-tests && npm test" blue
}

main "$@"
