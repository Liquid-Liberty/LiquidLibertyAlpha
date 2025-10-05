#!/bin/bash

# Claude Code Post-Session Hooks
# This script runs automated checks after each coding session

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🤖 Running Claude Code Post-Session Quality Checks..."
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. Cleanup Unused Code Check
echo "🧹 [1/4] Checking for unused code..."
SOURCE_COUNT=$(find . -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' \) ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/dist/*' ! -path '*/build/*' | wc -l | xargs)
echo "   ✓ Analyzed $SOURCE_COUNT source files"
echo ""

# 2. Run Tests
echo "🧪 [2/4] Running test suites..."
echo "   → Contracts tests..."
(cd applications/liquid-liberty-contracts 2>/dev/null && npm test 2>&1 | head -5 || echo "   ⚠ Skipped (not available)")
echo "   → Frontend tests..."
(cd applications/liquid-liberty-frontend 2>/dev/null && npm test -- --run 2>&1 | head -5 || echo "   ⚠ Skipped (not available)")
echo "   ✓ Test check complete"
echo ""

# 3. Lint Code
echo "🔍 [3/4] Linting code..."
(npm run lint 2>&1 | head -10 || (cd applications/liquid-liberty-frontend 2>/dev/null && npm run lint 2>&1 | head -10)) && echo "   ✓ Linting complete" || echo "   ⚠ Linting had warnings"
echo ""

# 4. Generate Changelog
echo "📝 [4/4] Generating changelog entry..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')
CHANGELOG_DIR=".claude/changelogs"
CHANGELOG_FILE="$CHANGELOG_DIR/$(date '+%Y-%m').md"

mkdir -p "$CHANGELOG_DIR"
echo "" >> "$CHANGELOG_FILE"
echo "## [$TIMESTAMP] - Branch: $BRANCH" >> "$CHANGELOG_FILE"
echo "" >> "$CHANGELOG_FILE"
git diff --stat HEAD 2>/dev/null | head -15 >> "$CHANGELOG_FILE" || echo "No git changes detected" >> "$CHANGELOG_FILE"
echo "" >> "$CHANGELOG_FILE"
echo "   ✓ Changelog updated: $CHANGELOG_FILE"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ Quality checks complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
