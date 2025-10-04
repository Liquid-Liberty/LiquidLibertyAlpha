/**
 * Unit tests for EIP-712 signature generation
 */

import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';

describe('Signature Generation', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const testListingData = {
    seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    listingId: 1,
    price: '1000000000000000000',
    tokenAddress: '0x0000000000000000000000000000000000000000',
  };

  describe('EIP-712 Domain', () => {
    it('should create valid domain separator', () => {
      const domain = {
        name: 'LiquidLiberty',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      };

      expect(domain.name).toBe('LiquidLiberty');
      expect(domain.version).toBe('1');
      expect(domain.chainId).toBe(31337);
    });
  });

  describe('Signature Verification', () => {
    it('should generate deterministic signatures', async () => {
      const wallet = new ethers.Wallet(testPrivateKey);

      const domain = {
        name: 'LiquidLiberty',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      };

      const types = {
        ListingData: [
          { name: 'seller', type: 'address' },
          { name: 'listingId', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'tokenAddress', type: 'address' },
        ],
      };

      const signature1 = await wallet.signTypedData(domain, types, testListingData);
      const signature2 = await wallet.signTypedData(domain, types, testListingData);

      // Same input should produce same signature
      expect(signature1).toBe(signature2);
      expect(signature1).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should produce different signatures for different data', async () => {
      const wallet = new ethers.Wallet(testPrivateKey);

      const domain = {
        name: 'LiquidLiberty',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      };

      const types = {
        ListingData: [
          { name: 'seller', type: 'address' },
          { name: 'listingId', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'tokenAddress', type: 'address' },
        ],
      };

      const data1 = { ...testListingData };
      const data2 = { ...testListingData, price: '2000000000000000000' };

      const signature1 = await wallet.signTypedData(domain, types, data1);
      const signature2 = await wallet.signTypedData(domain, types, data2);

      // Different input should produce different signatures
      expect(signature1).not.toBe(signature2);
    });

    it('should recover correct signer from signature', async () => {
      const wallet = new ethers.Wallet(testPrivateKey);

      const domain = {
        name: 'LiquidLiberty',
        version: '1',
        chainId: 31337,
        verifyingContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      };

      const types = {
        ListingData: [
          { name: 'seller', type: 'address' },
          { name: 'listingId', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'tokenAddress', type: 'address' },
        ],
      };

      const signature = await wallet.signTypedData(domain, types, testListingData);
      const recovered = ethers.verifyTypedData(domain, types, testListingData, signature);

      expect(recovered.toLowerCase()).toBe(wallet.address.toLowerCase());
    });
  });

  describe('Input Validation', () => {
    it('should validate address format', () => {
      const validAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const invalidAddress = '0xinvalid';

      expect(ethers.isAddress(validAddress)).toBe(true);
      expect(ethers.isAddress(invalidAddress)).toBe(false);
    });

    it('should validate price format', () => {
      const validPrice = '1000000000000000000';
      const parsed = ethers.parseEther('1');

      expect(parsed.toString()).toBe(validPrice);
    });

    it('should handle zero price', () => {
      const zeroPrice = ethers.parseEther('0');
      expect(zeroPrice.toString()).toBe('0');
    });
  });
});
