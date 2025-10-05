# 🌐 Liquid Liberty Serverless API

Netlify serverless functions providing backend services for the Liquid Liberty Marketplace. Handles IPFS uploads, EIP-712 signature generation, content moderation, and secure data proxying.

## 📋 Overview

This standalone serverless API application provides critical backend functionality:

- **IPFS Integration**: Upload images and metadata to IPFS via Pinata
- **EIP-712 Signatures**: Generate cryptographic signatures for listing creation
- **Content Moderation**: Filter inappropriate content and banned words
- **Secure Proxying**: Proxy requests to blockchain indexer with validation
- **Vendor Simulations**: Handle vendor profile data uploads

## 🏗️ Architecture

### Serverless Functions

All functions are deployed as Netlify Edge Functions:

1. **upload-images-to-ipfs.js**
   - Upload multiple images to Pinata IPFS
   - Store listing metadata
   - Return IPFS hashes and gateway URLs

2. **create-listing-signature.js**
   - Generate EIP-712 signatures for listing creation
   - Uses trusted signer private key
   - Returns v, r, s signature components

3. **moderate.js**
   - Content filtering for listings
   - Banned words detection
   - Inappropriate content checking

4. **secure-subquery-proxy.js**
   - Secure proxy to blockchain indexer
   - Request validation
   - Error handling

5. **submit-vendor-simulation.js**
   - Upload vendor simulation data to IPFS
   - Store vendor profiles
   - Return IPFS reference

6. **subquery-proxy.js**
   - Simple proxy to SubQuery endpoint
   - CORS handling

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or later
- Netlify account
- Pinata account (for IPFS)
- Ethereum wallet with private key (for signatures)

### Installation

```bash
# Install dependencies
npm install

# Install Netlify CLI globally
npm install -g netlify-cli

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

Edit `.env` file:

```bash
# Ethereum - Trusted signer for EIP-712
SIGNER_PRIVATE_KEY=your_private_key_here
JSON_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Contract addresses
LISTING_MANAGER_ADDRESS=0x...
TREASURY_ADDRESS=0x...

# Pinata IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret

# Allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourapp.netlify.app
```

### Local Development

```bash
# Start local dev server
npm run dev

# Or use Netlify CLI
netlify dev

# Functions available at:
# http://localhost:8888/.netlify/functions/{function-name}
```

### Testing Functions

```bash
# Test signature generation
curl -X POST http://localhost:8888/.netlify/functions/create-listing-signature \
  -H "Content-Type: application/json" \
  -d '{
    "listingType": 0,
    "dataIdentifier": "ipfs://QmTest",
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "feeInToken": "10000000000000000000",
    "deadline": 1699999999
  }'

# Test IPFS upload
curl -X POST http://localhost:8888/.netlify/functions/upload-images-to-ipfs \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

## 📡 API Endpoints

### 1. Upload Images to IPFS

**Endpoint**: `POST /.netlify/functions/upload-images-to-ipfs`

**Request Body**:
```json
{
  "images": [
    {
      "data": "data:image/jpeg;base64,/9j/4AAQ...",
      "name": "photo1.jpg",
      "type": "image/jpeg"
    }
  ],
  "listingData": {
    "title": "My Listing",
    "description": "Description here",
    "listingType": "item",
    "userAddress": "0x...",
    "category": "electronics",
    "price": 100,
    "zipCode": "10001"
  }
}
```

**Response**:
```json
{
  "success": true,
  "listingMetadataHash": "QmXXX...",
  "listingMetadataUrl": "ipfs://QmXXX...",
  "images": [
    {
      "originalName": "photo1.jpg",
      "ipfsHash": "QmYYY...",
      "ipfsUrl": "ipfs://QmYYY...",
      "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmYYY...",
      "size": 123456
    }
  ]
}
```

### 2. Create Listing Signature

**Endpoint**: `POST /.netlify/functions/create-listing-signature`

**Request Body**:
```json
{
  "listingType": 0,
  "dataIdentifier": "ipfs://QmXXX...",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "feeInToken": "10000000000000000000",
  "deadline": 1699999999
}
```

**Response**:
```json
{
  "success": true,
  "signature": {
    "v": 27,
    "r": "0x1234...",
    "s": "0x5678..."
  },
  "signer": "0xABC...",
  "message": "Signature generated successfully"
}
```

### 3. Content Moderation

**Endpoint**: `POST /.netlify/functions/moderate`

**Request Body**:
```json
{
  "title": "Listing Title",
  "description": "Listing description to check",
  "category": "electronics"
}
```

**Response**:
```json
{
  "approved": true,
  "issues": []
}
```

Or if content fails moderation:
```json
{
  "approved": false,
  "issues": [
    "Contains banned word: xxx",
    "Inappropriate content detected"
  ]
}
```

### 4. Secure Subquery Proxy

**Endpoint**: `POST /.netlify/functions/secure-subquery-proxy`

**Request Body**:
```json
{
  "query": "{ candles { id timestamp open high low close } }",
  "variables": {},
  "network": "sepolia"
}
```

**Response**:
```json
{
  "data": {
    "candles": [...]
  }
}
```

### 5. Submit Vendor Simulation

**Endpoint**: `POST /.netlify/functions/submit-vendor-simulation`

**Request Body**:
```json
{
  "vendorAddress": "0x...",
  "simulationData": {
    "name": "Vendor Name",
    "description": "About the vendor",
    "rating": 4.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "ipfsHash": "QmZZZ...",
  "ipfsUrl": "ipfs://QmZZZ..."
}
```

## 🔐 Security Features

### EIP-712 Signature Generation

The signature function implements EIP-712 typed data signing:

```javascript
const domain = {
  name: "ListingManager",
  version: "1",
  chainId: network.chainId,
  verifyingContract: LISTING_MANAGER_ADDRESS
};

const types = {
  CreateListing: [
    { name: "listingType", type: "uint8" },
    { name: "dataIdentifier", type: "string" },
    { name: "user", type: "address" },
    { name: "feeInToken", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ]
};

const signature = await signer._signTypedData(domain, types, message);
```

### CORS Protection

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

const origin = event.headers.origin;
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
```

### Input Validation

All endpoints validate:
- Required fields present
- Data types correct
- Addresses are valid Ethereum addresses
- Amounts are valid numbers
- Deadlines are future timestamps

### Rate Limiting

Implemented via Netlify:
- 1000 requests per hour per IP
- Burst protection
- DDoS mitigation

## 🌐 Deployment

### Netlify Configuration

The `netlify.toml` configures the serverless functions:

```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@pinata/sdk"]
  included_files = ["netlify/functions/banned-words.json"]

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Deploy to Netlify

```bash
# Login to Netlify
netlify login

# Link to site (first time)
netlify link

# Deploy to production
npm run deploy

# Or auto-deploy via Git
git push origin main
# Netlify will auto-deploy
```

### Environment Variables in Netlify

Set in Netlify Dashboard > Site Settings > Environment Variables:

1. `SIGNER_PRIVATE_KEY`
2. `JSON_RPC_URL`
3. `LISTING_MANAGER_ADDRESS`
4. `PINATA_API_KEY`
5. `PINATA_API_SECRET`
6. `SUBQUERY_SEPOLIA_URL`
7. `SUBQUERY_PULSE_URL`
8. `ALLOWED_ORIGINS`

## 🔗 Integration with Other Apps

### Contracts Integration
- Uses contract addresses for signature generation
- Validates against on-chain data
- Syncs addresses from deployment

### Frontend Integration
- Frontend calls API functions for backend operations
- Receives IPFS hashes for metadata
- Gets signatures for listing creation

### Indexer Integration
- Proxies queries to indexer GraphQL API
- Validates and transforms responses
- Caches frequent queries

## 📊 Function Details

### upload-images-to-ipfs.js

**Process Flow**:
1. Receive base64 encoded images
2. Convert to Buffer
3. Upload each image to Pinata
4. Collect IPFS hashes
5. Create metadata JSON with image references
6. Upload metadata to Pinata
7. Return all IPFS hashes

**Features**:
- Multi-image upload
- Metadata bundling
- Gateway URL generation
- Error handling per image

### create-listing-signature.js

**Process Flow**:
1. Receive listing parameters
2. Validate all inputs
3. Load trusted signer wallet
4. Create EIP-712 typed data
5. Sign with private key
6. Split signature into v, r, s
7. Return signature components

**Security**:
- Trusted signer only
- Deadline validation
- Address verification
- Network-aware signing

### moderate.js

**Process Flow**:
1. Receive content (title, description)
2. Check against banned words list
3. Check for profanity
4. Validate content appropriateness
5. Return approval status + issues

**Features**:
- Banned words detection
- Profanity filter
- Category-specific rules
- Detailed issue reporting

## 🧪 Testing

### Unit Tests

```bash
# Test signature verification
npm run test:signature

# Test signature mismatch debugging
npm run test:debug
```

### Integration Tests

```bash
# Test with curl
./test-api.sh

# Test with Postman
# Import postman-collection.json
```

### Local Function Testing

```bash
# Serve functions locally
npm run test:local

# Test individual function
netlify functions:invoke upload-images-to-ipfs --payload '{"test": true}'
```

## 🐛 Troubleshooting

### Common Issues

**Signature Verification Fails**
- Check signer private key matches contract's trusted signer
- Verify contract address is correct
- Ensure chainId matches network
- Check deadline is in future

**IPFS Upload Fails**
- Verify Pinata API keys
- Check image size limits (< 10MB)
- Ensure base64 encoding is correct
- Check Pinata service status

**CORS Errors**
- Add origin to ALLOWED_ORIGINS
- Check headers in request
- Verify OPTIONS request handling

### Debug Mode

Enable debug logging:
```bash
# Set in .env or Netlify
DEBUG=true
NODE_ENV=development
```

### Logs

View function logs:
```bash
# Local
netlify dev --debug

# Production (Netlify Dashboard)
Functions > {function-name} > Logs
```

## 📈 Monitoring

### Function Metrics

Monitor in Netlify Dashboard:
- Invocation count
- Error rate
- Execution duration
- Bandwidth usage

### Alerts

Set up alerts for:
- High error rate (>5%)
- Slow execution (>10s)
- Failed uploads
- Invalid signatures

## 🔄 Update Process

### Updating Contract Addresses

When contracts are redeployed:

1. Contracts app deploys and syncs addresses
2. Update `.env` or Netlify environment variables
3. Redeploy functions:
```bash
netlify deploy --prod
```

### Updating Functions

```bash
# Make changes to function
vim netlify/functions/your-function.js

# Test locally
netlify dev

# Deploy
git commit -am "Update function"
git push
# Auto-deploys via Netlify
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add/update functions
4. Test locally and in staging
5. Submit pull request

## 🆘 Support

- Documentation: See `ARCHITECTURE.md` for detailed flow diagrams
- Netlify Docs: https://docs.netlify.com/functions/overview/
- Pinata Docs: https://docs.pinata.cloud/
- Issues: Report at GitHub issues
