import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Dashboard Loading", () => {

    test("should load dashboard HTML structure", async ({ page }, testInfo) => {
        // Navigate to dashboard
        await page.goto("./dashboard");

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check basic HTML structure
        const title = await page.title();
        console.log('Page title:', title);

        // Check if we have basic HTML elements
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // Check for app container
        const app = page.locator('#app');
        const appExists = await app.isVisible().catch(() => false);
        console.log('App container exists:', appExists);

        if (appExists) {
            // Get the content of the app container
            const appContent = await app.textContent();
            console.log('App container content:', appContent?.substring(0, 200) + '...');
        }

        // Check for any Vue.js related elements
        const vueElements = await page.locator('[data-v]').allTextContents().catch(() => []);
        console.log('Vue.js elements found:', vueElements.length);

        // Check for router-view
        const routerView = page.locator('router-view');
        const routerViewExists = await routerView.isVisible().catch(() => false);
        console.log('Router view exists:', routerViewExists);

        // Take screenshot
        await screenshot(testInfo, page);

        // Basic assertions
        expect(title).toBeTruthy();
        expect(appExists).toBe(true);
    });

    test("should load main.js and initialize Vue app", async ({ page }, testInfo) => {
        // Listen for console messages
        const consoleMessages = [];
        page.on('console', msg => consoleMessages.push(msg.text()));

        // Navigate to dashboard
        await page.goto("./dashboard");

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait a bit for Vue.js to initialize
        await page.waitForTimeout(3000);

        // Check console messages for any Vue.js initialization messages
        console.log('Console messages:', consoleMessages);

        // Check if Vue.js is loaded
        const vueLoaded = await page.evaluate(() => {
            return {
                vue: typeof window.Vue !== 'undefined',
                vueApp: !!document.querySelector('#app'),
                uptimeKuma: typeof window.UptimeKuma !== 'undefined',
                vueVersion: window.Vue ? window.Vue.version : null
            };
        });

        console.log('Vue.js status:', vueLoaded);

        // Take screenshot
        await screenshot(testInfo, page);

        // Assertions
        expect(vueLoaded.vueApp).toBe(true);
    });

});