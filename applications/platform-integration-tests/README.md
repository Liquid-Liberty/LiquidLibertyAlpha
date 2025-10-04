# 🧪 Platform Integration Tests

End-to-end and integration tests for Liquid Liberty platform. This test suite validates that the **monorepo** and **applications folder** implementations behave identically.

## 📦 What's Tested

### E2E Tests (Playwright)
- ✅ Marketplace user flows (browsing, searching, filtering)
- ✅ LMKT trading interface (charts, swaps)
- ✅ Wallet connection workflows
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari, Mobile)
- ✅ **Parity tests** comparing monorepo vs applications

### API Tests (Vitest + SuperTest)
- ✅ Serverless function responses
- ✅ Signature generation consistency
- ✅ Content moderation behavior
- ✅ SubQuery proxy functionality
- ✅ **Parity tests** comparing API deployments

### Contract Tests (Vitest + Ethers)
- ✅ Network configuration parity
- ✅ Contract deployment verification
- ✅ Gas estimation consistency
- ✅ **Behavior comparison** between deployments

## 🚀 Quick Start

### Installation
```bash
cd applications/platform-integration-tests
npm install
npm run playwright:install
```

### Configuration
```bash
cp .env.example .env
# Edit .env with your test environment URLs
```

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Suites
```bash
# E2E tests only
npm test

# E2E tests with UI
npm run test:ui

# API tests only
npm run test:api

# Contract tests only
npm run test:contracts

# Parity tests only (monorepo vs applications)
npm run test:parity
```

## 📁 Test Structure

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── marketplace.spec.ts       # Marketplace user flows
│   ├── trading.spec.ts           # LMKT trading interface
│   └── wallet.spec.ts            # Wallet connection (TODO)
├── api/                          # API integration tests
│   ├── serverless-functions.test.ts
│   └── graphql-queries.test.ts   # (TODO)
├── contracts/                    # Contract behavior tests
│   ├── treasury-parity.test.ts
│   └── listing-manager.test.ts   # (TODO)
└── utils/                        # Shared utilities
    ├── config.ts                 # Test configuration
    └── helpers.ts                # Helper functions
```

## 🔬 Test Types

### 1. E2E Tests (`@applications`)
Tests that verify functionality in the applications folder deployment:
```bash
npm run test:applications
```

### 2. Parity Tests (`@parity`)
Tests that compare behavior between monorepo and applications:
```bash
npm run test:parity
```

These tests ensure:
- Same UI rendering
- Identical API responses
- Matching contract behavior
- Consistent data from indexers

### 3. Regression Tests
Run the full suite before and after refactoring to catch regressions:
```bash
npm run test:all
```

## 🎯 Testing Scenarios

### Marketplace Tests
- Homepage loads correctly
- Listings grid displays
- Search functionality works
- Category filtering works
- Individual listing pages load

### Trading Tests
- Chart renders with data
- Timeframe switching works
- Price information displays
- Swap interface is accessible
- Token information shows

### API Tests
- Signature generation is consistent
- Content moderation behaves identically
- IPFS uploads work (when available)
- GraphQL proxy returns data
- Error handling is consistent

### Contract Tests
- Network accessibility
- Chain ID matches
- Block numbers are in sync
- Gas estimates are identical
- Contract addresses match expected values

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Monorepo URLs
MONOREPO_FRONTEND_URL=http://localhost:5173
MONOREPO_API_URL=http://localhost:8888/.netlify/functions
MONOREPO_CONTRACTS_RPC=http://localhost:8545
MONOREPO_SUBQUERY_URL=http://localhost:3000

# Applications URLs
APPLICATIONS_FRONTEND_URL=http://localhost:5174
APPLICATIONS_API_URL=http://localhost:8889/.netlify/functions
APPLICATIONS_CONTRACTS_RPC=http://localhost:8546
APPLICATIONS_SUBQUERY_URL=http://localhost:3001

# Test Configuration
TEST_WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
TEST_TIMEOUT=60000
```

### Running Parallel Environments

To test parity, you need both environments running:

#### Terminal 1 - Monorepo
```bash
# Root of repo
npm run dev  # Frontend on :5173
netlify dev  # API on :8888
```

#### Terminal 2 - Applications
```bash
cd applications/liquid-liberty-frontend
npm run dev  # Frontend on :5174

# Terminal 3
cd applications/liquid-liberty-api
netlify dev --port 8889  # API on :8889
```

## 📊 Test Reports

After running tests:

### Playwright Report
```bash
npx playwright show-report
```

### Coverage Report (API/Contract tests)
```bash
npm run test:api -- --coverage
```

Reports are generated in:
- `playwright-report/` - HTML report for E2E tests
- `test-results/` - JSON results
- `coverage/` - Code coverage reports

## 🐛 Debugging Tests

### Headed Mode
See the browser while tests run:
```bash
npm run test:headed
```

### UI Mode (Interactive)
Debug tests interactively:
```bash
npm run test:ui
```

### Playwright Codegen
Generate tests by recording actions:
```bash
npm run playwright:codegen
```

### Verbose Output
```bash
npm test -- --reporter=list --workers=1
```

## ✅ CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: |
    cd applications/platform-integration-tests
    npm install
    npx playwright install --with-deps

- name: Run E2E tests
  run: npm test

- name: Run API tests
  run: npm run test:api

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 🎨 Writing New Tests

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';
import { config } from '../utils/config';

test('my new test @applications', async ({ page }) => {
  await page.goto(config.applications.frontendUrl);
  await expect(page.locator('h1')).toBeVisible();
});
```

### Parity Test Example
```typescript
test('feature parity @parity', async ({ page }) => {
  // Test monorepo
  await page.goto(config.monorepo.frontendUrl);
  const monorepoResult = await page.locator('.result').textContent();

  // Test applications
  await page.goto(config.applications.frontendUrl);
  const appsResult = await page.locator('.result').textContent();

  // Compare
  expect(monorepoResult).toBe(appsResult);
});
```

### API Test Example
```typescript
import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { config } from '../utils/config';

describe('API Endpoint', () => {
  it('should return expected data', async () => {
    const response = await axios.post(
      `${config.applications.apiUrl}/my-function`,
      { data: 'test' }
    );
    expect(response.status).toBe(200);
  });
});
```

## 🔍 Best Practices

1. **Tag Tests Appropriately**
   - Use `@applications` for application-specific tests
   - Use `@parity` for comparison tests
   - Use `@monorepo` for monorepo-specific tests

2. **Use Descriptive Test Names**
   ```typescript
   test('should display error when listing price is invalid', ...)
   ```

3. **Keep Tests Independent**
   - Each test should set up its own state
   - Don't rely on test execution order

4. **Use Page Object Pattern**
   - Create reusable page objects for complex pages
   - Store in `tests/pages/`

5. **Handle Async Properly**
   - Always await async operations
   - Use proper timeouts
   - Handle race conditions

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [SuperTest Guide](https://github.com/ladjs/supertest)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🤝 Contributing

When adding new features:
1. Write E2E tests for user-facing features
2. Write parity tests to ensure monorepo matches
3. Run full test suite before submitting PR
4. Include test coverage in PR description

## 📄 License

MIT License
