# Claude Code Configuration

This directory contains configuration and automation for Claude Code in the Liquid Liberty project.

## 📁 Files

### Configuration
- **[settings.local.json](settings.local.json)** - Local Claude Code settings including permissions and hooks
- **[HOOKS.md](HOOKS.md)** - Documentation for post-session automation hooks

### Scripts
- **[post-session-hooks.sh](post-session-hooks.sh)** - Automated quality checks that run after each session

### Data
- **changelogs/** - Auto-generated session changelogs (git-ignored)

## 🎯 What's Automated

The post-session hooks automatically:

1. **🧹 Cleanup Check** - Analyzes source files for potential unused code
2. **🧪 Test Validation** - Runs test suites across all applications
3. **🔍 Code Linting** - Ensures code follows project standards
4. **📝 Changelog Generation** - Records changes and git statistics

## 🚀 Usage

The hooks run automatically when a Claude Code session ends. To run manually:

```bash
./.claude/post-session-hooks.sh
```

## 📋 Operational Standards

This setup enforces:

- **Code Quality** - ESLint validation on every session
- **Test Coverage** - Automated test execution
- **Change Tracking** - Session-by-session changelog
- **Cleanup Awareness** - Unused code detection

## 🔧 Customization

To modify automation behavior:

1. Edit hook scripts in this directory
2. Update permissions in `settings.local.json`
3. Adjust test commands for your applications

See [HOOKS.md](HOOKS.md) for detailed documentation.
