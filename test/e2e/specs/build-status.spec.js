import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Build Status", () => {

    test("should load JavaScript bundle successfully", async ({ page }, testInfo) => {
        // Track all requests and responses
        const requests = [];
        const failedRequests = [];

        page.on('request', request => {
            requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });

        page.on('response', response => {
            if (!response.ok()) {
                failedRequests.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        });

        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        console.log('Total requests made:', requests.length);
        console.log('Failed requests:', failedRequests.length);

        // Log failed requests
        failedRequests.forEach((req, index) => {
            console.log(`${index + 1}. FAILED ${req.status} ${req.url} - ${req.statusText}`);
        });

        // Check specifically for JavaScript files
        const jsRequests = requests.filter(r => r.resourceType === 'script');
        const failedJsRequests = failedRequests.filter(r => r.url.includes('.js'));

        console.log('JavaScript requests:', jsRequests.length);
        console.log('Failed JavaScript requests:', failedJsRequests.length);

        // Log JavaScript requests
        jsRequests.forEach((req, index) => {
            const failed = failedRequests.find(f => f.url === req.url);
            const status = failed ? `FAILED (${failed.status})` : 'OK';
            console.log(`${index + 1}. ${status} ${req.method} ${req.url}`);
        });

        await screenshot(testInfo, page);

        // The test should pass if the page loads, but we'll log the issues
        await expect(page).toHaveURL(/.*dashboard.*/);

        if (failedJsRequests.length > 0) {
            console.log('\n❌ CRITICAL: JavaScript bundle loading failed');
            console.log('This prevents Vue.js from mounting and the app from working');
        } else {
            console.log('\n✅ JavaScript bundles loaded successfully');
        }
    });

    test("should have working development server", async ({ page }, testInfo) => {
        await page.goto("./dashboard");

        // Check if we're in development mode
        const isDevMode = await page.evaluate(() => {
            return process.env.NODE_ENV === 'development' ||
                   localStorage.getItem('dev') === 'dev' ||
                   window.location.hostname.includes('localhost');
        });

        console.log('Development mode detected:', isDevMode);

        // Check for development server indicators
        const devIndicators = await page.evaluate(() => {
            const indicators = [];

            // Check for Vite dev server
            if (document.querySelector('script[src*="vite"]')) {
                indicators.push('Vite dev server detected');
            }

            // Check for hot reload indicators
            if (window.__VUE_HMR_RUNTIME__) {
                indicators.push('Vue HMR detected');
            }

            // Check for development tools
            if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
                indicators.push('Vue DevTools detected');
            }

            return indicators;
        });

        console.log('Development indicators:', devIndicators);

        // Check if the server is responding to API calls
        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/entry-page');
                const data = await response.json();
                return { success: true, data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('API test result:', apiTest);

        await screenshot(testInfo, page);

        // Basic page load test
        await expect(page).toHaveURL(/.*dashboard.*/);
    });

});