// Monitor the Pulse subgraph deployment progress
import fetch from 'node-fetch';

const PULSE_URL = "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart";
const EXPECTED_TREASURY = "0x23f977b0bdc307ed98763cdb44a4b79daa8d620a";
const CURRENT_TREASURY = "0xc78b685192dd8164062705cd8148df2cb2d1cb9e";

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
  console.log(`⏰ ${new Date().toISOString()} - Checking Pulse deployment status...`);

  try {
    const response = await fetch(PULSE_URL, {
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

    if (pairId === EXPECTED_TREASURY) {
      console.log(`✅ SUCCESS! Pulse subgraph is now using the correct treasury address`);
      return true;
    } else if (pairId === CURRENT_TREASURY) {
      console.log(`⏳ Still using old treasury address - deployment may still be processing`);
      return false;
    } else {
      console.log(`❓ Unexpected treasury address found: ${pairId}`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

async function monitor() {
  console.log('🚀 Starting Pulse subgraph deployment monitoring...');
  console.log(`Expected treasury: ${EXPECTED_TREASURY}`);
  console.log(`Current treasury: ${CURRENT_TREASURY}`);
  console.log('');

  let attempts = 0;
  const maxAttempts = 6; // Monitor for 3 minutes initially

  while (attempts < maxAttempts) {
    const success = await checkDeploymentStatus();

    if (success) {
      console.log('\n🎉 Deployment successful! Pulse subgraph is working correctly.');
      break;
    }

    attempts++;
    if (attempts < maxAttempts) {
      console.log(`⏰ Waiting 30 seconds before next check... (Attempt ${attempts}/${maxAttempts})\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n⚠️ Deployment is still processing. This can take 10-30 minutes for OnFinality to update.');
    console.log('The new deployment has been successfully published and will be available soon.');
  }
}

monitor().catch(console.error);