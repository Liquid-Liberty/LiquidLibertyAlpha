/**
 * Common test helper functions
 */

import { ethers } from 'ethers';
import axios from 'axios';

/**
 * Wait for a specific condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Generate a random wallet for testing
 */
export function generateTestWallet(): ethers.Wallet {
  return ethers.Wallet.createRandom();
}

/**
 * Compare API responses between monorepo and applications
 */
export async function compareApiResponses(
  monorepoUrl: string,
  applicationsUrl: string,
  endpoint: string,
  data?: any
): Promise<{ match: boolean; monorepoData: any; applicationsData: any }> {
  const [monorepoRes, applicationsRes] = await Promise.all([
    axios.post(`${monorepoUrl}${endpoint}`, data),
    axios.post(`${applicationsUrl}${endpoint}`, data),
  ]);

  return {
    match: JSON.stringify(monorepoRes.data) === JSON.stringify(applicationsRes.data),
    monorepoData: monorepoRes.data,
    applicationsData: applicationsRes.data,
  };
}

/**
 * Fund a test wallet with ETH
 */
export async function fundWallet(
  provider: ethers.Provider,
  address: string,
  amount: string = '10'
): Promise<void> {
  const signer = await provider.getSigner();
  const tx = await signer.sendTransaction({
    to: address,
    value: ethers.parseEther(amount),
  });
  await tx.wait();
}
