// verify-build.js - Verify that the build contains correct addresses
const fs = require('fs');
const path = require('path');

const EXPECTED_ADDRESSES = {
  sepolia: {
    treasury: "0x7F77768fb73bA33606EB569966C109cD5CFe0F09",
    name: "Sepolia"
  },
  pulse: {
    treasury: "0x23f977b0BDC307ed98763cdB44a4B79dAa8d620a",
    name: "Pulse"
  },
  local: {
    treasury: "0x0000000000000000000000000000000000000000",
    name: "Local"
  }
};

function verifyBuild(networkType) {
  const expected = EXPECTED_ADDRESSES[networkType];
  if (!expected) {
    console.error(`❌ Unknown network type: ${networkType}`);
    process.exit(1);
  }

  // Check if dist/index.js exists
  const distPath = path.join(process.cwd(), 'dist', 'index.js');
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Build file not found: ${distPath}`);
    console.error(`   Run 'npm run build:${networkType}' first`);
    process.exit(1);
  }

  // Read the compiled file
  const compiledCode = fs.readFileSync(distPath, 'utf8');

  // Check if the expected treasury address is present (check both cases)
  const treasuryLower = expected.treasury.toLowerCase();
  const treasuryOriginal = expected.treasury;
  if (!compiledCode.includes(treasuryLower) && !compiledCode.includes(treasuryOriginal)) {
    console.error(`❌ ${expected.name} treasury address not found in compiled code!`);
    console.error(`   Expected: ${expected.treasury}`);
    console.error(`   This suggests the build used the wrong environment.`);
    console.error(`   Try: npm run build:${networkType}`);
    process.exit(1);
  }

  // Check YAML file
  const yamlPath = path.join(process.cwd(), `project-${networkType}.yaml`);
  if (fs.existsSync(yamlPath)) {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    if (!yamlContent.includes(expected.treasury)) {
      console.error(`❌ ${expected.name} treasury address not found in YAML file!`);
      process.exit(1);
    }
  }

  console.log(`✅ ${expected.name} build verification passed!`);
  console.log(`   Treasury address: ${expected.treasury}`);
  console.log(`   Files verified: dist/index.js, project-${networkType}.yaml`);
}

// Get network type from command line
const networkType = process.argv[2];
if (!networkType) {
  console.error('Usage: node verify-build.js <network>');
  console.error('Example: node verify-build.js pulse');
  process.exit(1);
}

verifyBuild(networkType);