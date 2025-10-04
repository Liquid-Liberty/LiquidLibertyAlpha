# 🐳 Docker Guide - Liquid Liberty

Complete guide for running Liquid Liberty applications in Docker containers.

## 📦 Overview

The Liquid Liberty platform consists of **backend services** that can be orchestrated with Docker:

- **Hardhat Node** - Local Ethereum blockchain
- **API (Netlify Functions)** - Serverless functions
- **SubQuery Indexer** - Blockchain event indexer
- **PostgreSQL** - Database for indexer
- **GraphQL Engine** - Query interface for indexed data

**Frontend and integration tests** are run separately (not orchestrated in Docker).

## 🚀 Quick Start

### Start All Backend Services
```bash
docker-compose up
```

### Start with Development Overrides
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Start in Background
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

## 📋 Available Services

### 1. PostgreSQL Database
- **Port:** 5432
- **Credentials:** postgres/postgres
- **Health Check:** Included
- **Volume:** `postgres-data`

```bash
# Access PostgreSQL CLI
docker exec -it ll-postgres psql -U postgres
```

### 2. Hardhat Node (Contracts)
- **Port:** 8545
- **Container:** ll-hardhat
- **Hot Reload:** Enabled via volumes
- **Purpose:** Local blockchain for development

```bash
# View Hardhat logs
docker logs -f ll-hardhat

# Deploy contracts to running node
docker exec ll-hardhat npx hardhat run scripts/deploy.js --network localhost
```

### 3. API (Netlify Functions)
- **Port:** 8888
- **Container:** ll-api
- **Hot Reload:** Enabled via volumes
- **Purpose:** Serverless functions (IPFS, signatures, moderation)

```bash
# View API logs
docker logs -f ll-api

# Test API endpoint
curl http://localhost:8888/.netlify/functions/health
```

### 4. SubQuery Indexer Node
- **Container:** ll-subquery-node
- **Purpose:** Indexes blockchain events
- **Depends on:** PostgreSQL, Hardhat Node
- **Workers:** 4 (configurable)

```bash
# View indexer logs
docker logs -f ll-subquery-node

# Check indexing progress
curl http://localhost:3000/ready
```

### 5. GraphQL Engine
- **Port:** 3000
- **Container:** ll-graphql
- **Purpose:** GraphQL API for queried data
- **Playground:** http://localhost:3000

```bash
# View GraphQL logs
docker logs -f ll-graphql

# Open GraphQL playground
open http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

Each service requires environment variables. Copy `.env.example` to `.env` in each application:

```bash
# Contracts
cd applications/liquid-liberty-contracts
cp .env.example .env

# API
cd applications/liquid-liberty-api
cp .env.example .env

# Indexer
cd applications/liquid-liberty-indexer/subgraph/lmkt-subquery
cp .env.example .env
```

### Docker Compose Files

**`docker-compose.yml`** - Base configuration
- Production-ready setup
- All backend services
- Health checks
- Service dependencies

**`docker-compose.dev.yml`** - Development overrides
- Debug logging enabled
- Reduced workers for faster startup
- Development-specific settings

**`docker-compose.test.yml`** - Test configuration
- Test runners for each service
- Integration test suite
- Separate from main services

## 🛠️ Development Workflow

### 1. Start Backend Services
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Wait for all services to be healthy (check with `docker ps`).

### 2. Deploy Contracts
```bash
cd applications/liquid-liberty-contracts
npm run deploy:local
# or
docker exec ll-hardhat npx hardhat run scripts/deploy.js --network localhost
```

### 3. Start Frontend (Outside Docker)
```bash
cd applications/liquid-liberty-frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Run Tests
```bash
cd applications/platform-integration-tests
npm test
```

## 🧪 Running Tests in Docker

### Run All Tests
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up
```

### Run Specific Test Suite
```bash
# Contract tests
docker-compose -f docker-compose.test.yml run hardhat-node-test

# API tests
docker-compose -f docker-compose.test.yml run api-test

# Integration tests
docker-compose -f docker-compose.test.yml run integration-tests
```

## 📊 Monitoring & Debugging

### View All Logs
```bash
docker-compose logs -f
```

### View Specific Service Logs
```bash
docker-compose logs -f hardhat-node
docker-compose logs -f api
docker-compose logs -f subquery-node
```

### Check Service Health
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Execute Commands in Containers
```bash
# Hardhat
docker exec -it ll-hardhat sh

# API
docker exec -it ll-api sh

# PostgreSQL
docker exec -it ll-postgres psql -U postgres
```

### Network Inspection
```bash
# List Docker networks
docker network ls

# Inspect liquid-liberty network
docker network inspect liquidlibertyalpha_liquid-liberty
```

## 🔍 Troubleshooting

### Services Not Starting

**Check logs:**
```bash
docker-compose logs
```

**Rebuild images:**
```bash
docker-compose build --no-cache
docker-compose up
```

**Remove old containers:**
```bash
docker-compose down -v
docker system prune -a
```

### Port Already in Use

**Find process using port:**
```bash
lsof -i :8545  # Hardhat
lsof -i :8888  # API
lsof -i :3000  # GraphQL
lsof -i :5432  # PostgreSQL
```

**Kill process:**
```bash
kill -9 <PID>
```

**Or change port in docker-compose.yml:**
```yaml
ports:
  - "8546:8545"  # Changed from 8545:8545
```

### Hardhat Node Won't Start

**Check if blockchain data is corrupted:**
```bash
docker-compose down -v  # Remove volumes
docker-compose up hardhat-node
```

**Verify network configuration:**
```bash
docker exec ll-hardhat npx hardhat run scripts/verify-network.js
```

### SubQuery Not Indexing

**Check database connection:**
```bash
docker exec ll-subquery-node wget --spider -q http://postgres:5432 && echo "Connected" || echo "Failed"
```

**Check RPC connection:**
```bash
docker exec ll-subquery-node wget --spider -q http://hardhat-node:8545 && echo "Connected" || echo "Failed"
```

**Restart indexer:**
```bash
docker-compose restart subquery-node
```

### API Functions Failing

**Check environment variables:**
```bash
docker exec ll-api env | grep -E 'PINATA|SIGNER|RPC'
```

**Test locally:**
```bash
cd applications/liquid-liberty-api
netlify dev
```

## 📦 Building Individual Images

### Build Contracts Image
```bash
docker build -t ll-contracts:latest applications/liquid-liberty-contracts
docker run -p 8545:8545 ll-contracts:latest
```

### Build API Image
```bash
docker build -t ll-api:latest applications/liquid-liberty-api
docker run -p 8888:8888 ll-api:latest
```

### Build Frontend Image (Production)
```bash
docker build -t ll-frontend:latest --target production applications/liquid-liberty-frontend
docker run -p 80:80 ll-frontend:latest
```

## 🚢 Production Deployment

### Build Production Images
```bash
docker-compose build
```

### Tag for Registry
```bash
docker tag liquidlibertyalpha-hardhat-node your-registry/ll-hardhat:latest
docker tag liquidlibertyalpha-api your-registry/ll-api:latest
```

### Push to Registry
```bash
docker push your-registry/ll-hardhat:latest
docker push your-registry/ll-api:latest
```

### Deploy with Docker Swarm
```bash
docker stack deploy -c docker-compose.yml liquid-liberty
```

## 🔒 Security Best Practices

### 1. Non-Root Users
All containers run as non-root users (uid 1001).

### 2. Environment Variables
Never commit `.env` files. Use Docker secrets in production:

```yaml
secrets:
  signer_key:
    external: true

services:
  api:
    secrets:
      - signer_key
```

### 3. Network Isolation
Services communicate via internal Docker network, not exposed ports.

### 4. Health Checks
All services include health checks for automatic recovery.

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Hardhat Docker Guide](https://hardhat.org/tutorial/deploying-to-a-live-network)
- [Netlify Functions Local Dev](https://docs.netlify.com/cli/get-started/)
- [SubQuery Docker](https://academy.subquery.network/run_publish/run.html)

## 🤝 Contributing

When adding new services:

1. Create Dockerfile in application directory
2. Add service to `docker-compose.yml`
3. Configure health checks
4. Set up proper networking
5. Add to this documentation
6. Test with `docker-compose config`

## 📄 License

MIT License
