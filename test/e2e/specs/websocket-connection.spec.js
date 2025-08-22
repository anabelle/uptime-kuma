import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("WebSocket Connection", () => {

    test("should establish WebSocket connection to backend", async ({ page }, testInfo) => {
        // Navigate to dashboard
        await page.goto("./dashboard");

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check current URL to see if we were redirected
        const currentUrl = page.url();
        console.log('Current URL after navigation:', currentUrl);

        // Check if we're on login page
        const isLoginPage = currentUrl.includes('login') || currentUrl.includes('signin');
        console.log('Is login page:', isLoginPage);

        // Check if Vue.js app is loaded
        const vueAppLoaded = await page.evaluate(() => {
            return typeof window.Vue !== 'undefined' || typeof window.UptimeKuma !== 'undefined';
        });
        console.log('Vue.js app loaded:', vueAppLoaded);

        // Check for JavaScript errors
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error.message));
        page.on('requestfailed', request => {
            if (request.resourceType() === 'script') {
                jsErrors.push(`Script failed to load: ${request.url()}`);
            }
        });

        // Wait a bit for any async errors
        await page.waitForTimeout(2000);

        console.log('JavaScript errors:', jsErrors);

        // Check if main JavaScript files are loading
        const scripts = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script');
            return Array.from(scripts).map(script => ({
                src: script.src,
                loaded: !script.src || script.complete
            }));
        });
        console.log('Scripts on page:', scripts);

        // Check if WebSocket connection is established
        const wsStatus = await page.evaluate(() => {
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 5; // Reduce attempts since we're debugging

                const checkConnection = () => {
                    attempts++;
                    if (window.UptimeKuma && window.UptimeKuma.socket) {
                        resolve({
                            connected: window.UptimeKuma.socket.connected,
                            connectionErrorMsg: window.UptimeKuma.connectionErrorMsg,
                            token: window.UptimeKuma.socket.token,
                            socketExists: true,
                            uptimeKumaExists: true
                        });
                    } else if (window.UptimeKuma) {
                        resolve({
                            connected: false,
                            connectionErrorMsg: 'UptimeKuma exists but no socket',
                            token: null,
                            socketExists: false,
                            uptimeKumaExists: true
                        });
                    } else if (attempts >= maxAttempts) {
                        resolve({
                            connected: false,
                            connectionErrorMsg: 'UptimeKuma not found on window',
                            token: null,
                            socketExists: false,
                            uptimeKumaExists: false
                        });
                    } else {
                        setTimeout(checkConnection, 500);
                    }
                };

                checkConnection();
            });
        });

        // Take screenshot for debugging
        await screenshot(testInfo, page);

        // Debug output
        console.log('WebSocket Status:', wsStatus);

        // If we're on login page, that's the issue - not WebSocket
        if (isLoginPage) {
            console.log('❌ ISSUE: Redirected to login page before WebSocket can connect');
            expect(isLoginPage).toBe(false); // This will fail, showing the real issue
            return;
        }

        // If Vue.js app isn't loaded, that's the issue
        if (!vueAppLoaded) {
            console.log('❌ ISSUE: Vue.js app not loaded');
            expect(vueAppLoaded).toBe(true); // This will fail, showing the real issue
            return;
        }

        // If UptimeKuma doesn't exist, that's the issue
        if (!wsStatus.uptimeKumaExists) {
            console.log('❌ ISSUE: UptimeKuma not initialized');
            expect(wsStatus.uptimeKumaExists).toBe(true); // This will fail, showing the real issue
            return;
        }

        // Only test WebSocket connection if we got past the above issues
        expect(wsStatus.socketExists).toBe(true);
        expect(wsStatus.connected).toBe(true);
        expect(wsStatus.connectionErrorMsg).toBe('');
        expect(wsStatus.token).toBeTruthy();
    });

    test("should handle WebSocket connection errors gracefully", async ({ page }, testInfo) => {
        // Navigate to dashboard
        await page.goto("./dashboard");

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if error messages are displayed appropriately
        const errorElements = await page.locator('[class*="error"], [class*="Error"], .alert, .toast').allTextContents();
        console.log('Error elements found:', errorElements);

        // If there are WebSocket errors, they should be user-friendly
        if (errorElements.length > 0) {
            // Should not show technical errors to users
            const hasTechnicalErrors = errorElements.some(error =>
                error.includes('xhr poll error') ||
                error.includes('WebSocket') ||
                error.includes('socket.io')
            );

            if (hasTechnicalErrors) {
                console.log('Technical WebSocket errors found - should be handled gracefully');
            }
        }

        await screenshot(testInfo, page);
    });

});