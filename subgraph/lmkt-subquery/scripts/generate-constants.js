// scripts/generate-constants.js
// Generates network-specific constants file at build time

const fs = require('fs');
const path = require('path');

const network = process.env.BUILD_NETWORK || process.env.VITE_DEPLOY_ENV;

if (!network) {
  console.error('❌ BUILD_NETWORK environment variable must be set');
  process.exit(1);
}

const config = {
  sepolia: {
    treasury: "0x002144A5B56b6b3774774499B7AB04ED9E872dB9",
    lmkt: "0x2a2DfFe954225D6511740a0cc8ec92b944ca9181",
    mDAI: "0x1E3fae53e2CbE163fEbFc8Ab2aA2E8c9C43bC736",
  },
  pulse: {
    treasury: "0xe12538Ab1990A3318395B7Cb0cE682741e68194E",
    lmkt: "0x2b5A9618Eb6886D23Dd7276B436ac98C20427716",
    mDAI: "0xb1bCAc95d4eEC3aD216aCD3261cc1845A193e590",
  },
  local: {
    treasury: "0x0000000000000000000000000000000000000000",
    lmkt: "0x0000000000000000000000000000000000000000",
    mDAI: "0x0000000000000000000000000000000000000000",
  }
};

const networkLower = network.toLowerCase();
if (!(networkLower in config)) {
  console.error(`❌ Unknown network: ${network} (expected: sepolia, pulse, local)`);
  process.exit(1);
}

const networkConfig = config[networkLower];

const constantsContent = `// src/constants.ts
// ⚡ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated for network: ${networkLower}
// Generated at: ${new Date().toISOString()}

// Network-specific constants - hardcoded at build time
export const TREASURY_ADDRESS = "${networkConfig.treasury.toLowerCase()}";
export const LMKT_ADDRESS = "${networkConfig.lmkt.toLowerCase()}";
export const MDAI_ADDRESS = "${networkConfig.mDAI.toLowerCase()}";

// Log the embedded network for debugging
console.log(\`🔗 Constants hardcoded for network: ${networkLower}\`);
console.log(\`📍 Treasury: \${TREASURY_ADDRESS}\`);
console.log(\`📍 LMKT: \${LMKT_ADDRESS}\`);
console.log(\`📍 mDAI: \${MDAI_ADDRESS}\`);
`;

const constantsPath = path.join(__dirname, '..', 'src', 'constants.ts');
fs.writeFileSync(constantsPath, constantsContent, 'utf8');

console.log(`✅ Generated constants for ${networkLower} network`);
console.log(`📍 Treasury: ${networkConfig.treasury.toLowerCase()}`);
console.log(`📍 LMKT: ${networkConfig.lmkt.toLowerCase()}`);
console.log(`📍 mDAI: ${networkConfig.mDAI.toLowerCase()}`);