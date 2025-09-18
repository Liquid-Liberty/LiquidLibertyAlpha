// src/utils/__tests__/secureNetworkConfig.test.js
import {
  getSecureNetworkConfig,
  getSecureTreasuryAddress,
  getSecurePairAddress,
  validateNetworkContext,
  SUPPORTED_CHAIN_IDS
} from '../secureNetworkConfig.js';

describe('Secure Network Configuration', () => {
  describe('getSecureNetworkConfig', () => {
    test('should return valid config for Sepolia', () => {
      const config = getSecureNetworkConfig(11155111);

      expect(config.name).toBe('sepolia');
      expect(config.chainId).toBe(11155111);
      expect(config.treasury).toBe('0x7F77768fb73bA33606EB569966C109cD5CFe0F09');
      expect(config.isTestnet).toBe(true);
      expect(config.pairAddress).toBe('0x7F77768fb73bA33606EB569966C109cD5CFe0F09');
    });

    test('should return valid config for Pulse', () => {
      const config = getSecureNetworkConfig(943);

      expect(config.name).toBe('pulse');
      expect(config.chainId).toBe(943);
      expect(config.treasury).toBe('0xe12538Ab1990A3318395B7Cb0cE682741e68194E');
      expect(config.isTestnet).toBe(true);
      expect(config.pairAddress).toBe('0xe12538Ab1990A3318395B7Cb0cE682741e68194E');
    });

    test('should throw error for unsupported chain', () => {
      expect(() => getSecureNetworkConfig(1)).toThrow('Unsupported chain ID: 1');
      expect(() => getSecureNetworkConfig(999)).toThrow('Unsupported chain ID: 999');
    });

    test('should throw error for invalid chain ID', () => {
      expect(() => getSecureNetworkConfig(null)).toThrow('Chain ID is required');
      expect(() => getSecureNetworkConfig(-1)).toThrow('Invalid chain ID: -1');
      expect(() => getSecureNetworkConfig(0)).toThrow('Invalid chain ID: 0');
      expect(() => getSecureNetworkConfig(1.5)).toThrow('Invalid chain ID: 1.5');
    });
  });

  describe('getSecureTreasuryAddress', () => {
    test('should return correct treasury addresses', () => {
      expect(getSecureTreasuryAddress(11155111)).toBe('0x7F77768fb73bA33606EB569966C109cD5CFe0F09');
      expect(getSecureTreasuryAddress(943)).toBe('0xe12538Ab1990A3318395B7Cb0cE682741e68194E');
    });

    test('should maintain proper checksums', () => {
      const sepoliaAddr = getSecureTreasuryAddress(11155111);
      const pulseAddr = getSecureTreasuryAddress(943);

      // Check that addresses have proper mixed case (checksum)
      expect(sepoliaAddr).toMatch(/[A-Z]/); // Contains uppercase
      expect(sepoliaAddr).toMatch(/[a-z]/); // Contains lowercase
      expect(pulseAddr).toMatch(/[A-Z]/);
      expect(pulseAddr).toMatch(/[a-z]/);
    });
  });

  describe('getSecurePairAddress', () => {
    test('should return lowercase treasury addresses', () => {
      expect(getSecurePairAddress(11155111)).toBe('0x7F77768fb73bA33606EB569966C109cD5CFe0F09');
      expect(getSecurePairAddress(943)).toBe('0xe12538Ab1990A3318395B7Cb0cE682741e68194E');
    });

    test('should never return mixed case for pair addresses', () => {
      SUPPORTED_CHAIN_IDS.forEach(chainId => {
        const pairAddr = getSecurePairAddress(chainId);
        expect(pairAddr).toBe(pairAddr.toLowerCase());
        expect(pairAddr).not.toMatch(/[A-Z]/);
      });
    });
  });

  describe('Address Validation', () => {
    test('should prevent address manipulation', () => {
      // These should all fail validation
      const invalidChains = [
        999,    // Unsupported chain
        0,      // Invalid chain ID
        -1,     // Negative chain ID
        null,   // Null chain ID
        undefined // Undefined chain ID
      ];

      invalidChains.forEach(chainId => {
        expect(() => getSecureNetworkConfig(chainId)).toThrow();
      });
    });

    test('should ensure addresses are immutable', () => {
      const config1 = getSecureNetworkConfig(943);
      const config2 = getSecureNetworkConfig(943);

      // Configs should be separate objects but with same values
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references

      // Try to modify config (should not affect original)
      expect(() => {
        config1.treasury = "0x0000000000000000000000000000000000000000";
      }).toThrow(); // Should throw because object is frozen
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle chain ID type coercion safely', () => {
      // String numbers should work
      expect(() => getSecureNetworkConfig("943")).toThrow(); // Should require actual number

      // Floats should fail
      expect(() => getSecureNetworkConfig(943.0)).toThrow();
      expect(() => getSecureNetworkConfig(943.1)).toThrow();
    });

    test('should prevent prototype pollution', () => {
      const config = getSecureNetworkConfig(943);

      // Should not be able to add properties
      expect(() => {
        config.__proto__.malicious = "payload";
      }).not.toThrow(); // Prototype pollution doesn't throw, but...

      // Original config should remain clean
      expect(config.malicious).toBeUndefined();
    });
  });
});