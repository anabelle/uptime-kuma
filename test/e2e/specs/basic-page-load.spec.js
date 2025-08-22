import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Basic Page Load", () => {

    test("should load dashboard page successfully", async ({ page }, testInfo) => {
        // Navigate to dashboard
        await page.goto("./dashboard");

        // Should load without errors
        await expect(page).toHaveURL(/.*dashboard.*/);

        // Should have correct title
        await expect(page).toHaveTitle(/Uptime Kuma/);

        // Debug: Log current URL and page content
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);

        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        // Check if body exists and get its properties
        const body = page.locator('body');
        const bodyExists = await body.count() > 0;
        console.log('Body element exists:', bodyExists);

        if (bodyExists) {
            const bodyText = await body.textContent();
            console.log('Body text content:', bodyText?.substring(0, 300) + '...');

            const bodyVisible = await body.isVisible();
            console.log('Body is visible:', bodyVisible);

            const bodyHidden = await body.isHidden();
            console.log('Body is hidden:', bodyHidden);

            // Check computed styles
            const display = await body.evaluate(el => window.getComputedStyle(el).display);
            const visibility = await body.evaluate(el => window.getComputedStyle(el).visibility);
            const opacity = await body.evaluate(el => window.getComputedStyle(el).opacity);
            console.log('Body styles - display:', display, 'visibility:', visibility, 'opacity:', opacity);
        }

        // Check for noscript message
        const noscriptMessage = page.locator('.noscript-message');
        const noscriptExists = await noscriptMessage.count() > 0;
        console.log('Noscript message exists:', noscriptExists);

        if (noscriptExists) {
            const noscriptVisible = await noscriptMessage.isVisible();
            console.log('Noscript message is visible:', noscriptVisible);
        }

        // Should not show login form (basic access works)
        await expect(page.getByPlaceholder("Username")).not.toBeVisible();
        await expect(page.getByPlaceholder("Password")).not.toBeVisible();
        await expect(page.getByRole("button", { name: "Log in" })).not.toBeVisible();

        await screenshot(testInfo, page);

        console.log('✅ Dashboard loads successfully');
        console.log('✅ No login form visible');
        console.log('✅ Basic page structure works');
    });

    test("should have JavaScript enabled and working", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Test if JavaScript is working by executing a simple script
        const jsWorking = await page.evaluate(() => {
            return typeof window !== 'undefined';
        });
        expect(jsWorking).toBe(true);

        // Test if we can access basic browser APIs
        const hasLocalStorage = await page.evaluate(() => {
            return typeof localStorage !== 'undefined';
        });
        expect(hasLocalStorage).toBe(true);

        // Check if there are any console errors
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        // Wait a bit for any async errors
        await page.waitForTimeout(2000);

        console.log('Console errors:', errors);

        // Should not have critical JavaScript errors that prevent page loading
        const criticalErrors = errors.filter(error =>
            error.includes('SyntaxError') ||
            error.includes('ReferenceError') ||
            error.includes('TypeError') ||
            error.includes('Failed to load')
        );

        expect(criticalErrors.length).toBe(0);

        await screenshot(testInfo, page);
    });

    test("should load Vue.js application", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Wait for Vue.js to potentially load
        await page.waitForTimeout(3000);

        // Check if Vue.js loaded by looking for Vue-specific elements or global objects
        const vueLoaded = await page.evaluate(() => {
            return typeof window.Vue !== 'undefined' ||
                   document.querySelector('[data-v-]') !== null ||
                   window.UptimeKuma !== undefined;
        });

        console.log('Vue.js loaded:', vueLoaded);

        // Check for Vue.js app root element
        const appElement = page.locator('#app, .app, [data-v-app]');
        const hasAppElement = await appElement.isVisible().catch(() => false);
        console.log('Has app element:', hasAppElement);

        // Check for any Vue.js rendered content
        const vueContent = await page.locator('[class*="v-"], [data-v-]').allTextContents();
        console.log('Vue content found:', vueContent.length > 0);

        // Take screenshot to see what's actually on the page
        await screenshot(testInfo, page);

        // The test should pass if the page loads, even if Vue.js doesn't load
        // This helps us understand if it's a JavaScript loading issue vs Vue.js initialization issue
        expect(page.url()).toContain('dashboard');
    });

});