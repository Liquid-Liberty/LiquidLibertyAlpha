// Monitor subgraph indexing progress and logging
const https = require('https');

const PULSE_RPC = 'https://rpc.v4.testnet.pulsechain.com';

async function makeRPCCall(url, method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1
    });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
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
          if (response.error) {
            reject(new Error(`RPC Error: ${response.error.message}`));
          } else {
            resolve(response.result);
          }
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

async function getCurrentBlock() {
  const blockHex = await makeRPCCall(PULSE_RPC, 'eth_blockNumber', []);
  return parseInt(blockHex, 16);
}

async function getRecentLogs(contractAddress, fromBlock, toBlock) {
  try {
    const logs = await makeRPCCall(PULSE_RPC, 'eth_getLogs', [{
      fromBlock: `0x${fromBlock.toString(16)}`,
      toBlock: `0x${toBlock.toString(16)}`,
      address: contractAddress
    }]);
    return logs || [];
  } catch (error) {
    console.log(`    ❌ Error getting logs: ${error.message}`);
    return [];
  }
}

async function monitorIndexingProgress() {
  console.log('🚀 Monitoring Pulse Subgraph Indexing Progress...');
  console.log(`🕒 Started at: ${new Date().toISOString()}`);

  const contracts = {
    treasury: '0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2',
    paymentProcessor: '0x88a099C9B1b25dF3f0e266Af1DEc8Ed0F2458f0b',
    listingManager: '0x74341E36Ba04DBEb5dC62E2359F4Dde784525f6e'
  };

  const startBlock = 22610000;

  while (true) {
    try {
      const currentBlock = await getCurrentBlock();
      const blocksToCheck = Math.min(1000, currentBlock - startBlock);
      const fromBlock = currentBlock - blocksToCheck;

      console.log(`\n📊 Block Progress Report - ${new Date().toLocaleTimeString()}`);
      console.log(`  Current Block: ${currentBlock.toLocaleString()}`);
      console.log(`  Start Block: ${startBlock.toLocaleString()}`);
      console.log(`  Blocks Behind Start: ${(currentBlock - startBlock).toLocaleString()}`);
      console.log(`  Checking last ${blocksToCheck} blocks (${fromBlock} to ${currentBlock})`);

      let totalRecentEvents = 0;

      for (const [name, address] of Object.entries(contracts)) {
        const logs = await getRecentLogs(address, fromBlock, currentBlock);
        console.log(`  📝 ${name}: ${logs.length} events`);
        totalRecentEvents += logs.length;

        // Show details of recent events
        if (logs.length > 0) {
          const recentEvents = logs.slice(-3);
          for (const log of recentEvents) {
            const block = parseInt(log.blockNumber, 16);
            const topic = log.topics[0]?.slice(0, 10) || 'unknown';
            console.log(`      🔸 Block ${block}: ${topic}... (tx: ${log.transactionHash.slice(0, 10)}...)`);
          }
        }
      }

      console.log(`  📈 Total Recent Events: ${totalRecentEvents}`);

      if (totalRecentEvents > 0) {
        console.log(`  🎉 FOUND EVENTS! The subgraph should be processing these...`);
        console.log(`  💡 Check subgraph logs for the enhanced logging output to see processing details.`);
      } else {
        console.log(`  😴 No recent events - this is expected if there's no trading activity.`);
      }

      // Wait 30 seconds before next check
      console.log(`  ⏳ Waiting 30s for next check...`);
      await new Promise(resolve => setTimeout(resolve, 30000));

    } catch (error) {
      console.log(`  ❌ Monitoring error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Provide instructions for checking subgraph status
console.log(`
🔧 SUBGRAPH MONITORING INSTRUCTIONS:

1. This script monitors for new events on Pulse network
2. The subgraph has been deployed with enhanced logging
3. To see the actual subgraph processing logs:
   - Check your SubQuery deployment dashboard
   - Look for logs with emojis like 🚀, 💰, 🕯️, etc.
   - These logs will show exactly what's happening during event processing

4. Key things to look for in subgraph logs:
   ✅ "[MKTSwap] 🚀 STARTING handler" - Events are being captured
   ✅ "[updateCandle] 🕯️ Processing candle" - Candles are being created
   ✅ "💾 Successfully saved candle" - Data is being persisted
   ❌ Any error messages with 💥 or ❌

5. If you see events here but no subgraph activity:
   - The subgraph might not be catching up to recent blocks yet
   - Check the subgraph's current indexed block height

Press Ctrl+C to stop monitoring.
`);

monitorIndexingProgress().catch(console.error);