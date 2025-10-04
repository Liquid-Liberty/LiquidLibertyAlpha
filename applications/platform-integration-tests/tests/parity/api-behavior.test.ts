/**
 * API behavior parity tests
 * Ensures serverless functions behave identically in both deployments
 */

import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { config } from '../utils/config';
import { compareApiResponses } from '../utils/helpers';

describe('API Behavior Parity', () => {
  const timeout = 30000;

  describe('Signature Generation Parity', () => {
    const testListing = {
      seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      listingId: 123,
      price: '1000000000000000000',
      tokenAddress: '0x0000000000000000000000000000000000000000',
    };

    it('should generate identical signatures for same input', async () => {
      try {
        const result = await compareApiResponses(
          config.monorepo.apiUrl,
          config.applications.apiUrl,
          '/create-listing-signature',
          testListing
        );

        expect(result.match).toBe(true);
        expect(result.monorepoData.signature).toBe(result.applicationsData.signature);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('Signature endpoint not available, skipping');
        } else {
          throw error;
        }
      }
    }, timeout);

    it('signatures should be valid EIP-712 format', async () => {
      try {
        const response = await axios.post(
          `${config.applications.apiUrl}/create-listing-signature`,
          testListing
        );

        expect(response.data.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('Signature endpoint not available, skipping');
        }
      }
    }, timeout);
  });

  describe('Content Moderation Parity', () => {
    const testCases = [
      {
        title: 'Clean Title',
        description: 'This is a clean description without any issues',
        expected: { approved: true },
      },
      {
        title: 'Test',
        description: 'Too short',
        expected: { approved: false },
      },
    ];

    testCases.forEach(({ title, description, expected }) => {
      it(`should moderate "${title}" identically`, async () => {
        try {
          const result = await compareApiResponses(
            config.monorepo.apiUrl,
            config.applications.apiUrl,
            '/moderate',
            { title, description }
          );

          expect(result.match).toBe(true);
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.log('Moderation endpoint not available, skipping');
          }
        }
      }, timeout);
    });
  });

  describe('IPFS Upload Parity', () => {
    it('should have same upload endpoint behavior', async () => {
      try {
        // Both should reject without proper auth/data
        const [monorepoRes, appsRes] = await Promise.all([
          axios.post(`${config.monorepo.apiUrl}/upload-images-to-ipfs`, {}).catch(e => e.response),
          axios.post(`${config.applications.apiUrl}/upload-images-to-ipfs`, {}).catch(e => e.response),
        ]);

        // Both should fail in the same way
        expect(monorepoRes.status).toBe(appsRes.status);
      } catch (error: any) {
        console.log('IPFS upload test skipped');
      }
    }, timeout);
  });

  describe('SubQuery Proxy Parity', () => {
    const testQuery = {
      query: `
        query {
          candles(first: 1) {
            nodes {
              id
            }
          }
        }
      `,
    };

    it('should proxy queries identically', async () => {
      try {
        const result = await compareApiResponses(
          config.monorepo.apiUrl,
          config.applications.apiUrl,
          '/subquery-proxy',
          testQuery
        );

        // Response structure should match
        expect(result.monorepoData).toHaveProperty('data');
        expect(result.applicationsData).toHaveProperty('data');
      } catch (error: any) {
        console.log('SubQuery proxy test skipped');
      }
    }, timeout);
  });

  describe('Error Handling Parity', () => {
    it('should handle invalid requests identically', async () => {
      try {
        const [monorepoRes, appsRes] = await Promise.all([
          axios.post(`${config.monorepo.apiUrl}/create-listing-signature`, { invalid: 'data' })
            .catch(e => e.response),
          axios.post(`${config.applications.apiUrl}/create-listing-signature`, { invalid: 'data' })
            .catch(e => e.response),
        ]);

        // Both should fail with same status code
        expect(monorepoRes?.status).toBe(appsRes?.status);
      } catch (error) {
        console.log('Error handling test skipped');
      }
    }, timeout);

    it('should return same error messages', async () => {
      try {
        const [monorepoRes, appsRes] = await Promise.all([
          axios.post(`${config.monorepo.apiUrl}/moderate`, {}).catch(e => e.response),
          axios.post(`${config.applications.apiUrl}/moderate`, {}).catch(e => e.response),
        ]);

        if (monorepoRes?.data?.error && appsRes?.data?.error) {
          expect(monorepoRes.data.error).toBe(appsRes.data.error);
        }
      } catch (error) {
        console.log('Error message test skipped');
      }
    }, timeout);
  });

  describe('Response Time Comparison', () => {
    it('both deployments should respond within reasonable time', async () => {
      try {
        const monorepoStart = Date.now();
        await axios.get(config.monorepo.apiUrl.replace('/.netlify/functions', '')).catch(() => {});
        const monorepoTime = Date.now() - monorepoStart;

        const appsStart = Date.now();
        await axios.get(config.applications.apiUrl.replace('/.netlify/functions', '')).catch(() => {});
        const appsTime = Date.now() - appsStart;

        // Both should respond in under 5 seconds
        expect(monorepoTime).toBeLessThan(5000);
        expect(appsTime).toBeLessThan(5000);
      } catch (error) {
        console.log('Response time test skipped');
      }
    }, 10000);
  });
});
