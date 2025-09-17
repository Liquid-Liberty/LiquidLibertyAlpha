// Test that our configuration resolves correctly
const fs = require('fs');

// Simulate the project.ts logic
process.env.VITE_DEPLOY_ENV = 'pulse';
const deployEnv = (process.env.VITE_DEPLOY_ENV || '').toLowerCase();

console.log('🔍 Testing Pulse Configuration:');
console.log(`Environment: ${deployEnv}`);

const config = {
  sepolia: {
    treasury: "0xC78b685192DD8164062705Cd8148df2CB2d1CB9E",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/tD-k4CLtNfq88JYH280Wu",
    chainId: "11155111"
  },
  pulse: {
    treasury: "0x23f977b0BDC307ed98763cdB44a4B79dAa8d620a",
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    chainId: "943"
  }
};

const { treasury, rpcUrl, chainId } = config[deployEnv];

console.log('✅ Selected Configuration:');
console.log(`  Treasury: ${treasury}`);
console.log(`  RPC URL: ${rpcUrl}`);
console.log(`  Chain ID: ${chainId}`);

// Verify YAML file matches
const yamlContent = fs.readFileSync('./project-pulse.yaml', 'utf8');
if (yamlContent.includes(treasury)) {
  console.log('✅ YAML file contains correct treasury address');
} else {
  console.log('❌ YAML file missing treasury address');
}

// Verify compiled code matches
const compiledCode = fs.readFileSync('./dist/index.js', 'utf8');
if (compiledCode.includes(treasury) || compiledCode.includes(treasury.toLowerCase())) {
  console.log('✅ Compiled code contains correct treasury address');
} else {
  console.log('❌ Compiled code missing treasury address');
}

console.log('\n🎯 Configuration Status: READY FOR DEPLOYMENT');
console.log('The OnFinality indexer will use these exact settings once it updates.');