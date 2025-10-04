# 🚀 Quick Reference - Testing & Docker

One-page cheat sheet for common commands.

## 🐳 Docker Commands

### Start/Stop Services
```bash
# Start all backend services
docker-compose up

# Start in background
docker-compose up -d

# Start with dev overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart specific service
docker-compose restart api
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f hardhat-node
docker-compose logs -f api
docker-compose logs -f subquery-node
docker-compose logs -f graphql-engine
```

### Service Status
```bash
# Check all containers
docker ps

# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Inspect network
docker network inspect liquidlibertyalpha_liquid-liberty
```

### Execute Commands in Containers
```bash
# Hardhat
docker exec -it ll-hardhat sh
docker exec ll-hardhat npx hardhat run scripts/deploy.js --network localhost

# API
docker exec -it ll-api sh

# PostgreSQL
docker exec -it ll-postgres psql -U postgres

# Check SubQuery indexing
curl http://localhost:3000/ready
```

### Build & Clean
```bash
# Rebuild images
docker-compose build --no-cache

# Remove everything
docker-compose down -v
docker system prune -a

# Remove specific image
docker rmi liquidlibertyalpha-hardhat-node
```

---

## 🧪 Testing Commands

### Frontend Tests (Vitest)
```bash
cd applications/liquid-liberty-frontend

npm test                    # Run all tests
npm run test:ui             # Interactive UI
npm run test:coverage       # With coverage report
npm test -- --watch         # Watch mode
npm test -- formatters      # Run specific test
```

### API Tests (Vitest)
```bash
cd applications/liquid-liberty-api

npm test                    # Run all tests
npm run test:ui             # Interactive UI
npm run test:coverage       # With coverage
npm test -- signature       # Run specific test
```

### Contract Tests (Hardhat)
```bash
cd applications/liquid-liberty-contracts

npm test                              # All tests
npx hardhat test test/Treasury.test.js # Specific file
REPORT_GAS=true npm test              # With gas report
npx hardhat coverage                  # Coverage report
```

### E2E Tests (Playwright)
```bash
cd applications/platform-integration-tests

npm test                                      # All E2E tests
npm run test:headed                           # See browser
npm run test:ui                               # Interactive mode
npm test -- marketplace                       # Specific test
npx playwright test --project=chromium        # Specific browser
npx playwright show-report                    # View report
```

### Integration & Parity Tests
```bash
cd applications/platform-integration-tests

npm run test:api            # API tests only
npm run test:contracts      # Contract tests only
npm run test:parity         # Parity tests only
npm run test:all            # Everything
npm test -- --grep @parity  # Tagged tests
```

### View Test Reports
```bash
# Playwright report
cd applications/platform-integration-tests
npx playwright show-report

# Coverage reports
cd applications/liquid-liberty-frontend
open coverage/index.html

cd applications/liquid-liberty-api
open coverage/index.html

cd applications/liquid-liberty-contracts
open coverage/index.html
```

---

## 🔄 Parity Testing Setup

### Run Both Environments Simultaneously

**Monorepo (Ports: 5173, 8888, 8545, 3000)**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: API
netlify dev

# Terminal 3: Contracts
npx hardhat node

# Terminal 4: Indexer
cd subgraph/lmkt-subquery && npm run start:docker
```

**Applications (Ports: 5174, 8889, 8546, 3001)**
```bash
# Terminal 5: Frontend
cd applications/liquid-liberty-frontend && npm run dev

# Terminal 6: API
cd applications/liquid-liberty-api && netlify dev --port 8889

# Terminal 7: Contracts
cd applications/liquid-liberty-contracts && npx hardhat node --port 8546

# Terminal 8: Indexer
cd applications/liquid-liberty-indexer/subgraph/lmkt-subquery && npm run start:docker
```

**Then run parity tests:**
```bash
cd applications/platform-integration-tests
npm run test:parity
```

---

## 📊 Service URLs

### Docker Services
| Service | URL | Purpose |
|---------|-----|---------|
| Hardhat Node | http://localhost:8545 | RPC endpoint |
| API Functions | http://localhost:8888 | Netlify dev server |
| GraphQL | http://localhost:3000 | SubQuery playground |
| PostgreSQL | postgresql://localhost:5432 | Database |

### Local Development
| Service | Monorepo | Applications |
|---------|----------|--------------|
| Frontend | :5173 | :5174 |
| API | :8888 | :8889 |
| Contracts | :8545 | :8546 |
| Indexer | :3000 | :3001 |

---

## 🐛 Troubleshooting

### Port in Use
```bash
# Find process
lsof -i :8545

# Kill process
kill -9 <PID>
```

### Docker Issues
```bash
# Clean restart
docker-compose down -v
docker-compose up --build

# Check logs
docker-compose logs <service>

# Restart specific service
docker-compose restart <service>
```

### Test Issues
```bash
# Clear Playwright cache
npx playwright install --force

# Clear Vitest cache
rm -rf node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Hardhat Issues
```bash
# Clean artifacts
npx hardhat clean

# Recompile
npx hardhat compile

# Check network
npx hardhat console --network localhost
```

### SubQuery Issues
```bash
# Restart indexer
docker-compose restart subquery-node

# Check database
docker exec -it ll-postgres psql -U postgres -c "SELECT * FROM subqueries.blocks LIMIT 10;"

# Clear database
docker-compose down -v
docker-compose up postgres subquery-node
```

---

## 🎯 Common Workflows

### Full Stack Development
```bash
# 1. Start Docker backend
docker-compose up -d

# 2. Deploy contracts
docker exec ll-hardhat npx hardhat run scripts/deploy.js --network localhost

# 3. Start frontend (outside Docker)
cd applications/liquid-liberty-frontend
npm run dev

# 4. Run tests
cd applications/platform-integration-tests
npm test
```

### Run All Tests (CI/CD)
```bash
# Contract tests
cd applications/liquid-liberty-contracts && npm test

# Frontend unit tests
cd applications/liquid-liberty-frontend && npm test

# API unit tests
cd applications/liquid-liberty-api && npm test

# Integration tests
cd applications/platform-integration-tests && npm run test:all
```

### Test Specific Feature
```bash
# 1. Start relevant services
docker-compose up hardhat-node api -d

# 2. Run specific tests
cd applications/platform-integration-tests
npm test -- marketplace
```

### Debug E2E Test
```bash
cd applications/platform-integration-tests

# Run in headed mode
npm run test:headed

# Debug mode (step through)
npx playwright test --debug

# Generate test code
npx playwright codegen http://localhost:5173
```

---

## 📦 Installation

### First Time Setup
```bash
# Root dependencies
npm install

# Frontend
cd applications/liquid-liberty-frontend
npm install

# API
cd applications/liquid-liberty-api
npm install

# Contracts
cd applications/liquid-liberty-contracts
npm install

# Integration tests
cd applications/platform-integration-tests
npm install
npx playwright install
```

### Update Dependencies
```bash
# Update all packages
npm update

# Update specific package
npm update vitest

# Check outdated
npm outdated
```

---

## 🔒 Environment Variables

### Required .env Files
```bash
# Contracts
applications/liquid-liberty-contracts/.env

# API
applications/liquid-liberty-api/.env

# Indexer
applications/liquid-liberty-indexer/subgraph/lmkt-subquery/.env

# Integration tests
applications/platform-integration-tests/.env
```

### Copy Examples
```bash
# Quick setup all .env files
cd applications/liquid-liberty-contracts && cp .env.example .env
cd applications/liquid-liberty-api && cp .env.example .env
cd applications/liquid-liberty-indexer/subgraph/lmkt-subquery && cp .env.example .env
cd applications/platform-integration-tests && cp .env.example .env
```

---

## 📚 Documentation

- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Complete Docker guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was implemented
- **[applications/platform-integration-tests/README.md](./applications/platform-integration-tests/README.md)** - Integration tests guide

---

## 🎯 Key Files

```
docker-compose.yml              # Main orchestration
docker-compose.dev.yml          # Dev overrides
docker-compose.test.yml         # Test configuration

applications/*/Dockerfile       # Individual service Dockerfiles
applications/*/vitest.config.js # Test configurations
playwright.config.ts            # E2E test config
```

---

## ✅ Health Checks

```bash
# Check all services healthy
docker ps | grep healthy

# Test API
curl http://localhost:8888

# Test GraphQL
curl http://localhost:3000

# Test RPC
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

**Quick Reference v1.0**
