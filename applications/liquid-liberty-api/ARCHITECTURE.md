# 🏗️ Serverless API Architecture

## System Overview

The Liquid Liberty Serverless API provides backend services through Netlify Edge Functions. These functions handle operations that require server-side execution, including cryptographic operations, IPFS uploads, and secure data proxying.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                      │
│  - React DApp                                               │
│  - User interactions                                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼ (HTTPS Requests)
┌─────────────────────────────────────────────────────────────┐
│                  NETLIFY EDGE NETWORK                        │
│  - Global CDN                                               │
│  - DDoS Protection                                          │
│  - Request Routing                                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVERLESS FUNCTIONS LAYER                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Image Upload Function                         │  │
│  │  POST /upload-images-to-ipfs                         │  │
│  │                                                       │  │
│  │  1. Validate images                                   │  │
│  │  2. Convert base64 → Buffer                          │  │
│  │  3. Upload to Pinata IPFS                            │  │
│  │  4. Create metadata JSON                             │  │
│  │  5. Upload metadata to IPFS                          │  │
│  │  6. Return IPFS hashes                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Signature Generation Function                    │  │
│  │  POST /create-listing-signature                      │  │
│  │                                                       │  │
│  │  1. Validate listing parameters                       │  │
│  │  2. Load trusted signer wallet                       │  │
│  │  3. Create EIP-712 typed data                        │  │
│  │  4. Sign with private key                            │  │
│  │  5. Return signature (v, r, s)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Content Moderation Function                     │  │
│  │  POST /moderate                                       │  │
│  │                                                       │  │
│  │  1. Check banned words                                │  │
│  │  2. Profanity detection                              │  │
│  │  3. Content appropriateness                          │  │
│  │  4. Return approval/rejection                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Secure Proxy Function                          │  │
│  │  POST /secure-subquery-proxy                         │  │
│  │                                                       │  │
│  │  1. Validate request                                 │  │
│  │  2. Proxy to indexer GraphQL                         │  │
│  │  3. Transform response                               │  │
│  │  4. Return data                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Vendor Simulation Function                      │  │
│  │  POST /submit-vendor-simulation                      │  │
│  │                                                       │  │
│  │  1. Validate vendor data                             │  │
│  │  2. Upload to IPFS                                   │  │
│  │  3. Return IPFS reference                            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬───────────────────────────────┬──────────────────────┘
       │                               │
       ▼                               ▼
┌─────────────────┐          ┌──────────────────────┐
│  Pinata IPFS    │          │  Blockchain Indexer  │
│  - Image storage│          │  - GraphQL API       │
│  - Metadata     │          │  - Chart data        │
└─────────────────┘          └──────────────────────┘
```

## Function Flow Diagrams

### 1. Image Upload Flow

```
User submits listing with images
         │
         ▼
┌──────────────────────────────────────┐
│ Frontend prepares request            │
│                                      │
│ 1. Read image files                  │
│ 2. Convert to base64                 │
│ 3. Prepare listing metadata          │
│ 4. Bundle into JSON payload          │
└──────────────┬───────────────────────┘
               │
               ▼ (POST)
┌──────────────────────────────────────┐
│ Netlify Edge receives request        │
│ Route: /.netlify/functions/          │
│        upload-images-to-ipfs         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Function: upload-images-to-ipfs.js   │
│                                      │
│ Step 1: Validate request             │
│ ✓ Check images array exists          │
│ ✓ Check listingData exists           │
│ ✓ Validate image formats             │
│ ✓ Check file sizes (<10MB)           │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 2: Process each image           │
│                                      │
│ for (image of images) {              │
│   // Extract base64 data             │
│   const base64Data = image.data      │
│     .replace(/^data:image\/\w+;      │
│              base64,/, '');          │
│                                      │
│   // Convert to Buffer               │
│   const buffer = Buffer.from(        │
│     base64Data,                      │
│     'base64'                         │
│   );                                 │
│                                      │
│   // Create readable stream          │
│   const stream = Readable.from(      │
│     buffer                           │
│   );                                 │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 3: Upload images to Pinata      │
│                                      │
│ const result = await pinata          │
│   .pinFileToIPFS(stream, {           │
│     pinataMetadata: {                │
│       name: image.name               │
│     }                                │
│   });                                │
│                                      │
│ Store result:                        │
│ {                                    │
│   IpfsHash: "QmXXX...",              │
│   PinSize: 123456,                   │
│   Timestamp: "2024-01-01..."         │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 4: Collect image references     │
│                                      │
│ imageReferences = [                  │
│   {                                  │
│     originalName: "photo1.jpg",      │
│     ipfsHash: "QmXXX...",            │
│     ipfsUrl: "ipfs://QmXXX...",      │
│     gatewayUrl: "https://           │
│       gateway.pinata.cloud/          │
│       ipfs/QmXXX...",                │
│     size: 123456                     │
│   },                                 │
│   ...                                │
│ ]                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 5: Create metadata JSON         │
│                                      │
│ metadata = {                         │
│   title: listingData.title,          │
│   description: listingData.desc,     │
│   category: listingData.category,    │
│   price: listingData.price,          │
│   images: imageReferences,           │
│   createdAt: Date.now(),             │
│   userAddress: listingData.user      │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 6: Upload metadata to Pinata    │
│                                      │
│ const metadataResult = await pinata  │
│   .pinJSONToIPFS(metadata, {         │
│     pinataMetadata: {                │
│       name: `listing-${user}-        │
│              ${timestamp}.json`      │
│     }                                │
│   });                                │
│                                      │
│ metadataHash = metadataResult        │
│   .IpfsHash                          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 7: Return response              │
│                                      │
│ {                                    │
│   success: true,                     │
│   listingMetadataHash: "QmZZZ...",   │
│   listingMetadataUrl:                │
│     "ipfs://QmZZZ...",               │
│   images: imageReferences            │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
        Frontend receives response
      Uses IPFS hash for listing
```

### 2. EIP-712 Signature Generation Flow

```
User requests to create listing
         │
         ▼
┌──────────────────────────────────────┐
│ Frontend prepares signature request  │
│                                      │
│ {                                    │
│   listingType: 0,  // item           │
│   dataIdentifier: "ipfs://QmXXX",    │
│   userAddress: "0x123...",           │
│   feeInToken: "10000000000000000000",│
│   deadline: timestamp + 3600         │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼ (POST)
┌──────────────────────────────────────┐
│ Netlify Edge receives request        │
│ Route: /.netlify/functions/          │
│        create-listing-signature      │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Function: create-listing-            │
│           signature.js               │
│                                      │
│ Step 1: Validate inputs              │
│ ✓ listingType is number (0-255)     │
│ ✓ dataIdentifier is string           │
│ ✓ userAddress is valid Ethereum addr │
│ ✓ feeInToken is valid uint256        │
│ ✓ deadline is future timestamp       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 2: Load trusted signer          │
│                                      │
│ const provider = new ethers          │
│   .JsonRpcProvider(                  │
│     process.env.JSON_RPC_URL         │
│   );                                 │
│                                      │
│ const signer = new ethers.Wallet(    │
│   process.env.SIGNER_PRIVATE_KEY,    │
│   provider                           │
│ );                                   │
│                                      │
│ const network = await provider       │
│   .getNetwork();                     │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 3: Create EIP-712 domain        │
│                                      │
│ const domain = {                     │
│   name: "ListingManager",            │
│   version: "1",                      │
│   chainId: network.chainId,          │
│   verifyingContract:                 │
│     process.env.LISTING_MANAGER_     │
│     ADDRESS                          │
│ };                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 4: Define types                 │
│                                      │
│ const types = {                      │
│   CreateListing: [                   │
│     {                                │
│       name: "listingType",           │
│       type: "uint8"                  │
│     },                               │
│     {                                │
│       name: "dataIdentifier",        │
│       type: "string"                 │
│     },                               │
│     {                                │
│       name: "user",                  │
│       type: "address"                │
│     },                               │
│     {                                │
│       name: "feeInToken",            │
│       type: "uint256"                │
│     },                               │
│     {                                │
│       name: "deadline",              │
│       type: "uint256"                │
│     }                                │
│   ]                                  │
│ };                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 5: Create message               │
│                                      │
│ const message = {                    │
│   listingType: listingType,          │
│   dataIdentifier: dataIdentifier,    │
│   user: userAddress,                 │
│   feeInToken: feeInToken,            │
│   deadline: deadline                 │
│ };                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 6: Sign typed data              │
│                                      │
│ const signature = await signer       │
│   ._signTypedData(                   │
│     domain,                          │
│     types,                           │
│     message                          │
│   );                                 │
│                                      │
│ // Signature is 65 bytes:            │
│ // r (32) + s (32) + v (1)           │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 7: Split signature              │
│                                      │
│ const sig = ethers.Signature         │
│   .from(signature);                  │
│                                      │
│ const signatureComponents = {        │
│   v: sig.v,                          │
│   r: sig.r,                          │
│   s: sig.s                           │
│ };                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 8: Return signature             │
│                                      │
│ {                                    │
│   success: true,                     │
│   signature: {                       │
│     v: 27,                           │
│     r: "0x1234...",                  │
│     s: "0x5678..."                   │
│   },                                 │
│   signer: "0xABC...",                │
│   message: "Signature generated"     │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
        Frontend receives signature
     Uses it to call contract
```

### 3. Content Moderation Flow

```
User submits listing content
         │
         ▼
┌──────────────────────────────────────┐
│ Frontend sends content for validation│
│                                      │
│ {                                    │
│   title: "Listing Title",            │
│   description: "Full description...", │
│   category: "electronics"            │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼ (POST)
┌──────────────────────────────────────┐
│ Function: moderate.js                │
│                                      │
│ Step 1: Load banned words list       │
│ const bannedWords = require(         │
│   './banned-words.json'              │
│ );                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 2: Check banned words           │
│                                      │
│ const content = (                    │
│   title + ' ' + description          │
│ ).toLowerCase();                     │
│                                      │
│ const foundBannedWords = [];         │
│                                      │
│ for (const word of bannedWords) {    │
│   if (content.includes(              │
│     word.toLowerCase()               │
│   )) {                               │
│     foundBannedWords.push(word);     │
│   }                                  │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 3: Profanity detection          │
│                                      │
│ const { isProfane } =                │
│   require('content-checker');        │
│                                      │
│ const hasProfanity = isProfane(      │
│   content                            │
│ );                                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 4: Category-specific rules      │
│                                      │
│ const rules = {                      │
│   electronics: {                     │
│     requiredWords: ['condition'],    │
│     minLength: 50                    │
│   },                                 │
│   services: {                        │
│     requiredWords: ['available'],    │
│     minLength: 100                   │
│   }                                  │
│ };                                   │
│                                      │
│ const categoryRule = rules[category];│
│ if (categoryRule) {                  │
│   // Apply category rules            │
│ }                                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Step 5: Build response               │
│                                      │
│ const issues = [];                   │
│                                      │
│ if (foundBannedWords.length > 0) {   │
│   issues.push(                       │
│     `Contains banned words: ${       │
│       foundBannedWords.join(', ')    │
│     }`                               │
│   );                                 │
│ }                                    │
│                                      │
│ if (hasProfanity) {                  │
│   issues.push(                       │
│     "Inappropriate content detected" │
│   );                                 │
│ }                                    │
│                                      │
│ return {                             │
│   approved: issues.length === 0,     │
│   issues: issues                     │
│ };                                   │
└──────────────┬───────────────────────┘
               │
               ▼
        Frontend receives result
     Allows/blocks submission
```

## Security Architecture

### 1. Private Key Management

```
┌──────────────────────────────────────┐
│ Netlify Environment Variables        │
│ (Encrypted at rest)                  │
│                                      │
│ SIGNER_PRIVATE_KEY=0x...             │
└──────────────┬───────────────────────┘
               │ (Loaded at runtime)
               ▼
┌──────────────────────────────────────┐
│ Function Execution Context           │
│ (Ephemeral, destroyed after use)     │
│                                      │
│ const key = process.env              │
│   .SIGNER_PRIVATE_KEY                │
│                                      │
│ const signer = new Wallet(key)       │
│                                      │
│ // Use for signing                   │
│                                      │
│ // Key never exposed to client       │
└──────────────────────────────────────┘
```

### 2. CORS Protection

```
Request from https://attacker.com
         │
         ▼
┌──────────────────────────────────────┐
│ Netlify Edge Function                │
│                                      │
│ const origin = event.headers.origin; │
│                                      │
│ const allowedOrigins = [             │
│   'https://yourapp.netlify.app',     │
│   'http://localhost:5173'            │
│ ];                                   │
│                                      │
│ if (!allowedOrigins.includes(        │
│   origin                             │
│ )) {                                 │
│   return {                           │
│     statusCode: 403,                 │
│     body: 'Forbidden'                │
│   };                                 │
│ }                                    │
└──────────────────────────────────────┘
```

### 3. Input Sanitization

```
┌──────────────────────────────────────┐
│ Validate Ethereum Address            │
│                                      │
│ function isValidAddress(addr) {      │
│   return /^0x[a-fA-F0-9]{40}$/       │
│     .test(addr);                     │
│ }                                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Validate Amount                      │
│                                      │
│ function isValidAmount(amount) {     │
│   try {                              │
│     const bn = BigInt(amount);       │
│     return bn > 0n;                  │
│   } catch {                          │
│     return false;                    │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Sanitize Strings                     │
│                                      │
│ function sanitize(str) {             │
│   return str                         │
│     .replace(/<script>/gi, '')       │
│     .replace(/javascript:/gi, '')    │
│     .trim()                          │
│     .slice(0, 1000); // Max length   │
│ }                                    │
└──────────────────────────────────────┘
```

## Error Handling

### Standard Error Response

```javascript
try {
  // Function logic
} catch (error) {
  console.error('Function error:', error);

  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      error: error.message,
      code: error.code || 'INTERNAL_ERROR'
    })
  };
}
```

### Error Codes

```
┌────────────┬──────────────────────────────────┐
│ Code       │ Description                      │
├────────────┼──────────────────────────────────┤
│ 400        │ Bad Request - Invalid input      │
│ 401        │ Unauthorized - Missing auth      │
│ 403        │ Forbidden - CORS violation       │
│ 404        │ Not Found - Invalid endpoint     │
│ 413        │ Payload Too Large - >10MB        │
│ 429        │ Too Many Requests - Rate limited │
│ 500        │ Internal Server Error            │
│ 502        │ Bad Gateway - External API fail  │
│ 503        │ Service Unavailable - IPFS down  │
└────────────┴──────────────────────────────────┘
```

## Performance Optimizations

### 1. Parallel Uploads

```javascript
// Upload images in parallel
const uploadPromises = images.map(image =>
  uploadToPinata(image)
);

const results = await Promise.all(uploadPromises);
```

### 2. Response Caching

```javascript
const headers = {
  'Cache-Control': 'public, max-age=3600',
  'ETag': generateETag(data)
};
```

### 3. Compression

```javascript
const zlib = require('zlib');

const compressed = zlib.gzipSync(
  JSON.stringify(data)
);

return {
  statusCode: 200,
  headers: {
    'Content-Encoding': 'gzip'
  },
  body: compressed
};
```

## Integration Points

### Smart Contracts
- Generates signatures for ListingManager
- Validates contract addresses
- Checks network compatibility

### Blockchain Indexer
- Proxies GraphQL queries
- Caches chart data
- Transforms responses

### Frontend DApp
- Receives API calls
- Returns IPFS hashes
- Provides signatures

### External Services
- Pinata IPFS
- Ethereum RPC providers
- Content moderation APIs
