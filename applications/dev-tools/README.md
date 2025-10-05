# 🛠️ Dev Tools - Liquid Liberty

Automation scripts and tools for managing the Liquid Liberty development environment.

## 📋 Overview

This application provides scripts to:
- **Setup** - Clone repositories and install dependencies
- **Update** - Pull latest changes and update dependencies
- **Start/Stop** - Run all applications with one command
- **Validate** - Check system requirements and configuration
- **Maintain** - Enforce code quality and consistency

## 🚀 Quick Start

### Initial Setup

```bash
# Install dev-tools dependencies
cd applications/dev-tools
npm install

# Run complete setup (repos + deps + env files)
npm run setup
```

### Daily Usage

```bash
# Pull latest changes from all repos
npm run update

# Start all applications
npm run start

# Stop all applications
npm run stop

# Check status
npm run status
```

## 📦 Available Scripts

### Setup Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Complete Setup** | `npm run setup` | Full setup: repos + deps + env files |
| Clone Repos | `npm run setup:repos` | Clone all repositories |
| Install Dependencies | `npm run setup:deps` | Install npm packages |
| Setup Environment | `npm run setup:env` | Create .env files from templates |

### Update Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Update All** | `npm run update` | Pull latest + update deps |
| Pull Latest | `npm run update:repos` | Git pull on all repositories |
| Update Dependencies | `npm run update:deps` | Update npm packages |

### Runtime Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Start All** | `npm run start` | Start all applications |
| Start Backend | `npm run start:backend` | Start backend services only |
| Start Frontend | `npm run start:frontend` | Start frontend only |
| Stop All | `npm run stop` | Stop all running services |
| Check Status | `npm run status` | Show status of all services |

### Maintenance Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Validate Setup | `npm run validate` | Check system requirements |
| Run Doctor | `npm run doctor` | Diagnose common issues |
| Clean All | `npm run clean` | Remove node_modules, caches |

## 🏗️ Directory Structure

```
dev-tools/
├── package.json              # Scripts and dependencies
├── README.md                 # This file
│
├── scripts/                  # Automation scripts
│   ├── setup-all.js         # Complete setup
│   ├── start-all.js         # Start all services
│   ├── stop-all.js          # Stop all services
│   ├── pull-latest.js       # Update repositories
│   ├── install-deps.js      # Install dependencies
│   ├── clone-repos.js       # Clone repositories
│   ├── setup-env.js         # Setup environment files
│   ├── update-all.js        # Update everything
│   ├── update-deps.js       # Update dependencies
│   ├── check-status.js      # Check service status
│   ├── validate-setup.js    # Validate configuration
│   ├── doctor.js            # Diagnose issues
│   └── clean-all.js         # Clean build artifacts
│
├── config/                   # Configuration files
│   ├── repositories.json    # Repository definitions
│   └── requirements.json    # System requirements
│
└── templates/                # Templates and guides
    ├── claude-pre-commit-rules.md   # Pre-commit checklist
    ├── claude-post-commit-rules.md  # Post-commit checklist
    └── .env.template                # Environment template
```

## 📚 Detailed Usage

### Complete Initial Setup

```bash
cd applications/dev-tools
npm install
npm run setup
```

This will:
1. ✅ Check system requirements (Node, Git, Docker)
2. ✅ Install dependencies for all applications
3. ✅ Create .env files from .env.example templates
4. ✅ Display next steps

### Starting the Development Environment

```bash
npm run start
```

This starts services in order:
1. **Hardhat Node** (Port 8545) - Local blockchain
2. **Indexer** (Port 3000) - SubQuery + PostgreSQL
3. **API** (Port 8888) - Netlify Functions
4. **Frontend** (Port 5173) - Vite dev server

Each service:
- ✅ Starts in correct order
- ✅ Waits for health checks
- ✅ Shows colored logs
- ✅ Auto-restarts on failure

**Stop all services:**
```bash
npm run stop
# Or press Ctrl+C in the terminal
```

### Updating Everything

```bash
npm run update
```

This will:
1. Pull latest changes from all repositories
2. Stash uncommitted changes (if any)
3. Update to latest main branch
4. Show summary of updates
5. Optionally update dependencies

### Checking System Status

```bash
npm run status
```

Shows:
- ✅ Service running status
- ✅ Port availability
- ✅ Health check results
- ✅ Git branch and status
- ✅ Dependency versions

### Validating Setup

```bash
npm run validate
```

Checks:
- ✅ System requirements (Node, npm, Git, Docker)
- ✅ Application dependencies installed
- ✅ Environment files exist
- ✅ Ports available
- ✅ Git repositories valid

### Running Doctor

```bash
npm run doctor
```

Diagnoses common issues:
- ❌ Port conflicts
- ❌ Missing dependencies
- ❌ Invalid environment variables
- ❌ Git repository issues
- ✅ Suggests fixes

### Cleaning Everything

```bash
npm run clean
```

Removes:
- `node_modules/` from all applications
- Build artifacts (`dist/`, `build/`)
- Cache directories (`.vite/`, `.cache/`)
- Test results
- Docker volumes (optional)

## 🔧 Configuration

### Repository Configuration

Edit `config/repositories.json` to manage repositories:

```json
{
  "repositories": [
    {
      "name": "liquid-liberty-contracts",
      "url": "https://github.com/Liquid-Liberty/liquid-liberty-contracts.git",
      "branch": "main",
      "directory": "applications/liquid-liberty-contracts",
      "port": 8545,
      "startCommand": "npx hardhat node",
      "healthCheck": "http://localhost:8545"
    }
  ],
  "startupOrder": [
    "liquid-liberty-contracts",
    "liquid-liberty-indexer",
    "liquid-liberty-api",
    "liquid-liberty-frontend"
  ]
}
```

### System Requirements

Edit `config/requirements.json` for system checks:

```json
{
  "system": {
    "node": {
      "minVersion": "20.0.0",
      "command": "node --version",
      "installUrl": "https://nodejs.org/"
    }
  }
}
```

## 📋 Claude AI Rules

### Pre-Commit Rules

See `templates/claude-pre-commit-rules.md` for comprehensive checklist before committing:

**Key points:**
- ✅ All tests pass
- ✅ No debug code or TODOs
- ✅ ESLint passes
- ✅ Parity tests pass (monorepo vs applications)
- ✅ Documentation updated
- ✅ No secrets committed

### Post-Commit Rules

See `templates/claude-post-commit-rules.md` for post-commit workflow:

**Key points:**
- ✅ Push to remote
- ✅ Monitor CI/CD
- ✅ Update changelog
- ✅ Deploy if needed
- ✅ Monitor for errors
- ✅ Validate production

## 🎯 Common Workflows

### New Developer Onboarding

```bash
# 1. Clone monorepo
git clone https://github.com/Liquid-Liberty/LiquidLibertyAlpha.git
cd LiquidLibertyAlpha

# 2. Setup everything
cd applications/dev-tools
npm install
npm run setup

# 3. Start development environment
npm run start

# 4. Run tests
cd ../platform-integration-tests
npm test
```

### Daily Development

```bash
# Morning: Update everything
npm run update

# Start services
npm run start

# Work on features...

# Before commit: Run checks
npm run validate
cd ../platform-integration-tests && npm run test:parity

# Commit and push
git add .
git commit -m "feat: description"
git push
```

### Deploying Updates

```bash
# 1. Pull latest
npm run update

# 2. Run all tests
cd ../platform-integration-tests && npm run test:all

# 3. Deploy contracts
cd ../liquid-liberty-contracts
npm run deploy:sepolia

# 4. Deploy indexer
cd ../liquid-liberty-indexer/subgraph/lmkt-subquery
npm run build:sepolia && npm run publish:sepolia

# 5. Deploy API & Frontend (auto-deploy on push)
git push
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :8545

# Kill process
kill -9 <PID>

# Or use stop script
npm run stop
```

### Services Won't Start

```bash
# Run doctor
npm run doctor

# Check logs
npm run status

# Clean and restart
npm run clean
npm run setup:deps
npm run start
```

### Git Issues

```bash
# Check status
cd <application>
git status

# Discard changes
git reset --hard HEAD

# Or stash
git stash
```

### Dependency Issues

```bash
# Clean install
npm run clean
npm run setup:deps

# Or manually
cd <application>
rm -rf node_modules package-lock.json
npm install
```

## 📊 Environment Variables

Required `.env` files:

1. **applications/liquid-liberty-contracts/.env**
   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   SIGNER_PRIVATE_KEY=0x...
   ```

2. **applications/liquid-liberty-api/.env**
   ```
   PINATA_API_KEY=your_key
   PINATA_API_SECRET=your_secret
   ```

3. **applications/liquid-liberty-frontend/.env**
   ```
   VITE_PROJECT_ID=your_walletconnect_id
   VITE_API_BASE_URL=http://localhost:8888/.netlify/functions
   ```

4. **applications/liquid-liberty-indexer/.env**
   ```
   BUILD_NETWORK=sepolia
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   ```

5. **applications/platform-integration-tests/.env**
   ```
   APPLICATIONS_FRONTEND_URL=http://localhost:5173
   APPLICATIONS_API_URL=http://localhost:8888/.netlify/functions
   ```

## 🤝 Contributing

When adding new scripts:

1. Add to `scripts/` directory
2. Update `package.json` with new script command
3. Document in this README
4. Test thoroughly
5. Update templates if needed

## 📄 License

MIT License
