import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Basic Navigation", () => {

    test("should navigate to dashboard without JavaScript errors", async ({ page }, testInfo) => {
        const errors = [];
        const consoleMessages = [];

        // Listen for errors and console messages
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));

        // Navigate to dashboard
        await page.goto("./dashboard");

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait a bit more for any async operations
        await page.waitForTimeout(3000);

        console.log('Page errors:', errors);
        console.log('Console messages:', consoleMessages.filter(msg => msg.includes('error') || msg.includes('Error') || msg.includes('Failed')));

        // Take screenshot
        await screenshot(testInfo, page);

        // Basic checks
        expect(page.url()).toContain('dashboard');
        expect(errors.length).toBe(0); // No JavaScript errors should occur
    });

    test("should load basic HTML elements", async ({ page }, testInfo) => {
        await page.goto("./dashboard");

        // Check for basic HTML structure
        const html = await page.locator('html');
        await expect(html).toBeVisible();

        const body = await page.locator('body');
        await expect(body).toBeVisible();

        // Check for head elements
        const title = await page.title();
        expect(title).toBeTruthy();

        // Check for meta tags
        const viewport = await page.locator('meta[name="viewport"]');
        const hasViewport = await viewport.isVisible().catch(() => false);
        expect(hasViewport).toBe(true);

        await screenshot(testInfo, page);
    });

});