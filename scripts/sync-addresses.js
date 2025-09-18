#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { isAddress } from "ethers";

/**
 * Address Synchronization Utility
 *
 * Reads contract addresses from network-specific JSON files (single source of truth)
 * and updates all dependent configuration files across the project.
 *
 * Usage:
 *   node scripts/sync-addresses.js --network sepolia
 *   node scripts/sync-addresses.js --network pulse
 *   node scripts/sync-addresses.js --all
 */

// Supported networks and their configurations
const NETWORK_CONFIG = {
  sepolia: {
    chainId: "11155111",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/tD-k4CLtNfq88JYH280Wu",
    startBlock: 9176744,
    subqueryDir: "sepolia"
  },
  pulse: {
    chainId: "943",
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    startBlock: 22602590,
    subqueryDir: "pulse"
  },
  localhost: {
    chainId: "31337",
    rpcUrl: "http://localhost:8545",
    startBlock: 0,
    subqueryDir: "local"
  }
};

// Required contract addresses that must be present
const REQUIRED_CONTRACTS = [
  "Treasury", "LMKT", "PaymentProcessor", "ListingManager", "MockDai", "Faucet", "MockPriceOracle"
];

/**
 * Validate an Ethereum address
 */
function validateAddress(address, contractName) {
  if (!address) {
    throw new Error(`Missing address for ${contractName}`);
  }

  if (!isAddress(address)) {
    throw new Error(`Invalid address for ${contractName}: ${address}`);
  }

  return address;
}

/**
 * Load and validate contract addresses from network JSON file
 */
function loadContractAddresses(network) {
  const addressFile = `./src/config/${network}/contract-addresses.json`;

  if (!fs.existsSync(addressFile)) {
    throw new Error(`Contract addresses file not found: ${addressFile}`);
  }

  let addresses;
  try {
    const content = fs.readFileSync(addressFile, 'utf8');
    addresses = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read ${addressFile}: ${error.message}`);
  }

  // Validate all required contracts are present and have valid addresses
  for (const contract of REQUIRED_CONTRACTS) {
    validateAddress(addresses[contract], contract);
  }

  console.log(`✅ Loaded and validated addresses for ${network}:`);
  for (const [contract, address] of Object.entries(addresses)) {
    console.log(`  ${contract}: ${address}`);
  }

  return addresses;
}

/**
 * Create backup of a file before modifying it
 */
function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    // Create backup directory structure
    const relativePath = path.relative('.', filePath);
    const backupDir = path.join('./backups', path.dirname(relativePath));

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${fileName}.backup.${Date.now()}`);

    fs.copyFileSync(filePath, backupPath);
    console.log(`📋 Created backup: ${backupPath}`);
    return backupPath;
  }
  return null;
}

/**
 * Update subgraph project.ts file with new addresses
 */
function updateSubgraphProject(network, addresses) {
  const projectFile = "./subgraph/lmkt-subquery/project.ts";
  const config = NETWORK_CONFIG[network];

  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }

  // Create backup
  createBackup(projectFile);

  // Read current project.ts file
  let content = fs.readFileSync(projectFile, 'utf8');

  // Update the config object for the specific network
  const networkConfigPattern = new RegExp(
    `(${network}:\\s*\\{[^}]*treasury:\\s*)"[^"]*"`,
    'g'
  );

  content = content.replace(networkConfigPattern, `$1"${addresses.Treasury}"`);

  // Also update other addresses if they exist in the config
  const contractMappings = {
    lmkt: addresses.LMKT,
    paymentProcessor: addresses.PaymentProcessor,
    listingManager: addresses.ListingManager,
    mDAI: addresses.MockDai
  };

  for (const [configKey, address] of Object.entries(contractMappings)) {
    const pattern = new RegExp(
      `(${network}:\\s*\\{[^}]*${configKey}:\\s*)"[^"]*"`,
      'g'
    );
    content = content.replace(pattern, `$1"${address}"`);
  }

  // Write updated content
  fs.writeFileSync(projectFile, content);
  console.log(`✅ Updated ${projectFile} with ${network} addresses`);
}

/**
 * Update secure network config file
 */
function updateSecureNetworkConfig(network, addresses) {
  const configFile = "./src/utils/secureNetworkConfig.js";
  const config = NETWORK_CONFIG[network];

  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }

  // Create backup
  createBackup(configFile);

  // Read current file
  let content = fs.readFileSync(configFile, 'utf8');

  // Update treasury address for the specific chain ID
  const treasuryPattern = new RegExp(
    `(${config.chainId}:\\s*Object\\.freeze\\(\\{[^}]*treasury:\\s*)"[^"]*"`,
    'g'
  );

  content = content.replace(treasuryPattern, `$1"${addresses.Treasury}"`);

  // Write updated content
  fs.writeFileSync(configFile, content);
  console.log(`✅ Updated ${configFile} with ${network} treasury address`);
}

/**
 * Sync addresses for a single network
 */
function syncNetwork(network) {
  console.log(`\n🔄 Syncing addresses for ${network} network...`);

  try {
    // Load and validate addresses
    const addresses = loadContractAddresses(network);

    // Update all dependent files
    updateSubgraphProject(network, addresses);
    updateSecureNetworkConfig(network, addresses);

    console.log(`✅ Successfully synced ${network} addresses`);

  } catch (error) {
    console.error(`❌ Failed to sync ${network} addresses:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Address Synchronization Utility

Usage:
  node scripts/sync-addresses.js --network <network>
  node scripts/sync-addresses.js --all

Options:
  --network <network>  Sync addresses for specific network (sepolia, pulse, localhost)
  --all               Sync addresses for all networks
  --help              Show this help message

Examples:
  node scripts/sync-addresses.js --network sepolia
  node scripts/sync-addresses.js --network pulse
  node scripts/sync-addresses.js --all
`);
    return;
  }

  try {
    if (args.includes('--all')) {
      console.log("🚀 Syncing addresses for all networks...");

      for (const network of Object.keys(NETWORK_CONFIG)) {
        // Only sync if the address file exists
        const addressFile = `./src/config/${network}/contract-addresses.json`;
        if (fs.existsSync(addressFile)) {
          syncNetwork(network);
        } else {
          console.log(`⏭️  Skipping ${network} (no address file found)`);
        }
      }

    } else if (args.includes('--network')) {
      const networkIndex = args.indexOf('--network');
      const network = args[networkIndex + 1];

      if (!network) {
        throw new Error("Please specify a network after --network");
      }

      if (!NETWORK_CONFIG[network]) {
        throw new Error(`Unknown network: ${network}. Supported: ${Object.keys(NETWORK_CONFIG).join(', ')}`);
      }

      syncNetwork(network);

    } else {
      throw new Error("Please specify either --network <network> or --all");
    }

    console.log("\n🎉 Address synchronization completed successfully!");

  } catch (error) {
    console.error("\n❌ Address synchronization failed:", error.message);
    process.exit(1);
  }
}

// Run main function only when script is executed directly
if (process.argv[1] && process.argv[1].includes('sync-addresses.js')) {
  main();
}

export { syncNetwork, loadContractAddresses };