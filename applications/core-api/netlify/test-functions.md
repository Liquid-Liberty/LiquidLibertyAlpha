# Testing Netlify Functions Locally

This guide shows you how to test the Netlify functions locally before deploying.

## Prerequisites

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Create a `.env` file in your project root with your environment variables:
```bash
SIGNER_PRIVATE_KEY=your_private_key_here
JSON_RPC_URL=https://your-rpc-endpoint
LISTING_MANAGER_ADDRESS=0x...
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
```

## Running Functions Locally

Start the local development server:
```bash
netlify dev
```

This will start your functions at `http://localhost:8888/.netlify/functions/`

## Testing upload-images-to-ipfs Function

### 1. Prepare Test Data

Create a simple HTML file to test image uploads:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test IPFS Upload</title>
</head>
<body>
    <input type="file" id="imageInput" accept="image/*" multiple>
    <button onclick="testUpload()">Test Upload</button>
    <div id="result"></div>

    <script>
        async function testUpload() {
            const files = document.getElementById('imageInput').files;
            if (files.length === 0) {
                alert('Please select images');
                return;
            }

            // Convert files to base64
            const images = [];
            for (let file of files) {
                const base64 = await fileToBase64(file);
                images.push({
                    data: base64,
                    name: file.name,
                    type: file.type
                });
            }

            // Test data
            const listingData = {
                title: "Test Listing",
                description: "This is a test listing",
                listingType: "item",
                userAddress: "0x1234567890123456789012345678901234567890",
                category: "electronics",
                price: 100,
                zipCode: "10001"
            };

            try {
                const response = await fetch('http://localhost:8888/.netlify/functions/upload-images-to-ipfs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images, listingData })
                });

                const result = await response.json();
                document.getElementById('result').innerHTML = `
                    <h3>Upload Result:</h3>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                `;
            } catch (error) {
                document.getElementById('result').innerHTML = `Error: ${error.message}`;
            }
        }

        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
            });
        }
    </script>
</body>
</html>
```

### 2. Test with cURL

You can also test with cURL (replace the base64 data with actual image data):

```bash
curl -X POST http://localhost:8888/.netlify/functions/upload-images-to-ipfs \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "name": "test.jpg",
        "type": "image/jpeg"
      }
    ],
    "listingData": {
      "title": "Test Listing",
      "description": "Test description",
      "listingType": "item",
      "userAddress": "0x1234567890123456789012345678901234567890",
      "category": "electronics",
      "price": 100,
      "zipCode": "10001"
    }
  }'
```

## Testing create-listing-signature Function

Test the signature generation:

```bash
curl -X POST http://localhost:8888/.netlify/functions/create-listing-signature \
  -H "Content-Type: application/json" \
  -d '{
    "listingType": 0,
    "dataIdentifier": "ipfs://QmTestHash123",
    "userAddress": "0x1234567890123456789012345678901234567890",
    "feeInToken": "10000000000000000000",
    "deadline": 1234567890
  }'
```

## Testing submit-vendor-simulation Function

Test vendor simulation upload:

```bash
curl -X POST http://localhost:8888/.netlify/functions/submit-vendor-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "wallet": "0x1234567890123456789012345678901234567890",
    "totalRevenue": 1000,
    "annualSales": 50000,
    "cardPercentage": 20,
    "logo": "https://example.com/logo.png"
  }'
```

## Expected Responses

### Successful upload-images-to-ipfs Response:
```json
{
  "success": true,
  "listingMetadataHash": "Qm...",
  "listingMetadataUrl": "ipfs://Qm...",
  "images": [
    {
      "originalName": "test.jpg",
      "ipfsHash": "Qm...",
      "ipfsUrl": "ipfs://Qm...",
      "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
      "size": 12345
    }
  ]
}
```

### Successful create-listing-signature Response:
```json
{
  "signature": "0x..."
}
```

### Successful submit-vendor-simulation Response:
```json
{
  "ipfsHash": "Qm..."
}
```

## Troubleshooting Local Testing

### Common Issues:

1. **Port conflicts**: If port 8888 is busy, Netlify CLI will suggest an alternative port
2. **Environment variables**: Make sure your `.env` file is in the project root
3. **CORS**: Local functions allow all origins for testing
4. **Function not found**: Check that the function files exist and export `handler` functions

### Debug Mode:

Run with debug logging:
```bash
DEBUG=* netlify dev
```

### Function Logs:

Check the terminal output for function execution logs and any errors.

## Next Steps

Once you've tested locally and everything works:

1. Commit your changes to Git
2. Push to your repository
3. Netlify will automatically deploy your functions
4. Test the deployed functions at `https://your-site.netlify.app/.netlify/functions/function-name`
