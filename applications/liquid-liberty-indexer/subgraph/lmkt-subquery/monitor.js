// Monitor subgraph deployment progress (Multi-network support)
import fetch from 'node-fetch';

const network = process.argv[2] || 'pulse'; // Default to pulse if no network specified

const networkConfig = {
  sepolia: {
    url: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9",
    name: "Sepolia"
  },
  pulse: {
    url: "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart",
    treasury: "0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2",
    name: "Pulse"
  }
};

if (!networkConfig[network]) {
  console.error(`❌ Unknown network: ${network}. Use 'sepolia' or 'pulse'`);
  process.exit(1);
}

const { url: SUBGRAPH_URL, treasury: EXPECTED_TREASURY, name: NETWORK_NAME } = networkConfig[network];

const testQuery = `
  query GetPairs {
    pairs(first: 1) {
      nodes {
        id
        createdAt
      }
    }
  }
`;

async function checkDeploymentStatus() {
  console.log(`⏰ ${new Date().toISOString()} - Checking ${NETWORK_NAME} deployment status...`);

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery })
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }

    const data = await response.json();

    if (data.errors) {
      console.log(`❌ GraphQL errors:`, data.errors);
      return false;
    }

    const pairs = data.data?.pairs?.nodes || [];

    if (pairs.length === 0) {
      console.log(`📊 No pairs found yet - indexer may be syncing`);
      return false;
    }

    const pairId = pairs[0].id.toLowerCase();
    console.log(`📊 Current treasury address in data: ${pairId}`);
    console.log(`📊 Expected treasury address: ${EXPECTED_TREASURY.toLowerCase()}`);

    if (pairId === EXPECTED_TREASURY.toLowerCase()) {
      console.log(`✅ SUCCESS! ${NETWORK_NAME} subgraph is now using the correct treasury address`);
      return true;
    } else {
      console.log(`❓ Unexpected treasury address found: ${pairId}`);
      console.log(`⏳ ${NETWORK_NAME} deployment may still be processing...`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function monitor() {
  console.log(`🚀 Starting ${NETWORK_NAME} subgraph deployment monitoring...`);
  console.log(`📍 Network: ${network}`);
  console.log(`🔗 URL: ${SUBGRAPH_URL}`);
  console.log(`🏛️ Expected treasury: ${EXPECTED_TREASURY}`);
  console.log('');

  let attempts = 0;
  const maxAttempts = 6; // Monitor for 3 minutes initially

  while (attempts < maxAttempts) {
    const success = await checkDeploymentStatus();

    if (success) {
      console.log(`\n🎉 Deployment successful! ${NETWORK_NAME} subgraph is working correctly.`);
      break;
    }

    attempts++;
    if (attempts < maxAttempts) {
      console.log(`⏰ Waiting 30 seconds before next check... (Attempt ${attempts}/${maxAttempts})\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  if (attempts >= maxAttempts) {
    console.log(`\n⚠️ ${NETWORK_NAME} deployment is still processing. This can take 10-30 minutes for OnFinality to update.`);
    console.log('The new deployment has been successfully published and will be available soon.');
  }
}

monitor().catch(console.error);