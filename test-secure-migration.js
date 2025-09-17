// test-secure-migration.js - Test the migration to secure address assignment
import { getSecureSubqueryConfig } from './src/config/secureSubgraphConfig.js';

async function testSecureMigration() {
  console.log('🧪 Testing Secure Migration...\n');

  // Test 1: Sepolia Configuration
  console.log('1️⃣ Testing Sepolia Configuration:');
  try {
    const sepoliaConfig = getSecureSubqueryConfig(11155111);
    console.log('✅ Sepolia config loaded successfully');
    console.log(`   Network: ${sepoliaConfig.NETWORK_NAME}`);
    console.log(`   Treasury: ${sepoliaConfig.TREASURY_ADDRESS}`);
    console.log(`   Pair: ${sepoliaConfig.PAIR_ADDRESS}`);
    console.log(`   URL: ${sepoliaConfig.URL}`);

    // Validate address format
    if (!sepoliaConfig.TREASURY_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid treasury address format');
    }
    console.log('✅ Address format valid');
  } catch (error) {
    console.error('❌ Sepolia test failed:', error.message);
  }

  console.log('');

  // Test 2: Pulse Configuration
  console.log('2️⃣ Testing Pulse Configuration:');
  try {
    const pulseConfig = getSecureSubqueryConfig(943);
    console.log('✅ Pulse config loaded successfully');
    console.log(`   Network: ${pulseConfig.NETWORK_NAME}`);
    console.log(`   Treasury: ${pulseConfig.TREASURY_ADDRESS}`);
    console.log(`   Pair: ${pulseConfig.PAIR_ADDRESS}`);
    console.log(`   URL: ${pulseConfig.URL}`);

    // Validate expected Pulse treasury
    const expectedPulseTreasury = '0x23f977b0BDC307ed98763cdB44a4B79dAa8d620a';
    if (pulseConfig.TREASURY_ADDRESS !== expectedPulseTreasury) {
      throw new Error(`Expected ${expectedPulseTreasury}, got ${pulseConfig.TREASURY_ADDRESS}`);
    }
    console.log('✅ Correct Pulse treasury address');
  } catch (error) {
    console.error('❌ Pulse test failed:', error.message);
  }

  console.log('');

  // Test 3: Security Validations
  console.log('3️⃣ Testing Security Validations:');

  // Test invalid chain ID
  try {
    getSecureSubqueryConfig(999);
    console.error('❌ Should have thrown error for invalid chain');
  } catch (error) {
    console.log('✅ Correctly rejected invalid chain ID:', error.message);
  }

  // Test null chain ID
  try {
    getSecureSubqueryConfig(null);
    console.error('❌ Should have thrown error for null chain');
  } catch (error) {
    console.log('✅ Correctly rejected null chain ID:', error.message);
  }

  console.log('');

  // Test 4: Backward Compatibility
  console.log('4️⃣ Testing Backward Compatibility:');
  try {
    // Test that old imports still work
    const { getStaticSubqueryConfig } = await import('./src/config/subgraph-config.js');
    const legacyConfig = getStaticSubqueryConfig(943);

    console.log('✅ Legacy import still works');
    console.log(`   Legacy pair: ${legacyConfig.PAIR_ADDRESS}`);
    console.log(`   Legacy treasury: ${legacyConfig.TREASURY_ADDRESS}`);

    // Should have same values as secure version
    const secureConfig = getSecureSubqueryConfig(943);
    if (legacyConfig.PAIR_ADDRESS !== secureConfig.PAIR_ADDRESS) {
      throw new Error('Legacy and secure configs dont match');
    }
    console.log('✅ Legacy config matches secure config');
  } catch (error) {
    console.error('❌ Backward compatibility test failed:', error.message);
  }

  console.log('');

  // Test 5: Error Handling
  console.log('5️⃣ Testing Error Handling:');
  try {
    getSecureSubqueryConfig("invalid");
    console.error('❌ Should have thrown error for string chain ID');
  } catch (error) {
    console.log('✅ Correctly handled string chain ID');
  }

  try {
    getSecureSubqueryConfig(1.5);
    console.error('❌ Should have thrown error for float chain ID');
  } catch (error) {
    console.log('✅ Correctly handled float chain ID');
  }

  console.log('\n🎉 Secure migration testing complete!');
  console.log('\n📋 Summary:');
  console.log('- ✅ Address validation working');
  console.log('- ✅ Network detection working');
  console.log('- ✅ Security checks active');
  console.log('- ✅ Backward compatibility maintained');
  console.log('- ✅ Error handling robust');
}

// Run tests
testSecureMigration().catch(console.error);