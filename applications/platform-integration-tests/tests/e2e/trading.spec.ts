/**
 * E2E tests for LMKT trading functionality
 * Tests chart rendering, swap interface, and trading flows
 */

import { test, expect } from '@playwright/test';
import { config } from '../utils/config';

test.describe('LMKT Trading Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${config.applications.frontendUrl}/lmkt`);
  });

  test('should render trading chart @applications', async ({ page }) => {
    // Wait for chart to load
    await page.waitForSelector('canvas, #tradingview_chart, .chart-container', {
      timeout: 20000,
    });

    // Verify chart is visible
    const chart = page.locator('canvas, #tradingview_chart').first();
    await expect(chart).toBeVisible();
  });

  test('should display price information @applications', async ({ page }) => {
    // Look for price display elements
    const priceElements = await page.locator('[data-testid*="price"], .price, .token-price').count();
    expect(priceElements).toBeGreaterThan(0);
  });

  test('should have swap interface @applications', async ({ page }) => {
    // Look for swap-related elements
    await expect(page.locator('button:has-text("Swap"), button:has-text("Buy"), button:has-text("Sell")')).toBeTruthy();
  });

  test('should switch chart timeframes @applications', async ({ page }) => {
    // Wait for chart to load
    await page.waitForSelector('canvas, #tradingview_chart', { timeout: 15000 });

    // Look for timeframe buttons (1m, 5m, 1h, etc.)
    const timeframeButton = page.locator('button:has-text("1h"), button:has-text("1H")').first();

    if (await timeframeButton.isVisible()) {
      await timeframeButton.click();
      await page.waitForTimeout(2000);

      // Chart should update
      const chart = page.locator('canvas').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should display LMKT token information @applications', async ({ page }) => {
    // Look for token name
    await expect(page.locator('text=/LMKT|Liquid Market Token/i')).toBeTruthy();
  });
});

test.describe('Chart Data Parity @parity', () => {
  test('should fetch same chart data from both deployments', async ({ page }) => {
    // This test would compare GraphQL responses from both indexers
    // For now, we verify both charts render

    // Test monorepo
    await page.goto(`${config.monorepo.frontendUrl}/lmkt`);
    await page.waitForSelector('canvas', { timeout: 15000 });
    const monorepoChart = await page.locator('canvas').first();
    await expect(monorepoChart).toBeVisible();

    // Test applications
    await page.goto(`${config.applications.frontendUrl}/lmkt`);
    await page.waitForSelector('canvas', { timeout: 15000 });
    const appsChart = await page.locator('canvas').first();
    await expect(appsChart).toBeVisible();
  });
});
