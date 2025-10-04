# 🏗️ SubQuery Build Guide

## ⚠️ IMPORTANT: Always Use Specific Build Commands

**Never use `npm run build` directly** - it will fail by design to prevent environment mistakes.

## 🚀 Safe Build Commands

### For Sepolia Testnet:
```bash
npm run build:sepolia
npm run publish:sepolia
```

### For Pulse Testnet:
```bash
npm run build:pulse
npm run publish:pulse
```

### For Local Development:
```bash
npm run build:local
```

## 🔍 What Each Build Does

1. **Cleans** old build artifacts
2. **Sets environment** explicitly (VITE_DEPLOY_ENV)
3. **Generates code** with correct network config
4. **Builds project** with proper addresses
5. **Verifies build** contains expected addresses
6. **Creates network-specific YAML** file

## ✅ Build Verification

Each build automatically verifies:
- ✅ Correct treasury address in compiled JavaScript
- ✅ Correct treasury address in YAML configuration
- ✅ All expected contract addresses match network

## 🚨 If Build Fails

**Environment Error:**
```
❌ VITE_DEPLOY_ENV must be explicitly set!
```
**Solution:** Use the specific build commands above

**Address Verification Error:**
```
❌ Pulse treasury address not found in compiled code!
```
**Solution:** The build used wrong environment - try again with correct command

## 📋 Manual Verification

To manually verify a build:
```bash
node verify-build.js pulse    # or sepolia, local
```

## 🔄 Rebuild Process

If you need to rebuild and redeploy:

1. **Build for your target network:**
   ```bash
   npm run build:pulse  # or build:sepolia
   ```

2. **Verify build succeeded** (automatic)

3. **Publish to OnFinality:**
   ```bash
   npm run publish:pulse  # or publish:sepolia
   ```

4. **Wait for deployment** (10-30 minutes)

This process **guarantees** the correct addresses are compiled and deployed!