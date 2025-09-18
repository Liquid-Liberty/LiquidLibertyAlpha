// Simple endpoint test
const https = require('https');

const pulseEndpoint = 'https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart';

function makeRequest(url, query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testPulseEndpoint() {
  console.log('🔍 Testing Pulse OnFinality Endpoint...');
  console.log(`URL: ${pulseEndpoint}`);

  try {
    const metadataQuery = `{
      _metadata {
        lastProcessedHeight
        targetHeight
        chain
      }
    }`;

    const result = await makeRequest(pulseEndpoint, metadataQuery);

    if (result.data && result.data._metadata) {
      console.log('✅ Endpoint is working');
      console.log(`📊 Processed: ${result.data._metadata.lastProcessedHeight}`);
      console.log(`🎯 Target: ${result.data._metadata.targetHeight}`);

      const candleQuery = `{
        candles(first: 3) {
          nodes {
            id
            close
            trades
          }
        }
      }`;

      const candleResult = await makeRequest(pulseEndpoint, candleQuery);
      console.log(`📈 Candles found: ${candleResult.data?.candles?.nodes?.length || 0}`);

    } else {
      console.log('❌ Unexpected response:', result);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPulseEndpoint();