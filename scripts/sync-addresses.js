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
 * Update additional files that contain hardcoded addresses
 */
function updateAdditionalFiles(network, addresses) {
  const config = NETWORK_CONFIG[network];

  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }

  const filesToUpdate = [
    // Netlify function
    {
      path: "./netlify/functions/secure-subquery-proxy.js",
      description: "Netlify proxy function"
    },
    // Test files
    {
      path: "./src/utils/__tests__/secureNetworkConfig.test.js",
      description: "Network config tests"
    },
    // Charting datafeed validation
    {
      path: "./src/helpers/chartingDatafeed.js",
      description: "Chart datafeed validation"
    },
    // Subgraph verification
    {
      path: "./subgraph/lmkt-subquery/verify-build.js",
      description: "Subgraph build verification"
    },
    // Test config
    {
      path: "./subgraph/lmkt-subquery/test-local-config.js",
      description: "Test configuration"
    },
    // Generated YAML files
    {
      path: "./subgraph/lmkt-subquery/project-sepolia.yaml",
      description: "Generated Sepolia subgraph config",
      networkSpecific: "sepolia"
    },
    {
      path: "./subgraph/lmkt-subquery/src/project.sepolia.yaml",
      description: "Source Sepolia subgraph config",
      networkSpecific: "sepolia"
    },
    {
      path: "./subgraph/lmkt-subquery/project-pulse.yaml",
      description: "Generated Pulse subgraph config",
      networkSpecific: "pulse"
    },
    {
      path: "./subgraph/lmkt-subquery/src/project.pulse.yaml",
      description: "Source Pulse subgraph config",
      networkSpecific: "pulse"
    },
    // Environment configuration
    {
      path: "./.env",
      description: "Environment variables file"
    },
    // Monitoring scripts
    {
      path: "./subgraph/lmkt-subquery/monitor.js",
      description: "Subgraph monitoring script"
    },
    // Testing scripts
    {
      path: "./subgraph/lmkt-subquery/test-endpoints.js",
      description: "Endpoint testing script"
    }
  ];

  for (const file of filesToUpdate) {
    // Skip files that don't exist
    if (!fs.existsSync(file.path)) {
      console.log(`⏭️  Skipping ${file.path} (file not found)`);
      continue;
    }

    // Skip network-specific files for other networks
    if (file.networkSpecific && file.networkSpecific !== network) {
      continue;
    }

    try {
      // Create backup
      createBackup(file.path);

      // Read file
      let content = fs.readFileSync(file.path, 'utf8');

      // Replace ALL contract addresses with their new values
      let newContent = content;

      // Define known old addresses that need to be replaced
      const oldAddressMap = {
        sepolia: {
          // Known old Sepolia addresses from previous deployments
          "0xC78b685192DD8164062705Cd8148df2CB2d1CB9E": "Treasury", // Old treasury
          "0xBC13B31e7eF9E9a72E7a4c5A902eDc3D9a7413e4": "PaymentProcessor", // Old payment processor
          "0xc2FD2028e7a156744985f80f001366423A11dE67": "ListingManager", // Old listing manager
          "0xd25200BF1C6507A25b78F78E1459338cf1Ec217c": "MockDai", // Old MockDai
          "0xE5De8015E7cd41F5d053461EDA9480CF3dA4f358": "LMKT", // Old LMKT (from env backup)
          "0xb43088061120cb3Bf13d19888FEFef31fDB52014": "ListingManager", // Another old listing manager reference
        },
        pulse: {
          // Known incorrect Pulse addresses (currently using Sepolia addresses!)
          "0x7F77768fb73bA33606EB569966C109cD5CFe0F09": "Treasury", // Wrong: using Sepolia treasury
          "0x85F30D0cE7376fCF47E2386fdE86BBD072C00201": "LMKT", // Wrong: using Sepolia LMKT
          "0xE521F93061b1e8F2DefAC380525edADb7bB19bA4": "PaymentProcessor", // Wrong: using Sepolia payment processor
          "0x220c186b8996CF54f3e724C188DDbF63DFf1bf5D": "ListingManager", // Wrong: using Sepolia listing manager
        }
      };

      // Replace old addresses with new ones
      if (oldAddressMap[network]) {
        for (const [oldAddress, contractName] of Object.entries(oldAddressMap[network])) {
          if (addresses[contractName]) {
            const pattern = new RegExp(oldAddress, 'gi');
            newContent = newContent.replace(pattern, addresses[contractName]);
          }
        }
      }

      // Additionally, replace any occurrence of ALL current addresses with updated ones
      // This handles cases where addresses might have been manually updated but need refreshing
      for (const [contractName, newAddress] of Object.entries(addresses)) {
        // Skip if we don't have a new address
        if (!newAddress) continue;

        // Create patterns for different contract naming conventions
        const contractPatterns = [
          contractName,
          contractName.toLowerCase(),
          contractName.toUpperCase(),
          // Convert camelCase to snake_case for environment variables
          contractName.replace(/([A-Z])/g, '_$1').toUpperCase(),
        ];

        contractPatterns.forEach(pattern => {
          // Replace in environment variable format: CONTRACT_NAME_ADDRESS=0x...
          const envPattern = new RegExp(`${pattern}_ADDRESS=0x[a-fA-F0-9]{40}`, 'g');
          newContent = newContent.replace(envPattern, `${pattern}_ADDRESS=${newAddress}`);
        });
      }

      // Handle network-specific environment variable updates
      if (file.path === './.env') {
        if (network === 'sepolia') {
          newContent = newContent.replace(
            /SEPOLIA_TREASURY_ADDRESS=.*/g,
            `SEPOLIA_TREASURY_ADDRESS=${addresses.Treasury}`
          );
          newContent = newContent.replace(
            /VITE_TREASURY_ADDRESS=.*/g,
            `VITE_TREASURY_ADDRESS=${addresses.Treasury}`
          );
          newContent = newContent.replace(
            /SEPOLIA_LMKT_ADDRESS=.*/g,
            `SEPOLIA_LMKT_ADDRESS=${addresses.LMKT}`
          );
          newContent = newContent.replace(
            /SEPOLIA_MDAI_ADDRESS=.*/g,
            `SEPOLIA_MDAI_ADDRESS=${addresses.MockDai}`
          );
          newContent = newContent.replace(
            /SEPOLIA_PAYMENT_PROCESSOR_ADDRESS=.*/g,
            `SEPOLIA_PAYMENT_PROCESSOR_ADDRESS=${addresses.PaymentProcessor}`
          );
          newContent = newContent.replace(
            /SEPOLIA_LISTING_MANAGER_ADDRESS=.*/g,
            `SEPOLIA_LISTING_MANAGER_ADDRESS=${addresses.ListingManager}`
          );
        } else if (network === 'pulse') {
          newContent = newContent.replace(
            /PULSE_TREASURY_ADDRESS=.*/g,
            `PULSE_TREASURY_ADDRESS=${addresses.Treasury}`
          );
          newContent = newContent.replace(
            /PULSE_LMKT_ADDRESS=.*/g,
            `PULSE_LMKT_ADDRESS=${addresses.LMKT}`
          );
          newContent = newContent.replace(
            /PULSE_MDAI_ADDRESS=.*/g,
            `PULSE_MDAI_ADDRESS=${addresses.MockDai}`
          );
          newContent = newContent.replace(
            /PULSE_PAYMENT_PROCESSOR_ADDRESS=.*/g,
            `PULSE_PAYMENT_PROCESSOR_ADDRESS=${addresses.PaymentProcessor}`
          );
          newContent = newContent.replace(
            /PULSE_LISTING_MANAGER_ADDRESS=.*/g,
            `PULSE_LISTING_MANAGER_ADDRESS=${addresses.ListingManager}`
          );
          // Update additional Pulse-specific variables
          newContent = newContent.replace(
            /PULSE_RPC_URL=.*/g,
            `PULSE_RPC_URL=https://rpc.v4.testnet.pulsechain.com`
          );
        }
      }

      // Only write if content actually changed
      if (newContent !== content) {
        fs.writeFileSync(file.path, newContent);
        console.log(`✅ Updated ${file.description}: ${file.path}`);
      } else {
        console.log(`ℹ️  No changes needed in: ${file.path}`);
      }

    } catch (error) {
      console.warn(`⚠️  Failed to update ${file.path}: ${error.message}`);
    }
  }
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
    updateAdditionalFiles(network, addresses);

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