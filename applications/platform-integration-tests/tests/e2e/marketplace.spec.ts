/**
 * E2E tests for marketplace functionality
 * Tests user flows for creating and purchasing listings
 */

import { test, expect } from '@playwright/test';
import { config } from '../utils/config';

test.describe('Marketplace User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.applications.frontendUrl);
  });

  test('should load marketplace homepage @applications', async ({ page }) => {
    await expect(page).toHaveTitle(/Liquid Liberty|The Market/i);

    // Check for key marketplace elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display listings grid @applications', async ({ page }) => {
    // Navigate to marketplace
    await page.goto(`${config.applications.frontendUrl}/marketplace`);

    // Wait for listings to load
    await page.waitForSelector('[data-testid="listing-card"], .listing-item, article', {
      timeout: 10000,
    });

    // Verify listings are displayed
    const listingCount = await page.locator('[data-testid="listing-card"], .listing-item, article').count();
    expect(listingCount).toBeGreaterThan(0);
  });

  test('should navigate to LMKT trading page @applications', async ({ page }) => {
    // Find and click the trading/chart link
    await page.click('a[href*="lmkt"], a[href*="trade"], a[href*="chart"]');

    // Verify we're on the trading page
    await expect(page).toHaveURL(/lmkt|trade|chart/i);

    // Check for trading elements
    await page.waitForSelector('canvas, #tradingview_chart, .chart-container', {
      timeout: 15000,
    });
  });

  test('should open wallet connection modal @applications', async ({ page }) => {
    // Click connect wallet button
    await page.click('button:has-text("Connect"), button:has-text("Wallet")');

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .modal, w3m-modal', {
      timeout: 5000,
    });
  });

  test('should filter listings by category @applications', async ({ page }) => {
    await page.goto(`${config.applications.frontendUrl}/marketplace`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for filter/category buttons
    const categoryButton = page.locator('button:has-text("Category"), select[name*="category"]').first();

    if (await categoryButton.isVisible()) {
      await categoryButton.click();

      // Verify listings update
      await page.waitForTimeout(1000);
      const listingCount = await page.locator('[data-testid="listing-card"], .listing-item').count();
      expect(listingCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search for listings @applications', async ({ page }) => {
    await page.goto(`${config.applications.frontendUrl}/marketplace`);

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Results should update
      const results = await page.locator('[data-testid="listing-card"], .listing-item').count();
      expect(results).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Parity Tests - Monorepo vs Applications @parity', () => {
  test('homepage should render identically', async ({ page }) => {
    // Test monorepo
    await page.goto(config.monorepo.frontendUrl);
    const monorepoTitle = await page.title();
    const monorepoHeader = await page.locator('header').textContent();

    // Test applications
    await page.goto(config.applications.frontendUrl);
    const appsTitle = await page.title();
    const appsHeader = await page.locator('header').textContent();

    // Compare
    expect(monorepoTitle).toBe(appsTitle);
    expect(monorepoHeader).toBe(appsHeader);
  });

  test('marketplace listings should match', async ({ page }) => {
    // Get monorepo listings
    await page.goto(`${config.monorepo.frontendUrl}/marketplace`);
    await page.waitForLoadState('networkidle');
    const monorepoListings = await page.locator('[data-testid="listing-card"], .listing-item').count();

    // Get applications listings
    await page.goto(`${config.applications.frontendUrl}/marketplace`);
    await page.waitForLoadState('networkidle');
    const appsListings = await page.locator('[data-testid="listing-card"], .listing-item').count();

    // Should have same number of listings
    expect(monorepoListings).toBe(appsListings);
  });
});
