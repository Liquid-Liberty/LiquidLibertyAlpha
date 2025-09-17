// Verify SubQuery endpoint configuration
const https = require('https');

const endpoints = {
  sepolia: 'https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart',
  pulse: 'https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart'
};

const newDeploymentCIDs = {
  sepolia: 'QmcYUhvM2boG3G59DsvUAfdQ1Nhnq3DxDD3zHegKxJ4FAA', // From .project-sepolia-cid
  pulse: 'QmVtfDG3XHe6uwSNFr38VoRNP7D24pNkmF1tKRyhgKNNyx' // From .project-pulse-cid (UPDATED)
};

async function makeGraphQLRequest(url, query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function checkEndpoint(name, url) {
  console.log(`\n🔍 Checking ${name.toUpperCase()} endpoint...`);
  console.log(`URL: ${url}`);

  try {
    // Test basic connectivity
    const metadataQuery = `
      query {
        _metadata {
          lastProcessedHeight
          targetHeight
          chain
          specName
          genesisHash
        }
      }
    `;

    const result = await makeGraphQLRequest(url, metadataQuery);

    if (result.data && result.data._metadata) {
      const metadata = result.data._metadata;
      console.log(`  ✅ Endpoint is responsive`);
      console.log(`  📊 Last Processed Height: ${metadata.lastProcessedHeight || 'N/A'}`);
      console.log(`  🎯 Target Height: ${metadata.targetHeight || 'N/A'}`);
      console.log(`  ⛓️  Chain: ${metadata.chain || 'N/A'}`);
      console.log(`  📝 Spec Name: ${metadata.specName || 'N/A'}`);

      // Check if it's up to date
      const heightDiff = metadata.targetHeight - metadata.lastProcessedHeight;
      if (heightDiff < 100) {
        console.log(`  ✅ Subgraph is up to date (${heightDiff} blocks behind)`);
      } else {
        console.log(`  ⚠️  Subgraph is ${heightDiff} blocks behind`);
      }

      // Test candle data availability
      const candleQuery = `
        query {
          candles(first: 5, orderBy: BUCKET_START_DESC) {
            nodes {
              id
              bucketStart
              interval
              open
              high
              low
              close
              volumeToken0
              volumeToken1
              trades
            }
          }
        }
      `;

      const candleResult = await makeGraphQLRequest(url, candleQuery);

      if (candleResult.data && candleResult.data.candles) {
        const candles = candleResult.data.candles.nodes;
        console.log(`  📈 Found ${candles.length} recent candles`);

        if (candles.length > 0) {
          const latest = candles[0];
          console.log(`  🕯️  Latest candle: ${latest.interval}s interval, price: $${latest.close}, trades: ${latest.trades}`);
        } else {
          console.log(`  ⚠️  No candle data found - expected if no trading activity`);
        }
      }

    } else {
      console.log(`  ❌ Invalid response format`);
      console.log(`  Response:`, JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.log(`  ❌ Endpoint error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Verifying SubQuery Endpoint Configuration...');
  console.log(`🕒 Check time: ${new Date().toISOString()}`);

  console.log(`\n📋 Frontend Configuration (.env):`);
  console.log(`  VITE_SUBQUERY_URL_SEPOLIA=${endpoints.sepolia}`);
  console.log(`  VITE_SUBQUERY_URL_PULSE=${endpoints.pulse}`);

  console.log(`\n📦 Latest Deployment CIDs:`);
  console.log(`  Sepolia: ${newDeploymentCIDs.sepolia}`);
  console.log(`  Pulse: ${newDeploymentCIDs.pulse} (UPDATED WITH ENHANCED LOGGING)`);

  for (const [name, url] of Object.entries(endpoints)) {
    await checkEndpoint(name, url);
  }

  console.log(`\n🎯 CONCLUSION:`);
  console.log(`
  1. ✅ Frontend is configured to use OnFinality hosted endpoints
  2. 🔄 OnFinality endpoints need to be updated to point to new Pulse deployment
  3. 📝 Pulse CID: ${newDeploymentCIDs.pulse} (has enhanced logging)
  4. 📊 Check if OnFinality dashboard shows latest deployment

  🎮 FOR TESTING:
  - OnFinality endpoints should automatically update to latest deployment
  - If charts don't update after transactions, check OnFinality deployment status
  - Monitor script will show events in real-time
  `);

  console.log('\n✨ Verification completed!');
}

main().catch(console.error);