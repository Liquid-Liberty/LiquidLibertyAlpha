#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { isAddress } from "ethers";
import process from "process";

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
    startBlock: 9229814,
    subqueryDir: "sepolia"
  },
  pulse: {
    chainId: "943",
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    startBlock: 226624050,
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
    },
    // Additional monitoring and build scripts
    {
      path: "./subgraph/lmkt-subquery/monitor-indexing.js",
      description: "Pulse indexing monitoring script"
    },
    {
      path: "./subgraph/lmkt-subquery/scripts/generate-constants.js",
      description: "Constants generation script"
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
          // Previous Sepolia addresses that need updating
          "0xC78b685192DD8164062705Cd8148df2CB2d1CB9E": "Treasury", // Very old treasury
          "0xBC13B31e7eF9E9a72E7a4c5A902eDc3D9a7413e4": "PaymentProcessor", // Old payment processor
          "0xc2FD2028e7a156744985f80f001366423A11dE67": "ListingManager", // Old listing manager
          "0xd25200BF1C6507A25b78F78E1459338cf1Ec217c": "MockDai", // Old MockDai
          "0xE5De8015E7cd41F5d053461EDA9480CF3dA4f358": "LMKT", // Old LMKT
          "0xb43088061120cb3Bf13d19888FEFef31fDB52014": "ListingManager", // Another old listing manager reference
          "0x7F77768fb73bA33606EB569966C109cD5CFe0F09": "Treasury", // Previous Sepolia treasury
          "0x002144A5B56b6b3774774499B7AB04ED9E872dB9": "Treasury", // Current Sepolia treasury
          "0x6c5675343f3c1D9003746f7871DCdc2E73E85A5A": "ListingManager", // Current Sepolia listing manager
          "0x1AA8df52bE8b0b0898131E23592183687AC55E0b": "PaymentProcessor", // Current Sepolia payment processor
          "0x2a2DfFe954225D6511740a0cc8ec92b944ca9181": "LMKT", // Current Sepolia LMKT
          "0x1E3fae53e2CbE163fEbFc8Ab2aA2E8c9C43bC736": "MockDai", // Current Sepolia MockDai
        },
        pulse: {
          // Previous Pulse addresses that need updating
          "0x23f977b0BDC307ed98763cdB44a4B79dAa8d620a": "Treasury", // Previous Pulse treasury
          "0x827949C9d3034f84DAB5f7DD6C9032591dEC84D3": "ListingManager", // Previous Pulse listing manager
          "0xEF5FB8dcB0fC1a6CD7C7681Db979cd20FC46CAA7": "PaymentProcessor", // Previous Pulse payment processor
          "0x8e1f781763D550adDAA9F1869B6bae3f86e87b4F": "LMKT", // Previous Pulse LMKT
          "0x3473b7D2f41E332Eb87d607ABe948d1EBDeCfC87": "MockDai", // Previous Pulse MockDai
          "0xe12538Ab1990A3318395B7Cb0cE682741e68194E": "Treasury", // Previous Pulse treasury
          "0x48FEb85273B7BAc5c85C3B89C21D91BCC4deb621": "ListingManager", // Previous Pulse listing manager
          "0xa659F4f1611297ed382703798cEd30ddD41A4004": "PaymentProcessor", // Previous Pulse payment processor
          "0x2b5A9618Eb6886D23Dd7276B436ac98C20427716": "LMKT", // Previous Pulse LMKT
          "0xb1bCAc95d4eEC3aD216aCD3261cc1845A193e590": "MockDai", // Previous Pulse MockDai
          "0xd8069526E71767B2d46fc079F0a2A3797b8a4AC2": "Treasury", // Current Pulse treasury
          "0x74341E36Ba04DBEb5dC62E2359F4Dde784525f6e": "ListingManager", // Current Pulse listing manager
          "0x88a099C9B1b25dF3f0e266Af1DEc8Ed0F2458f0b": "PaymentProcessor", // Current Pulse payment processor
          "0x39B691Dc0E7AeB1DaA0291d9F561b9b75e2ECd8d": "LMKT", // Current Pulse LMKT
          "0x5C4C434fd6Aaa6a0afB826339d85cc067C033Dd1": "MockDai", // Current Pulse MockDai
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

      // Skip global environment variable replacement for .env files
      // Network-specific env variable updates are handled later in the network-specific section
      if (file.path !== './.env') {
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
      }

      // Handle network-specific environment variable updates
      if (file.path === './.env') {
        // Read current deployment environment
        const currentDeployEnv = content.match(/VITE_DEPLOY_ENV=(\w+)/)?.[1] || 'sepolia';

        if (network === 'sepolia') {
          newContent = newContent.replace(
            /SEPOLIA_TREASURY_ADDRESS=.*/g,
            `SEPOLIA_TREASURY_ADDRESS=${addresses.Treasury}`
          );

          // Only update VITE addresses if current deployment env is sepolia
          if (currentDeployEnv === 'sepolia') {
            newContent = newContent.replace(
              /VITE_TREASURY_ADDRESS=.*/g,
              `VITE_TREASURY_ADDRESS=${addresses.Treasury}`
            );
            newContent = newContent.replace(
              /VITE_LISTING_MANAGER_ADDRESS=.*/g,
              `VITE_LISTING_MANAGER_ADDRESS=${addresses.ListingManager}`
            );
            newContent = newContent.replace(
              /VITE_LMKT_ADDRESS=.*/g,
              `VITE_LMKT_ADDRESS=${addresses.LMKT}`
            );
            newContent = newContent.replace(
              /VITE_DAI_ADDRESS=.*/g,
              `VITE_DAI_ADDRESS=${addresses.MockDai}`
            );
          }
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

          // Only update VITE addresses if current deployment env is pulse
          if (currentDeployEnv === 'pulse') {
            newContent = newContent.replace(
              /VITE_TREASURY_ADDRESS=.*/g,
              `VITE_TREASURY_ADDRESS=${addresses.Treasury}`
            );
            newContent = newContent.replace(
              /VITE_LISTING_MANAGER_ADDRESS=.*/g,
              `VITE_LISTING_MANAGER_ADDRESS=${addresses.ListingManager}`
            );
            newContent = newContent.replace(
              /VITE_LMKT_ADDRESS=.*/g,
              `VITE_LMKT_ADDRESS=${addresses.LMKT}`
            );
            newContent = newContent.replace(
              /VITE_DAI_ADDRESS=.*/g,
              `VITE_DAI_ADDRESS=${addresses.MockDai}`
            );
          }
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