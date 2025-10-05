# 🧪 Testing & Docker Infrastructure - Quick Start

## New Features Added

This repository now includes comprehensive testing and Docker infrastructure:

### ✅ What's New

1. **🧪 Complete Testing Suite**
   - E2E tests with Playwright
   - Unit tests with Vitest
   - API integration tests
   - Contract parity tests
   - 66+ new test files

2. **🐳 Full Docker Support**
   - Root-level orchestration (`docker-compose.yml`)
   - Individual app Docker configs
   - Development and production modes
   - Automated health checks

3. **🛠️ Dev Tools Application**
   - One-command setup
   - Automated repo management
   - Service orchestration
   - Health monitoring

4. **📋 Claude AI Rules**
   - Pre-commit checklists
   - Post-commit workflows
   - Code quality enforcement
   - Consistency guidelines

5. **📚 Comprehensive Documentation**
   - 1500+ lines of guides
   - Quick reference sheets
   - Troubleshooting help
   - Best practices

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/Liquid-Liberty/LiquidLibertyAlpha.git
cd LiquidLibertyAlpha

# 2. Run automated setup
cd applications/dev-tools
npm install
npm run setup
```

This will:
- Install all dependencies
- Create .env files
- Validate system requirements
- Setup everything for development

### Start Development Environment

**Option 1: Using Docker (Recommended)**
```bash
# Start all backend services
docker-compose up
```

**Option 2: Using Dev Tools**
```bash
# Start all services with monitoring
cd applications/dev-tools
npm run start
```

This starts:
- Hardhat Node (localhost:8545)
- PostgreSQL Database
- SubQuery Indexer (localhost:3000)
- API Functions (localhost:8888)
- Frontend (localhost:5173)

### Run Tests

```bash
# Run all tests
cd applications/platform-integration-tests
npm run test:all

# Run specific test suites
npm test                    # E2E tests
npm run test:api            # API tests
npm run test:parity         # Parity tests
```

### Update Everything

```bash
cd applications/dev-tools
npm run update
```

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| [DOCKER_GUIDE.md](DOCKER_GUIDE.md) | Complete Docker usage guide |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Comprehensive testing guide |
| [TESTING_DOCKER_QUICKREF.md](TESTING_DOCKER_QUICKREF.md) | Quick command reference |
| [COMPLETE_IMPLEMENTATION.md](COMPLETE_IMPLEMENTATION.md) | Full implementation summary |
| [dev-tools/README.md](applications/dev-tools/README.md) | Dev tools usage |

## 🎯 Common Tasks

### Daily Development

```bash
# Update repos
cd applications/dev-tools && npm run update

# Start services
npm run start

# Run tests before committing
cd applications/platform-integration-tests && npm run test:parity
```

### Before Committing

See [claude-pre-commit-rules.md](applications/dev-tools/templates/claude-pre-commit-rules.md)

**Quick checklist:**
- [ ] All tests pass
- [ ] No debug code
- [ ] ESLint passes
- [ ] Documentation updated
- [ ] Parity tests pass

### After Committing

See [claude-post-commit-rules.md](applications/dev-tools/templates/claude-post-commit-rules.md)

**Quick checklist:**
- [ ] Push to remote
- [ ] Monitor CI/CD
- [ ] Update changelog
- [ ] Deploy if needed

## 🏗️ Project Structure

```
LiquidLibertyAlpha/
├── docker-compose.yml              # Main orchestration
├── DOCKER_GUIDE.md                 # Docker guide
├── TESTING_GUIDE.md                # Testing guide
├── TESTING_DOCKER_QUICKREF.md      # Quick reference
├── COMPLETE_IMPLEMENTATION.md      # Implementation summary
│
└── applications/
    ├── liquid-liberty-contracts/   # Smart contracts
    │   ├── Dockerfile
    │   └── docker-compose.yml
    │
    ├── liquid-liberty-api/         # Serverless API
    │   ├── Dockerfile
    │   ├── docker-compose.yml
    │   └── tests/unit/
    │
    ├── liquid-liberty-frontend/    # React DApp
    │   ├── Dockerfile
    │   ├── docker-compose.yml
    │   └── src/tests/
    │
    ├── liquid-liberty-indexer/     # SubQuery indexer
    │   └── docker-compose.yml
    │
    ├── platform-integration-tests/ # E2E & Integration tests
    │   ├── tests/
    │   │   ├── e2e/
    │   │   ├── api/
    │   │   ├── contracts/
    │   │   └── parity/
    │   └── docker-compose.yml
    │
    └── dev-tools/                  # Automation tools
        ├── scripts/
        ├── config/
        └── templates/
            ├── claude-pre-commit-rules.md
            └── claude-post-commit-rules.md
```

## 🔍 Testing Strategy

### Test Types

1. **Unit Tests** - Individual functions (Vitest)
2. **Integration Tests** - API endpoints (SuperTest + Vitest)
3. **E2E Tests** - User workflows (Playwright)
4. **Contract Tests** - Smart contracts (Hardhat + Chai)
5. **Parity Tests** - Monorepo vs applications verification

### Running Tests

```bash
# Frontend unit tests
cd applications/liquid-liberty-frontend
npm test

# API tests
cd applications/liquid-liberty-api
npm test

# Contract tests
cd applications/liquid-liberty-contracts
npm test

# E2E and integration tests
cd applications/platform-integration-tests
npm run test:all

# Parity verification (CRITICAL before deploying)
npm run test:parity
```

## 🐳 Docker Usage

### Start All Services

```bash
# Production mode
docker-compose up

# Development mode (with debug logs)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Background mode
docker-compose up -d
```

### Stop All Services

```bash
docker-compose down

# Remove volumes too
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f hardhat-node
```

### Individual Applications

Each application can run standalone:

```bash
cd applications/liquid-liberty-contracts
docker-compose up
```

## 🛠️ Dev Tools

### Setup Commands

```bash
npm run setup              # Complete setup
npm run setup:repos        # Clone repos only
npm run setup:deps         # Install deps only
npm run setup:env          # Create .env files
```

### Update Commands

```bash
npm run update             # Update everything
npm run update:repos       # Pull latest changes
npm run update:deps        # Update packages
```

### Runtime Commands

```bash
npm run start              # Start all services
npm run start:backend      # Backend only
npm run start:frontend     # Frontend only
npm run stop               # Stop all
npm run status             # Check status
```

### Maintenance Commands

```bash
npm run validate           # Validate setup
npm run doctor             # Diagnose issues
npm run clean              # Clean artifacts
```

## 📊 Service URLs

When running locally:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React DApp |
| API | http://localhost:8888 | Netlify Functions |
| Hardhat | http://localhost:8545 | Local blockchain |
| GraphQL | http://localhost:3000 | SubQuery playground |
| PostgreSQL | localhost:5432 | Database |

## 🎯 Parity Testing (CRITICAL)

**Why it matters:** Ensures monorepo and applications folder behave identically.

**Before any deployment:**

```bash
cd applications/platform-integration-tests
npm run test:parity
```

This verifies:
- ✅ Contract addresses match
- ✅ Contract bytecode identical
- ✅ API responses identical
- ✅ Indexer data synchronized
- ✅ Frontend behavior consistent

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :8545  # Find process
kill -9 <PID>  # Kill it
```

**Docker won't start:**
```bash
docker-compose down -v
docker-compose up --build
```

**Tests failing:**
```bash
cd applications/dev-tools
npm run clean
npm run setup:deps
```

**See full troubleshooting guide:** [DOCKER_GUIDE.md](DOCKER_GUIDE.md#troubleshooting)

## 📈 CI/CD Integration

GitHub Actions example:

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd applications/platform-integration-tests && npm ci
      - run: npx playwright install
      - run: npm test
```

## 🤝 Contributing

1. Follow pre-commit rules: [claude-pre-commit-rules.md](applications/dev-tools/templates/claude-pre-commit-rules.md)
2. Run tests before committing
3. Ensure parity tests pass
4. Follow post-commit workflow: [claude-post-commit-rules.md](applications/dev-tools/templates/claude-post-commit-rules.md)

## 📄 License

MIT License

---

**For detailed documentation, see:**
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Complete Docker guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Complete testing guide
- [TESTING_DOCKER_QUICKREF.md](TESTING_DOCKER_QUICKREF.md) - Quick reference
- [COMPLETE_IMPLEMENTATION.md](COMPLETE_IMPLEMENTATION.md) - Full implementation details
