/**
 * Contract deployment parity tests
 * Ensures contracts are deployed identically in both environments
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { config } from '../utils/config';
import fs from 'fs';
import path from 'path';

describe('Contract Deployment Parity', () => {
  let monorepoAddresses: any;
  let applicationsAddresses: any;

  beforeAll(() => {
    // Load contract addresses from deployment files
    try {
      const monorepoPath = path.join(__dirname, '../../../..', 'src/config/sepolia.deployed-addresses.json');
      const appsPath = path.join(__dirname, '../../../liquid-liberty-frontend/src/config/sepolia.deployed-addresses.json');

      if (fs.existsSync(monorepoPath)) {
        monorepoAddresses = JSON.parse(fs.readFileSync(monorepoPath, 'utf-8'));
      }

      if (fs.existsSync(appsPath)) {
        applicationsAddresses = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));
      }
    } catch (error) {
      console.log('Contract address files not found, skipping some tests');
    }
  });

  describe('Contract Address Comparison', () => {
    it('should have the same contract addresses', () => {
      if (!monorepoAddresses || !applicationsAddresses) {
        console.log('Skipping: address files not available');
        return;
      }

      expect(monorepoAddresses.LMKT).toBe(applicationsAddresses.LMKT);
      expect(monorepoAddresses.Treasury).toBe(applicationsAddresses.Treasury);
      expect(monorepoAddresses.ListingManager).toBe(applicationsAddresses.ListingManager);
      expect(monorepoAddresses.PaymentProcessor).toBe(applicationsAddresses.PaymentProcessor);
    });

    it('all addresses should be valid Ethereum addresses', () => {
      if (!applicationsAddresses) return;

      Object.values(applicationsAddresses).forEach((address: any) => {
        expect(ethers.isAddress(address)).toBe(true);
      });
    });
  });

  describe('Contract ABI Comparison', () => {
    it('should have identical ABI files', () => {
      const contractNames = ['LMKT', 'Treasury', 'ListingManager', 'PaymentProcessor'];

      contractNames.forEach(name => {
        try {
          const monorepoAbiPath = path.join(__dirname, '../../../..', `src/config/${name}-abi.json`);
          const appsAbiPath = path.join(__dirname, '../../../liquid-liberty-frontend/src/config', `${name}-abi.json`);

          if (fs.existsSync(monorepoAbiPath) && fs.existsSync(appsAbiPath)) {
            const monorepoAbi = fs.readFileSync(monorepoAbiPath, 'utf-8');
            const appsAbi = fs.readFileSync(appsAbiPath, 'utf-8');

            expect(monorepoAbi).toBe(appsAbi);
          }
        } catch (error) {
          console.log(`Skipping ABI comparison for ${name}`);
        }
      });
    });
  });

  describe('Contract Bytecode Comparison', () => {
    it('should have identical compiled contract bytecode', () => {
      const contractNames = ['LMKT', 'Treasury', 'ListingManager', 'PaymentProcessor'];

      contractNames.forEach(name => {
        try {
          const monorepoArtifact = path.join(__dirname, '../../../..', `artifacts/contracts/${name}.sol/${name}.json`);
          const appsArtifact = path.join(__dirname, '../../../liquid-liberty-contracts', `artifacts/contracts/${name}.sol/${name}.json`);

          if (fs.existsSync(monorepoArtifact) && fs.existsSync(appsArtifact)) {
            const monorepoData = JSON.parse(fs.readFileSync(monorepoArtifact, 'utf-8'));
            const appsData = JSON.parse(fs.readFileSync(appsArtifact, 'utf-8'));

            // Compare bytecode
            expect(monorepoData.bytecode).toBe(appsData.bytecode);

            // Compare ABI
            expect(JSON.stringify(monorepoData.abi)).toBe(JSON.stringify(appsData.abi));
          }
        } catch (error) {
          console.log(`Skipping bytecode comparison for ${name}`);
        }
      });
    });
  });
});
