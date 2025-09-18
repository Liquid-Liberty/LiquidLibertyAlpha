// Monitor when OnFinality switches to our new deployment
const fetch = require('node-fetch');

const PULSE_URL = "https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart";
const EXPECTED_TREASURY = "0x23f977b0bdc307ed98763cdb44a4b79daa8d620a";

async function checkDeploymentStatus() {
  try {
    const response = await fetch(PULSE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query { pairs(first: 1) { nodes { id } } }`
      })
    });

    const data = await response.json();
    const pairId = data.data?.pairs?.nodes?.[0]?.id?.toLowerCase();

    console.log(`⏰ ${new Date().toISOString()}`);
    console.log(`Current treasury: ${pairId || 'none'}`);
    console.log(`Expected treasury: ${EXPECTED_TREASURY}`);

    if (pairId === EXPECTED_TREASURY) {
      console.log('🎉 SUCCESS! OnFinality has updated to the correct deployment!');
      return true;
    } else {
      console.log('⏳ Still waiting for OnFinality to update...\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking: ${error.message}\n`);
    return false;
  }
}

async function monitor() {
  console.log('🚀 Monitoring OnFinality deployment update...\n');

  while (true) {
    const success = await checkDeploymentStatus();
    if (success) break;

    await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
  }
}

monitor();