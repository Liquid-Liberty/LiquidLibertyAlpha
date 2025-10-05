# Claude Pre-Commit Rules - Liquid Liberty

These rules should be followed **BEFORE** committing code changes to ensure consistency, quality, and prevent errors across the Liquid Liberty platform.

## 🎯 General Principles

1. **Make small, focused commits** - One logical change per commit
2. **Follow existing patterns** - Match the style and structure of existing code
3. **Test before committing** - All tests must pass
4. **Update documentation** - Keep docs in sync with code changes
5. **Verify parity** - Ensure monorepo and applications folder remain synchronized

---

## ✅ Pre-Commit Checklist

### 1. Code Quality

- [ ] **No console.logs or debug code** - Remove all debugging statements
- [ ] **No commented-out code** - Delete unused code blocks
- [ ] **No TODO comments without issues** - Create GitHub issues for TODOs
- [ ] **Proper error handling** - All async operations have try-catch
- [ ] **Type safety** - TypeScript files have proper types (no `any` unless necessary)
- [ ] **ESLint passes** - Run `npm run lint` with 0 errors
- [ ] **Prettier formatted** - Code is properly formatted

### 2. Testing

- [ ] **Unit tests pass** - `npm test` succeeds in affected applications
- [ ] **New tests added** - New features have corresponding tests
- [ ] **E2E tests pass** - Critical paths still work
- [ ] **Parity tests pass** - Monorepo and applications behave identically
- [ ] **No test skipping** - Remove `.only` and `.skip` from tests

**Run these commands:**
```bash
# Frontend tests
cd applications/liquid-liberty-frontend && npm test

# API tests
cd applications/liquid-liberty-api && npm test

# Contract tests
cd applications/liquid-liberty-contracts && npm test

# Integration tests
cd applications/platform-integration-tests && npm run test:all
```

### 3. Smart Contracts (if applicable)

- [ ] **Contracts compile** - `npx hardhat compile` succeeds
- [ ] **Tests pass** - All Hardhat tests pass
- [ ] **Gas optimization** - No unnecessary storage operations
- [ ] **Security review** - Check for reentrancy, overflow, access control
- [ ] **Events emitted** - Important state changes emit events
- [ ] **NatSpec comments** - Functions have proper documentation

### 4. API Functions (if applicable)

- [ ] **Environment variables** - No hardcoded secrets
- [ ] **Error responses** - Proper HTTP status codes
- [ ] **Input validation** - All inputs are validated
- [ ] **CORS configured** - Proper CORS headers
- [ ] **Rate limiting** - Protected from abuse

### 5. Frontend (if applicable)

- [ ] **No hardcoded values** - Use environment variables
- [ ] **Accessibility** - Proper ARIA labels, semantic HTML
- [ ] **Responsive design** - Works on mobile and desktop
- [ ] **Loading states** - Show loading indicators
- [ ] **Error states** - Display user-friendly error messages
- [ ] **No wallet private keys** - Never log or expose private data

### 6. File Organization

- [ ] **Correct location** - Files in appropriate directories
- [ ] **Naming conventions** - Follow existing naming patterns
  - Components: `PascalCase.jsx`
  - Utilities: `camelCase.js`
  - Tests: `*.test.js` or `*.spec.ts`
  - Contracts: `PascalCase.sol`
- [ ] **Import organization** - External deps → Internal deps → Relative
- [ ] **No circular dependencies** - Check import chains

### 7. Documentation

- [ ] **README updated** - If public API changed
- [ ] **Inline comments** - Complex logic is explained
- [ ] **Function documentation** - JSDoc or NatSpec comments
- [ ] **Architecture docs** - Update if structure changed
- [ ] **API documentation** - Document new endpoints

### 8. Dependencies

- [ ] **No unnecessary deps** - Only required packages added
- [ ] **Version pinned** - Use exact versions for critical deps
- [ ] **Security audit** - Run `npm audit` and fix critical issues
- [ ] **License compatible** - Check new dependency licenses

### 9. Environment Files

- [ ] **`.env` not committed** - Never commit secrets
- [ ] **`.env.example` updated** - Template includes new variables
- [ ] **Documentation updated** - New env vars documented in README

### 10. Parity Verification (CRITICAL)

If you modified files in either monorepo OR applications folder:

- [ ] **Sync changes** - Apply same changes to both locations
- [ ] **Test both** - Run parity tests to verify identical behavior
- [ ] **Contract addresses match** - Deployment addresses are synced
- [ ] **ABIs match** - Contract interfaces are identical
- [ ] **API responses match** - Serverless functions behave identically

**Run parity tests:**
```bash
cd applications/platform-integration-tests
npm run test:parity
```

---

## 🚫 Never Commit

1. **Secrets or API keys** - Use environment variables
2. **`node_modules/`** - Always in `.gitignore`
3. **Build artifacts** - `dist/`, `build/`, `artifacts/`
4. **`.env` files** - Keep local
5. **Large files** - Use Git LFS for assets
6. **Personal configurations** - `.vscode/`, `.idea/`
7. **Test data** - Mock data, test results
8. **Temporary files** - `*.log`, `*.tmp`, `.DS_Store`

---

## 📝 Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes

**Examples:**
```
feat(contracts): add listing fee configuration

Allow marketplace owners to configure listing fees dynamically
through the admin panel. Adds setListingFee function with
access control.

Closes #123
```

```
fix(api): validate signature before processing

Add input validation to prevent invalid signatures from
being processed. Includes additional error handling.
```

```
test(frontend): add parity tests for marketplace

Verify that monorepo and applications folder implementations
of marketplace behave identically.
```

---

## 🔍 Code Review Guidelines

### What to Look For

1. **Security vulnerabilities**
   - SQL injection
   - XSS attacks
   - Reentrancy (contracts)
   - Access control issues

2. **Performance issues**
   - Inefficient loops
   - Unnecessary re-renders
   - Expensive contract operations
   - N+1 queries

3. **Code smells**
   - Duplicate code
   - Long functions (>50 lines)
   - Deep nesting (>3 levels)
   - Magic numbers

4. **Best practices**
   - Proper error handling
   - Consistent naming
   - Single responsibility
   - DRY principle

---

## 🛠️ Automated Checks

Set up git hooks with Husky:

```bash
# Install Husky
npm install --save-dev husky

# Setup hooks
npx husky install

# Pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

---

## 📊 Quick Command Reference

```bash
# Run all checks
npm run lint && npm test

# Check for security issues
npm audit

# Format code
npm run format  # or npx prettier --write .

# Run parity tests
cd applications/platform-integration-tests && npm run test:parity

# Compile contracts
cd applications/liquid-liberty-contracts && npx hardhat compile

# Check build
npm run build
```

---

## 🎯 Application-Specific Rules

### Contracts
- All state changes emit events
- Use SafeMath for arithmetic (or Solidity 0.8+)
- Include access control on admin functions
- Test all edge cases

### API
- Validate all inputs
- Return proper HTTP status codes
- Log errors (but not sensitive data)
- Handle CORS properly

### Frontend
- Use TypeScript for new components
- Follow React hooks best practices
- Implement loading and error states
- Ensure accessibility

### Indexer
- Handle chain reorganizations
- Index all relevant events
- Optimize GraphQL queries
- Test with real blockchain data

---

## ✅ Final Checklist Before `git commit`

```bash
# 1. Run linter
npm run lint

# 2. Run tests
npm test

# 3. Check for uncommitted files
git status

# 4. Review changes
git diff

# 5. Stage files
git add <files>

# 6. Write good commit message
git commit -m "type(scope): description"

# 7. Run parity tests (if applicable)
cd applications/platform-integration-tests && npm run test:parity
```

---

**Remember: Quality over speed. A few extra minutes of checking before commit saves hours of debugging later!**
