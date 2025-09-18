// Test script to validate Sepolia and Pulse subquery endpoints
import fetch from 'node-fetch';

const SEPOLIA_URL = "https://index-api.onfinality.io/sq/Liquid-Liberty/lmkt-chart";
const PULSE_URL = "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart";

// Expected treasury addresses
const SEPOLIA_TREASURY = "0x7F77768fb73bA33606EB569966C109cD5CFe0F09";
const PULSE_TREASURY = "0xe12538Ab1990A3318395B7Cb0cE682741e68194E";

const testQuery = `
  query GetPairs {
    pairs(first: 5) {
      nodes {
        id
        token0Id
        token1Id
        createdAt
      }
    }
  }
`;

async function testEndpoint(url, expectedTreasury, networkName) {
  console.log(`\n🔍 Testing ${networkName} endpoint: ${url}`);
  console.log(`Expected treasury address: ${expectedTreasury}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.log(`❌ GraphQL errors:`, data.errors);
      return false;
    }

    const pairs = data.data?.pairs?.nodes || [];
    console.log(`✅ Found ${pairs.length} pairs`);

    if (pairs.length > 0) {
      // Check if the treasury address matches
      const pair = pairs[0];
      console.log(`First pair ID: ${pair.id}`);

      if (pair.id.toLowerCase() === expectedTreasury) {
        console.log(`✅ Treasury address matches expected: ${expectedTreasury}`);
        return true;
      } else {
        console.log(`❌ Treasury address mismatch! Expected: ${expectedTreasury}, Got: ${pair.id}`);
        return false;
      }
    } else {
      console.log(`⚠️  No pairs found - this might be normal if no trades have occurred yet`);
      return true; // Not necessarily an error
    }

  } catch (error) {
    console.log(`❌ Request failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Testing SubQuery endpoints...\n");

  const sepoliaResult = await testEndpoint(SEPOLIA_URL, SEPOLIA_TREASURY, "Sepolia");
  const pulseResult = await testEndpoint(PULSE_URL, PULSE_TREASURY, "Pulse");

  console.log("\n📊 Summary:");
  console.log(`Sepolia: ${sepoliaResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Pulse: ${pulseResult ? '✅ PASS' : '❌ FAIL'}`);

  if (sepoliaResult && pulseResult) {
    console.log("\n🎉 All endpoints are working correctly!");
  } else {
    console.log("\n⚠️  Some endpoints need attention.");
  }
}

main().catch(console.error);