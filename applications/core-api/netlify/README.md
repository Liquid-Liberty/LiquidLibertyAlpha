# Netlify Functions for LiquidLiberty Marketplace

This directory contains serverless functions that run on Netlify to handle backend operations for the marketplace.

## Functions Overview

### 1. `create-listing-signature.js`
Generates EIP-712 signatures for listing creation on the blockchain.

**Environment Variables Required:**
- `SIGNER_PRIVATE_KEY` - Private key of the trusted signer wallet
- `JSON_RPC_URL` - Ethereum RPC endpoint URL
- `LISTING_MANAGER_ADDRESS` - Contract address of the ListingManager

**Usage:**
```javascript
POST /.netlify/functions/create-listing-signature
{
  "listingType": 0,
  "dataIdentifier": "ipfs://Qm...",
  "userAddress": "0x...",
  "feeInToken": "10000000000000000000",
  "deadline": 1234567890
}
```

### 2. `upload-images-to-ipfs.js`
Uploads images and listing metadata to Pinata IPFS.

**Environment Variables Required:**
- `PINATA_API_KEY` - Your Pinata API key
- `PINATA_API_SECRET` - Your Pinata API secret

**Usage:**
```javascript
POST /.netlify/functions/upload-images-to-ipfs
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

**Response:**
```javascript
{
  "success": true,
  "listingMetadataHash": "Qm...",
  "listingMetadataUrl": "ipfs://Qm...",
  "images": [
    {
      "originalName": "photo1.jpg",
      "ipfsHash": "Qm...",
      "ipfsUrl": "ipfs://Qm...",
      "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
      "size": 12345
    }
  ]
}
```

### 3. `submit-vendor-simulation.js`
Uploads vendor simulation data to IPFS (existing function).

## Setup Instructions

### 1. Environment Variables
Set these in your Netlify dashboard under **Site settings > Environment variables**:

```bash
# For create-listing-signature function
SIGNER_PRIVATE_KEY=your_private_key_here
JSON_RPC_URL=https://your-rpc-endpoint
LISTING_MANAGER_ADDRESS=0x...

# For upload-images-to-ipfs function
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
```

### 2. Pinata Setup
1. Create an account at [Pinata](https://pinata.cloud/)
2. Generate API keys in your dashboard
3. Add the keys to your Netlify environment variables

### 3. Local Development
To test functions locally:

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Create a `.env` file in the root directory:
```bash
SIGNER_PRIVATE_KEY=your_private_key
JSON_RPC_URL=https://your-rpc-endpoint
LISTING_MANAGER_ADDRESS=0x...
PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret
```

3. Run functions locally:
```bash
netlify dev
```

### 4. Deployment
Functions are automatically deployed when you push to your connected Git repository. Netlify will:

1. Build your project using the build command
2. Deploy the functions to the `/.netlify/functions/` endpoint
3. Make them available at `https://your-site.netlify.app/.netlify/functions/function-name`

## Security Considerations

- **Private Keys**: Never commit private keys to your repository
- **CORS**: Functions currently allow all origins (`*`) - restrict this in production
- **Rate Limiting**: Consider adding rate limiting for production use
- **API Keys**: Keep your Pinata API keys secure and rotate them regularly

## Error Handling

All functions include comprehensive error handling and return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Testing

Test your functions using tools like:
- Postman
- cURL
- Your frontend application
- Netlify function logs in the dashboard

## Troubleshooting

### Common Issues:

1. **Function not found**: Check that the function file exists and exports a `handler`
2. **Environment variables not working**: Verify they're set in Netlify dashboard
3. **CORS errors**: Check that your frontend is making requests to the correct endpoint
4. **Pinata upload failures**: Verify your API keys and check Pinata service status

### Logs:
View function logs in your Netlify dashboard under **Functions > Function name > Logs**
