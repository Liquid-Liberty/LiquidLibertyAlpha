# 🧪 Testing Guide - Liquid Liberty

Comprehensive testing strategy for ensuring monorepo and applications folder parity.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Quick Start](#quick-start)
- [Test Suites](#test-suites)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Writing Tests](#writing-tests)

## 🎯 Overview

Liquid Liberty uses a **multi-layered testing approach** to ensure code quality and verify that the **monorepo** and **applications folder** implementations behave identically.

### Testing Frameworks

| Framework | Purpose | Location |
|-----------|---------|----------|
| **Playwright** | E2E tests | `applications/platform-integration-tests` |
| **Vitest** | Unit & API tests | Frontend, API, Integration tests |
| **Hardhat + Chai** | Smart contract tests | Contracts (monorepo & applications) |
| **SuperTest** | API integration tests | Integration tests |

## 🏗️ Test Types

### 1. Unit Tests
Test individual functions and components in isolation.

**Locations:**
- `applications/liquid-liberty-frontend/src/**/*.test.js`
- `applications/liquid-liberty-api/tests/unit/*.test.js`

**Framework:** Vitest

**Example:**
```javascript
import { describe, it, expect } from 'vitest';
import { formatCategoryTitle } from './formatters';

describe('formatCategoryTitle', () => {
  it('should convert camelCase to title case', () => {
    expect(formatCategoryTitle('webDevelopment')).toBe('Web Development');
  });
});
```

### 2. Smart Contract Tests
Test contract functionality, gas usage, and edge cases.

**Locations:**
- `applications/liquid-liberty-contracts/test/*.test.js`
- `test/*.test.js` (monorepo)

**Framework:** Hardhat + Chai

**Example:**
```javascript
describe("Treasury", function () {
  it("Should allow buying LMKT with DAI", async function () {
    await mockDai.connect(user).approve(await treasury.getAddress(), buyAmount);
    await expect(treasury.connect(user).buy(await mockDai.getAddress(), buyAmount))
      .to.emit(treasury, "MKTSwap");
  });
});
```

### 3. API Integration Tests
Test serverless function behavior and parity.

**Location:** `applications/platform-integration-tests/tests/api`

**Framework:** Vitest + SuperTest

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import axios from 'axios';

describe('API Endpoint', () => {
  it('should generate valid signatures', async () => {
    const response = await axios.post(`${apiUrl}/create-listing-signature`, data);
    expect(response.data.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
  });
});
```

### 4. E2E Tests
Test complete user workflows across the application.

**Location:** `applications/platform-integration-tests/tests/e2e`

**Framework:** Playwright

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test('should load marketplace', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page.locator('h1')).toBeVisible();
});
```

### 5. Parity Tests
Verify monorepo and applications behave identically.

**Location:** `applications/platform-integration-tests/tests/parity`

**Framework:** Vitest + Playwright

**Example:**
```typescript
it('should generate identical signatures', async () => {
  const [sig1, sig2] = await Promise.all([
    getSignature(monorepoApiUrl),
    getSignature(applicationsApiUrl),
  ]);
  expect(sig1).toBe(sig2);
});
```

## ⚡ Quick Start

### Install Dependencies
```bash
# Root
npm install

# Applications
cd applications/liquid-liberty-frontend && npm install
cd applications/liquid-liberty-api && npm install
cd applications/liquid-liberty-contracts && npm install
cd applications/platform-integration-tests && npm install
```

### Run All Tests
```bash
# Contract tests
cd applications/liquid-liberty-contracts
npm test

# Frontend tests
cd applications/liquid-liberty-frontend
npm test

# API tests
cd applications/liquid-liberty-api
npm test

# Integration tests
cd applications/platform-integration-tests
npm run test:all
```

## 🧬 Test Suites

### Frontend Unit Tests

**Location:** `applications/liquid-liberty-frontend/src/**/*.test.js`

```bash
cd applications/liquid-liberty-frontend

# Run tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

**What's Tested:**
- Utility functions (formatters, helpers)
- React components (future)
- Custom hooks (future)
- Context providers (future)

### API Unit Tests

**Location:** `applications/liquid-liberty-api/tests/unit`

```bash
cd applications/liquid-liberty-api

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

**What's Tested:**
- Signature generation logic
- Content moderation utilities
- Input validation
- Error handling

### Contract Tests

**Location:** `applications/liquid-liberty-contracts/test`

```bash
cd applications/liquid-liberty-contracts

# Run all tests
npm test

# Run specific test file
npx hardhat test test/Treasury.test.js

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npx hardhat coverage
```

**What's Tested:**
- Treasury AMM functionality
- Listing creation and management
- Payment processing
- Access control
- Edge cases and reverts

### E2E Tests

**Location:** `applications/platform-integration-tests/tests/e2e`

```bash
cd applications/platform-integration-tests

# Run all E2E tests
npm test

# Run in headed mode (see browser)
npm run test:headed

# Run with UI (interactive)
npm run test:ui

# Run specific test file
npx playwright test tests/e2e/marketplace.spec.ts

# Run on specific browser
npx playwright test --project=chromium
```

**What's Tested:**
- Marketplace browsing and searching
- LMKT trading interface
- Wallet connection
- Listing creation workflow
- Purchase workflow

### API Integration Tests

**Location:** `applications/platform-integration-tests/tests/api`

```bash
cd applications/platform-integration-tests

# Run API tests
npm run test:api

# Watch mode
npm run test:api:watch
```

**What's Tested:**
- Serverless function responses
- Signature generation parity
- Content moderation consistency
- IPFS upload behavior
- SubQuery proxy

### Parity Tests

**Location:** `applications/platform-integration-tests/tests/parity`

```bash
cd applications/platform-integration-tests

# Run parity tests
npm run test:parity

# Or use grep pattern
npm test -- --grep @parity
```

**What's Tested:**
- Contract address consistency
- Contract bytecode matching
- API response parity
- Indexer data consistency
- GraphQL schema matching

## 🔄 Running Parity Tests

Parity tests require **both environments running simultaneously**:

### Setup Monorepo Environment
```bash
# Terminal 1 - Frontend
npm run dev  # Port 5173

# Terminal 2 - API
netlify dev  # Port 8888

# Terminal 3 - Contracts
npx hardhat node  # Port 8545

# Terminal 4 - Indexer
cd subgraph/lmkt-subquery
npm run start:docker  # Port 3000
```

### Setup Applications Environment
```bash
# Terminal 5 - Frontend
cd applications/liquid-liberty-frontend
npm run dev  # Port 5174

# Terminal 6 - API
cd applications/liquid-liberty-api
netlify dev --port 8889  # Port 8889

# Terminal 7 - Contracts
cd applications/liquid-liberty-contracts
npx hardhat node --port 8546  # Port 8546

# Terminal 8 - Indexer
cd applications/liquid-liberty-indexer/subgraph/lmkt-subquery
npm run start:docker  # Port 3001
```

### Run Parity Tests
```bash
cd applications/platform-integration-tests
npm run test:parity
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd applications/liquid-liberty-contracts
          npm ci
      - name: Run tests
        run: npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install and test
        run: |
          cd applications/liquid-liberty-frontend
          npm ci
          npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: |
          cd applications/platform-integration-tests
          npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## ✍️ Writing Tests

### Writing Unit Tests (Vitest)

```javascript
// Import testing utilities
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyFunction', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset state
  });

  // Test case
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  // Test with async
  it('should handle async operations', async () => {
    const result = await myAsyncFunction();
    expect(result).toBeDefined();
  });
});
```

### Writing E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  // Runs before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should perform action', async ({ page }) => {
    // Interact with page
    await page.click('button.submit');

    // Assert results
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

### Writing Parity Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Parity @parity', () => {
  it('should behave identically', async () => {
    const [monorepoResult, appsResult] = await Promise.all([
      testMonorepo(),
      testApplications(),
    ]);

    expect(monorepoResult).toEqual(appsResult);
  });
});
```

## 📊 Test Coverage

### View Coverage Reports

```bash
# Frontend coverage
cd applications/liquid-liberty-frontend
npm run test:coverage
open coverage/index.html

# API coverage
cd applications/liquid-liberty-api
npm run test:coverage
open coverage/index.html

# Contract coverage
cd applications/liquid-liberty-contracts
npx hardhat coverage
open coverage/index.html
```

### Coverage Goals

| Component | Target |
|-----------|--------|
| Contracts | 90%+ |
| API Functions | 80%+ |
| Frontend Utils | 80%+ |
| Integration Tests | Critical paths |

## 🐛 Debugging Tests

### Playwright Debug Mode
```bash
npx playwright test --debug
```

### Vitest UI Mode
```bash
npm run test:ui
```

### Hardhat Console Logs
```solidity
import "hardhat/console.sol";

console.log("Value:", value);
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

## 📚 Best Practices

1. **Write descriptive test names**
   ```javascript
   it('should reject listing with negative price')
   ```

2. **Test edge cases**
   - Empty inputs
   - Maximum values
   - Invalid data

3. **Keep tests independent**
   - Don't rely on test order
   - Clean up after each test

4. **Use fixtures and mocks**
   - Reusable test data
   - Mock external dependencies

5. **Tag tests appropriately**
   ```typescript
   test('my test @parity', ...)
   test('my test @smoke', ...)
   ```

## 🤝 Contributing

When adding features:

1. Write tests first (TDD)
2. Ensure tests pass locally
3. Add parity tests if needed
4. Update documentation
5. Run full test suite before PR

## 📄 License

MIT License
