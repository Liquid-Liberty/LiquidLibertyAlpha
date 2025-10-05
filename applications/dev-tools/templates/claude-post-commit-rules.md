# Claude Post-Commit Rules - Liquid Liberty

These rules should be followed **AFTER** committing code to ensure deployment readiness, documentation updates, and system integrity.

## 🎯 Post-Commit Workflow

After successfully committing code, follow these steps to maintain system health and prepare for deployment.

---

## ✅ Post-Commit Checklist

### 1. Immediate Actions

- [ ] **Push to remote** - Share your changes with the team
  ```bash
  git push origin <branch-name>
  ```

- [ ] **Create PR** - If working on a feature branch
  ```bash
  gh pr create --title "feat: description" --body "Details"
  ```

- [ ] **Update issue tracker** - Link commits to issues
  ```bash
  # Reference in commit: "Closes #123"
  # Or update manually on GitHub
  ```

- [ ] **Notify team** - For breaking changes or major features

### 2. CI/CD Verification

- [ ] **Monitor CI/CD pipeline** - Check GitHub Actions/CI status
- [ ] **Review test results** - Ensure all automated tests pass
- [ ] **Check build status** - Verify successful builds
- [ ] **Review deployment logs** - For auto-deployments

**Check CI status:**
```bash
gh run list --branch <branch-name>
gh run watch <run-id>
```

### 3. Documentation Updates

- [ ] **Update CHANGELOG.md** - Document changes
  ```markdown
  ## [Unreleased]
  ### Added
  - New feature description

  ### Fixed
  - Bug fix description

  ### Changed
  - Modified behavior description
  ```

- [ ] **Update API documentation** - If endpoints changed
- [ ] **Update deployment guide** - If process changed
- [ ] **Update architecture docs** - If structure changed
- [ ] **Regenerate docs** - If using auto-generation

### 4. Dependency Management

- [ ] **Update lock files** - Commit package-lock.json if deps changed
- [ ] **Security audit** - Check for vulnerabilities
  ```bash
  npm audit
  npm audit fix  # If safe
  ```

- [ ] **Check for updates** - Review outdated packages
  ```bash
  npm outdated
  ```

- [ ] **Sync dependencies** - Ensure parity between monorepo and applications

### 5. Contract Deployments (if applicable)

- [ ] **Deploy to testnet** - Deploy new contracts to testnet
  ```bash
  cd applications/liquid-liberty-contracts
  npm run deploy:sepolia
  ```

- [ ] **Verify contracts** - Verify on block explorer
  ```bash
  npm run verify
  ```

- [ ] **Update addresses** - Sync new contract addresses
  ```bash
  npm run sync-addresses:sepolia
  ```

- [ ] **Update ABIs** - Ensure frontend and indexer have latest ABIs

- [ ] **Test deployed contracts** - Run integration tests against testnet
  ```bash
  NETWORK=sepolia npm test
  ```

### 6. Indexer Updates (if applicable)

- [ ] **Rebuild indexer** - If contract events changed
  ```bash
  cd applications/liquid-liberty-indexer/subgraph/lmkt-subquery
  npm run build:sepolia
  ```

- [ ] **Deploy indexer** - Push to SubQuery network
  ```bash
  npm run publish:sepolia
  ```

- [ ] **Verify indexing** - Check GraphQL endpoint
  ```bash
  curl http://localhost:3000/graphql \
    -d '{"query": "{ candles(first:1) { nodes { id } } }"}'
  ```

- [ ] **Monitor sync progress** - Ensure indexer catches up

### 7. API Deployment (if applicable)

- [ ] **Deploy API functions** - Push to Netlify
  ```bash
  cd applications/liquid-liberty-api
  npm run deploy
  ```

- [ ] **Test endpoints** - Verify all functions work
  ```bash
  npm run test:signature
  ```

- [ ] **Check environment variables** - Ensure all secrets set
- [ ] **Monitor function logs** - Check for errors

### 8. Frontend Deployment (if applicable)

- [ ] **Build production** - Create optimized build
  ```bash
  cd applications/liquid-liberty-frontend
  npm run build
  ```

- [ ] **Deploy to Netlify** - Push changes
  ```bash
  git push  # Auto-deploys via Netlify
  ```

- [ ] **Test production build** - Verify deployed site
  ```bash
  npm run preview  # Test locally first
  ```

- [ ] **Check bundle size** - Ensure no bloat
- [ ] **Lighthouse audit** - Check performance scores

### 9. Testing & Validation

- [ ] **Run full test suite** - All applications
  ```bash
  cd applications/liquid-liberty-contracts && npm test
  cd applications/liquid-liberty-api && npm test
  cd applications/liquid-liberty-frontend && npm test
  cd applications/platform-integration-tests && npm run test:all
  ```

- [ ] **Run parity tests** - Verify monorepo vs applications
  ```bash
  cd applications/platform-integration-tests
  npm run test:parity
  ```

- [ ] **Manual testing** - Test critical user flows
  - Wallet connection
  - Listing creation
  - LMKT trading
  - Purchase flow

- [ ] **Cross-browser testing** - Check Chrome, Firefox, Safari
- [ ] **Mobile testing** - Test responsive design

### 10. Monitoring & Observability

- [ ] **Check error logs** - Review for new errors
  - Netlify function logs
  - Browser console errors
  - Contract events

- [ ] **Monitor metrics** - Check key metrics
  - API response times
  - Frontend load times
  - Gas usage (contracts)
  - Indexer sync speed

- [ ] **Set up alerts** - For critical issues
- [ ] **Review analytics** - Check user impact

---

## 📊 Deployment Verification

### Production Checklist

Before merging to `main` and deploying to production:

- [ ] **All tests pass** - Including E2E and parity tests
- [ ] **Code reviewed** - At least one approval
- [ ] **Documentation updated** - README, API docs, etc.
- [ ] **No breaking changes** - Or migration path documented
- [ ] **Backwards compatible** - With existing deployments
- [ ] **Environment variables set** - In production environment
- [ ] **Secrets rotated** - If any were exposed
- [ ] **Database migrations** - If schema changed
- [ ] **Rollback plan** - Know how to revert if needed

### Deployment Commands

```bash
# 1. Merge to main
git checkout main
git merge <feature-branch>
git push origin main

# 2. Tag release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# 3. Deploy contracts (production)
cd applications/liquid-liberty-contracts
npm run deploy:pulse  # or mainnet

# 4. Deploy indexer
cd applications/liquid-liberty-indexer/subgraph/lmkt-subquery
npm run build:pulse
npm run publish:pulse

# 5. Deploy API (auto via Netlify)
# Verify: https://app.netlify.com/

# 6. Deploy frontend (auto via Netlify)
# Verify: https://liquid-liberty.com
```

---

## 🔍 Post-Deployment Monitoring

### First Hour After Deployment

- [ ] **Monitor error rates** - Check for spikes
- [ ] **Check user reports** - Discord, Twitter, support
- [ ] **Verify functionality** - Test critical paths manually
- [ ] **Review logs** - Look for unexpected errors
- [ ] **Monitor gas prices** - For contract interactions
- [ ] **Check indexer status** - Ensure still syncing

### First Day After Deployment

- [ ] **Review metrics** - Compare to baseline
- [ ] **Check performance** - Response times, load times
- [ ] **User feedback** - Collect and address issues
- [ ] **Bug reports** - Track and prioritize fixes
- [ ] **Documentation feedback** - Improve based on questions

---

## 🚨 Rollback Procedures

If deployment fails or causes issues:

### 1. Frontend Rollback
```bash
# Netlify: Revert to previous deploy in dashboard
# Or:
git revert <commit-hash>
git push
```

### 2. API Rollback
```bash
# Netlify: Revert to previous deploy
# Or redeploy previous version
```

### 3. Contracts Rollback
```bash
# Cannot rollback deployed contracts!
# Options:
# 1. Deploy new version with fixes
# 2. Use proxy pattern to upgrade
# 3. Pause contract if emergency
```

### 4. Indexer Rollback
```bash
# Redeploy previous version
npm run publish:sepolia -- --version <previous-version>
```

---

## 📝 Version Tracking

### Semantic Versioning

Follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

**Examples:**
- `1.0.0` → `1.0.1` - Bug fix
- `1.0.1` → `1.1.0` - New feature
- `1.1.0` → `2.0.0` - Breaking change

### Tagging Releases

```bash
# Create annotated tag
git tag -a v1.2.3 -m "Release v1.2.3: Description"

# Push tags
git push origin v1.2.3

# Push all tags
git push --tags

# List tags
git tag -l
```

---

## 📚 Communication

### Team Notifications

- [ ] **Slack/Discord** - Notify team of deployment
- [ ] **Release notes** - Share what changed
- [ ] **Breaking changes** - Warn about migrations needed
- [ ] **Dependencies** - If other teams affected

### User Communications

- [ ] **Changelog** - Update public changelog
- [ ] **Twitter/Social** - Announce major features
- [ ] **Blog post** - For significant updates
- [ ] **Documentation** - User-facing guides

---

## 🔐 Security Considerations

### After Security-Related Commits

- [ ] **Rotate secrets** - If any were exposed (even in history)
- [ ] **Audit logs** - Check for suspicious activity
- [ ] **Update dependencies** - Patch vulnerabilities
- [ ] **Notify users** - If security issue affected them
- [ ] **Document incident** - Post-mortem for major issues

### Security Checklist

- [ ] **No secrets committed** - Double-check
- [ ] **Dependencies audited** - No known vulnerabilities
- [ ] **Access control** - Proper permissions set
- [ ] **HTTPS enforced** - All endpoints secure
- [ ] **Rate limiting** - API endpoints protected

---

## 📊 Metrics to Track

### Application Health

- [ ] **Uptime** - 99.9% target
- [ ] **Error rate** - <0.1% target
- [ ] **Response time** - <500ms API, <3s frontend load
- [ ] **Test coverage** - >80% target

### User Metrics

- [ ] **Active users** - Daily/monthly
- [ ] **Transactions** - Successful vs failed
- [ ] **User satisfaction** - Net Promoter Score
- [ ] **Support tickets** - Volume and resolution time

---

## ✅ Final Post-Commit Checklist

```bash
# 1. Push to remote
git push origin <branch>

# 2. Monitor CI/CD
gh run watch

# 3. Update documentation
# - CHANGELOG.md
# - README.md
# - API docs

# 4. Test deployments
npm run test:all

# 5. Monitor for 1 hour
# - Error logs
# - User reports
# - Metrics

# 6. Celebrate! 🎉
echo "Deployment successful!"
```

---

**Remember: Deployment is not complete until monitoring confirms stability!**
