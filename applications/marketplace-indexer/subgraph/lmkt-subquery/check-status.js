// Check subgraph indexing status on OnFinality (Multi-network support)
import fetch from 'node-fetch';

const network = process.argv[2] || 'pulse'; // Default to pulse if no network specified

const networkConfig = {
  sepolia: {
    url: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",
    name: "Sepolia"
  },
  pulse: {
    url: "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart",
    name: "Pulse"
  }
};

if (!networkConfig[network]) {
  console.error(`❌ Unknown network: ${network}. Use 'sepolia' or 'pulse'`);
  process.exit(1);
}

const { url: SUBGRAPH_URL, name: NETWORK_NAME } = networkConfig[network];

async function checkIndexingStatus() {
  const metaQuery = `
    query {
      _metadata {
        lastProcessedHeight
        lastProcessedTimestamp
        targetHeight
        indexerHealthy
        indexerNodeVersion
        queryNodeVersion
        deploymentId
      }
    }
  `;

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: metaQuery })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.log('❌ GraphQL errors:', data.errors);
      return;
    }

    const metadata = data.data._metadata;
    console.log(`🔍 ${NETWORK_NAME} Subgraph Status:`);
    console.log(`  Deployment ID: ${metadata.deploymentId || 'Not available'}`);
    console.log(`  Last Processed Height: ${metadata.lastProcessedHeight}`);
    console.log(`  Target Height: ${metadata.targetHeight}`);
    console.log(`  Indexer Healthy: ${metadata.indexerHealthy}`);
    console.log(`  Indexer Node Version: ${metadata.indexerNodeVersion}`);
    console.log(`  Query Node Version: ${metadata.queryNodeVersion}`);

    if (metadata.lastProcessedTimestamp) {
      const lastProcessed = new Date(parseInt(metadata.lastProcessedTimestamp) * 1000);
      console.log(`  Last Processed Time: ${lastProcessed.toISOString()}`);
    }

    // Check if it's syncing
    const heightDiff = metadata.targetHeight - metadata.lastProcessedHeight;
    if (heightDiff > 10) {
      console.log(`⚠️  Subgraph is still syncing (${heightDiff} blocks behind)`);
    } else {
      console.log(`✅ Subgraph appears to be synced`);
    }

  } catch (error) {
    console.log('❌ Failed to check status:', error.message);
  }
}

checkIndexingStatus();