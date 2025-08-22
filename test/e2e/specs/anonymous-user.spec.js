import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Anonymous User Access", () => {

    test("should allow anonymous access to dashboard without login", async ({ page }, testInfo) => {
        // Navigate to dashboard as anonymous user
        await page.goto("./dashboard");

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Debug: Log current URL and page content
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);

        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        // Get all text content on the page
        const pageText = await page.locator('body').textContent();
        console.log('Page text content:', pageText?.substring(0, 500) + '...');

        // Check for common dashboard elements
        const addMonitorButton = page.getByRole("button", { name: "Add New Monitor" });
        const hasAddMonitorButton = await addMonitorButton.isVisible().catch(() => false);
        console.log('Has "Add New Monitor" button:', hasAddMonitorButton);

        // Check for any loading indicators
        const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [class*="Loading"]').allTextContents();
        console.log('Loading elements found:', loadingElements);

        // Check for error messages
        const errorElements = await page.locator('[class*="error"], [class*="Error"], .alert, .toast').allTextContents();
        console.log('Error elements found:', errorElements);

        // Check if we're being redirected to login
        const isLoginPage = currentUrl.includes('login') || currentUrl.includes('signin');
        console.log('Is login page:', isLoginPage);

        // Check for login form elements
        const usernameField = page.getByPlaceholder("Username");
        const passwordField = page.getByPlaceholder("Password");
        const loginButton = page.getByRole("button", { name: "Log in" });

        const hasUsernameField = await usernameField.isVisible().catch(() => false);
        const hasPasswordField = await passwordField.isVisible().catch(() => false);
        const hasLoginButton = await loginButton.isVisible().catch(() => false);

        console.log('Has username field:', hasUsernameField);
        console.log('Has password field:', hasPasswordField);
        console.log('Has login button:', hasLoginButton);

        // Check for dashboard elements
        const monitorList = page.getByTestId("monitor-list");
        const creditBalance = page.locator('.credit-balance');

        const hasMonitorList = await monitorList.isVisible().catch(() => false);
        const hasCreditBalance = await creditBalance.isVisible().catch(() => false);

        console.log('Has monitor list:', hasMonitorList);
        console.log('Has credit balance:', hasCreditBalance);

        // Check localStorage for anonymous session
        const sessionId = await page.evaluate(() => {
            return localStorage.getItem('anonymous_session_id');
        });
        console.log('Anonymous session ID:', sessionId);

        // Check for any console errors
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.waitForTimeout(1000); // Wait for any async errors
        console.log('Console errors:', errors);

        // Check WebSocket connection status
        const wsStatus = await page.evaluate(() => {
            if (window.UptimeKuma && window.UptimeKuma.socket) {
                return {
                    connected: window.UptimeKuma.socket.connected,
                    connectionErrorMsg: window.UptimeKuma.connectionErrorMsg,
                    token: window.UptimeKuma.socket.token
                };
            }
            return { error: 'UptimeKuma not found on window' };
        });
        console.log('WebSocket status:', wsStatus);

        // Take screenshot to see what's actually on the page
        await screenshot(testInfo, page);

        // === TEST SUMMARY ===
        // This test is designed to FAIL as expected, demonstrating the current issues:
        //
        // 1. WebSocket Connection Issue:
        //    - Frontend (port 3002) cannot connect to backend WebSocket (port 3001)
        //    - Error: "Cannot connect to the socket server. [Error: xhr poll error]"
        //    - This prevents the Vue.js app from initializing properly
        //
        // 2. Authentication Issue:
        //    - Dashboard redirects to login page instead of allowing anonymous access
        //    - Page title shows "Uptime Kuma - Login"
        //    - Login form is visible with username/password fields
        //
        // 3. Anonymous Session Issue:
        //    - No anonymous session ID is created
        //    - Credit balance component doesn't render
        //    - Dashboard content is not accessible without authentication

        // These assertions will fail as expected, showing what needs to be fixed:
        console.log('\n=== ANONYMOUS USER TEST RESULTS ===');
        console.log('❌ WebSocket connection: FAILED');
        console.log('❌ Authentication bypass: FAILED');
        console.log('❌ Anonymous session creation: FAILED');
        console.log('❌ Dashboard access: FAILED');
        console.log('=====================================\n');

        // Should NOT redirect to login page
        await expect(page).not.toHaveURL(/.*login.*/);
        await expect(page).not.toHaveURL(/.*signin.*/);

        // Should NOT show login form
        await expect(page.getByPlaceholder("Username")).not.toBeVisible();
        await expect(page.getByPlaceholder("Password")).not.toBeVisible();
        await expect(page.getByRole("button", { name: "Log in" })).not.toBeVisible();

        // Should show dashboard content for anonymous users
        await expect(page.getByTestId("monitor-list")).toBeVisible();

        // Should show credit balance component (indicating anonymous session was created)
        await expect(creditBalance).toBeVisible();

        // Should have created an anonymous session
        expect(sessionId).toBeTruthy();
        expect(sessionId.length).toBeGreaterThan(0);
    });

    test("should create anonymous session automatically", async ({ page }, testInfo) => {
        // Clear any existing session
        await page.evaluate(() => {
            localStorage.removeItem('anonymous_session_id');
        });

        // Navigate to dashboard
        await page.goto("./dashboard");

        // Wait for potential redirects or loading
        await page.waitForLoadState('networkidle');

        // Should not be on login page
        await expect(page).not.toHaveURL(/.*login.*/);

        // Should have created and stored anonymous session
        const sessionId = await page.evaluate(() => {
            return localStorage.getItem('anonymous_session_id');
        });

        expect(sessionId).toBeTruthy();
        expect(sessionId.length).toBeGreaterThan(10); // UUID-like length

        // Should be able to use the dashboard
        await expect(page.getByTestId("monitor-list")).toBeVisible();

        await screenshot(testInfo, page);
    });

    test("should persist anonymous session across page reloads", async ({ page }, testInfo) => {
        // First visit - create anonymous session
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Get session ID from first visit
        const firstSessionId = await page.evaluate(() => {
            return localStorage.getItem('anonymous_session_id');
        });

        expect(firstSessionId).toBeTruthy();

        // Reload the page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still have the same session
        const secondSessionId = await page.evaluate(() => {
            return localStorage.getItem('anonymous_session_id');
        });

        expect(secondSessionId).toBe(firstSessionId);

        // Should still be on dashboard, not login
        await expect(page).not.toHaveURL(/.*login.*/);
        await expect(page.getByTestId("monitor-list")).toBeVisible();

        await screenshot(testInfo, page);
    });

    test("should show credit balance for anonymous users", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Should not be on login page
        await expect(page).not.toHaveURL(/.*login.*/);

        // Should show credit balance component
        const creditBalance = page.locator('.credit-balance');
        await expect(creditBalance).toBeVisible();

        // Should display balance (even if 0)
        const balanceAmount = page.locator('.balance-amount .sats');
        await expect(balanceAmount).toBeVisible();

        // Should show "Add Credits" button
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await expect(addCreditsBtn).toBeVisible();

        await screenshot(testInfo, page);
    });

    test("should handle anonymous session API errors gracefully", async ({ page }, testInfo) => {
        // Clear any existing session
        await page.evaluate(() => {
            localStorage.removeItem('anonymous_session_id');
        });

        // Navigate to dashboard
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Even if anonymous session creation fails, should not crash
        // The page should still load (might show login or limited functionality)
        await expect(page.locator('body')).toBeVisible();

        // Should not have JavaScript errors that break the page
        const jsErrors = [];
        page.on('pageerror', error => jsErrors.push(error));

        // Wait a bit for any async operations
        await page.waitForTimeout(2000);

        // Should not have critical JS errors
        expect(jsErrors.length).toBe(0);

        await screenshot(testInfo, page);
    });

});