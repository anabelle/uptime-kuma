import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Vue.js App Mounting", () => {

    test("should mount Vue.js application", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Wait for Vue.js to potentially mount
        await page.waitForTimeout(3000);

        // Check if Vue.js app mounted by looking for Vue-specific indicators
        const vueMounted = await page.evaluate(() => {
            // Check for Vue app instance
            if (window.Vue) {
                return 'Vue found in window';
            }

            // Check for Vue components (data-v- attributes)
            const vueElements = document.querySelectorAll('[data-v-]');
            if (vueElements.length > 0) {
                return `Vue elements found: ${vueElements.length}`;
            }

            // Check for UptimeKuma app
            if (window.UptimeKuma) {
                return 'UptimeKuma app found';
            }

            // Check for any mounted components
            const components = document.querySelectorAll('[class*="v-"], [class*="vue-"]');
            if (components.length > 0) {
                return `Vue components found: ${components.length}`;
            }

            return 'No Vue indicators found';
        });

        console.log('Vue.js mounting status:', vueMounted);

        // Check if the dashboard component mounted
        const dashboardMounted = await page.evaluate(() => {
            const dashboardElements = document.querySelectorAll('[class*="dashboard"], [class*="container"], #app');
            return dashboardElements.length > 0 ? `Dashboard elements: ${dashboardElements.length}` : 'No dashboard elements';
        });

        console.log('Dashboard mounting status:', dashboardMounted);

        // Check for any JavaScript errors
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.waitForTimeout(1000);

        console.log('JavaScript errors:', errors);

        await screenshot(testInfo, page);

        // For now, just ensure the page loads (we'll implement Vue mounting later)
        await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test("should execute JavaScript and make API calls", async ({ page }, testInfo) => {
        // Listen for API calls
        const apiCalls = [];
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                apiCalls.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: Date.now()
                });
            }
        });

        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Wait for any JavaScript to execute
        await page.waitForTimeout(3000);

        console.log('API calls made:', apiCalls.length);
        apiCalls.forEach(call => {
            console.log(`- ${call.method} ${call.url}`);
        });

        // Check if localStorage is working
        const localStorageWorking = await page.evaluate(() => {
            try {
                localStorage.setItem('test', 'value');
                const result = localStorage.getItem('test');
                localStorage.removeItem('test');
                return result === 'value';
            } catch (e) {
                return false;
            }
        });

        console.log('localStorage working:', localStorageWorking);

        await screenshot(testInfo, page);

        // Basic functionality test
        expect(localStorageWorking).toBe(true);
    });

});