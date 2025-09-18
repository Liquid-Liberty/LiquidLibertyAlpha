// Monitor when OnFinality switches to our new deployment (Multi-network support)
const fetch = require('node-fetch');

const network = process.argv[2] || 'pulse'; // Default to pulse if no network specified

const networkConfig = {
  sepolia: {
    url: "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart",
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9"
  },
  pulse: {
    url: "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart",
    treasury: "0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2"
  }
};

if (!networkConfig[network]) {
  console.error(`❌ Unknown network: ${network}. Use 'sepolia' or 'pulse'`);
  process.exit(1);
}

const { url: SUBGRAPH_URL, treasury: EXPECTED_TREASURY } = networkConfig[network];

async function checkDeploymentStatus() {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { pairs(first: 1) { nodes { id } } }`
      })
    });

    const data = await response.json();
    const pairId = data.data?.pairs?.nodes?.[0]?.id?.toLowerCase();

    console.log(`⏰ ${new Date().toISOString()} - ${network.toUpperCase()} Network`);
    console.log(`Current treasury: ${pairId || 'none'}`);
    console.log(`Expected treasury: ${EXPECTED_TREASURY.toLowerCase()}`);

    if (pairId === EXPECTED_TREASURY.toLowerCase()) {
      console.log(`🎉 SUCCESS! ${network.toUpperCase()} OnFinality has updated to the correct deployment!`);
      return true;
    } else {
      console.log(`⏳ Still waiting for ${network.toUpperCase()} OnFinality to update...\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking ${network.toUpperCase()}: ${error.message}\n`);
    return false;
  }
}

async function monitor() {
  console.log(`🚀 Monitoring ${network.toUpperCase()} OnFinality deployment update...`);
  console.log(`📍 Network: ${network}`);
  console.log(`🔗 URL: ${SUBGRAPH_URL}`);
  console.log(`🏛️ Expected Treasury: ${EXPECTED_TREASURY}\n`);

  while (true) {
    const success = await checkDeploymentStatus();
    if (success) break;

    await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
  }
}

monitor();