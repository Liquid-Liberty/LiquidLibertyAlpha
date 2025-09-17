// Quick GraphQL test for OnFinality endpoint
const https = require('https');

const ENDPOINT = 'https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart';

function query(graphql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: graphql });

    const req = https.request(ENDPOINT, {
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

async function test() {
  console.log('🔍 Testing OnFinality Pulse Endpoint...');
  console.log(`📍 URL: ${ENDPOINT}\n`);

  try {
    // Check indexing status
    console.log('1️⃣ Checking indexing status...');
    const metadata = await query(`{
      _metadata {
        lastProcessedHeight
        targetHeight
        chain
      }
    }`);

    if (metadata.data?._metadata) {
      const { lastProcessedHeight, targetHeight } = metadata.data._metadata;
      console.log(`   📊 Processed: ${lastProcessedHeight}`);
      console.log(`   🎯 Target: ${targetHeight}`);
      console.log(`   📈 Blocks behind: ${targetHeight - lastProcessedHeight}`);

      if (lastProcessedHeight >= 22654608) {
        console.log('   ✅ Your transaction block has been processed!');
      } else {
        console.log('   ⏳ Still processing... your transaction block is 22654608');
      }
    }

    // Check for candles
    console.log('\n2️⃣ Checking for candles...');
    const candles = await query(`{
      candles(first: 5, orderBy: BUCKET_START_DESC) {
        nodes {
          id
          interval
          bucketStart
          close
          trades
        }
      }
    }`);

    if (candles.data?.candles?.nodes?.length > 0) {
      console.log(`   📈 Found ${candles.data.candles.nodes.length} candles:`);
      candles.data.candles.nodes.forEach(candle => {
        const date = new Date(candle.bucketStart * 1000).toLocaleString();
        console.log(`      🕯️  ${candle.interval}s: $${candle.close}, ${candle.trades} trades (${date})`);
      });
    } else {
      console.log('   ❌ No candles found');
    }

    // Check pairs
    console.log('\n3️⃣ Checking pairs...');
    const pairs = await query(`{
      pairs {
        nodes {
          id
          token0Id
          token1Id
        }
      }
    }`);

    if (pairs.data?.pairs?.nodes?.length > 0) {
      console.log(`   📊 Found ${pairs.data.pairs.nodes.length} pairs:`);
      pairs.data.pairs.nodes.forEach(pair => {
        console.log(`      📈 ${pair.id}: ${pair.token0Id} / ${pair.token1Id}`);
      });
    } else {
      console.log('   ❌ No pairs found');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

test();