# Claude Code Post-Session Hooks

This repository has automated quality checks that run at the end of each Claude Code session to maintain code quality and track changes.

## What Runs Automatically

### 1. 🧹 Cleanup Unused Code
- Scans all TypeScript/JavaScript source files
- Reports number of files analyzed
- Helps identify potential unused code

### 2. 🧪 Run Tests
- Executes test suites in:
  - `applications/liquid-liberty-contracts` (Hardhat tests)
  - `applications/liquid-liberty-frontend` (Vitest tests)
  - `applications/platform-integration-tests` (Playwright/Vitest tests)
- Validates that changes haven't broken existing functionality

### 3. 🔍 Lint Code
- Runs ESLint across the codebase
- Ensures code follows project standards
- Checks for:
  - Unused imports
  - Code style violations
  - React best practices

### 4. 📝 Generate Changelog
- Automatically creates/updates monthly changelog files in `.claude/changelogs/`
- Records:
  - Timestamp of changes
  - Current git branch
  - Git diff statistics
- Format: `.claude/changelogs/YYYY-MM.md`

## Configuration

The hooks are configured in [.claude/settings.local.json](settings.local.json) and execute via [.claude/post-session-hooks.sh](post-session-hooks.sh).

### Hook Settings

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/post-session-hooks.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

## Manual Execution

You can manually run the hooks at any time:

```bash
./.claude/post-session-hooks.sh
```

## Customization

To modify the hooks:

1. Edit [.claude/post-session-hooks.sh](post-session-hooks.sh)
2. Adjust test commands, timeouts, or add new checks
3. The script will automatically run on session end

## Changelog Location

Session changelogs are stored in:
```
.claude/changelogs/
├── 2025-01.md
├── 2025-02.md
└── ...
```

Each entry includes:
- Timestamp
- Branch name
- Files changed
- Line additions/deletions
