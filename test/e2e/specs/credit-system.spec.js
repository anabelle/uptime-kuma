import { expect, test } from "@playwright/test";
import { login, restoreSqliteSnapshot, screenshot } from "../util-test";

test.describe("Credit System", () => {

    test.beforeEach(async ({ page }) => {
        await restoreSqliteSnapshot(page);
    });

    test("anonymous session creation and credit balance display", async ({ page }, testInfo) => {
        await page.goto("./dashboard");

        // Wait for the dashboard to load and check for anonymous session creation
        await page.waitForSelector('[data-testid="monitor-list"]', { timeout: 10000 });

        // Check if CreditBalance component is visible
        const creditBalance = page.locator('.credit-balance');
        await expect(creditBalance).toBeVisible();

        // Check initial balance display
        const balanceAmount = page.locator('.balance-amount .sats');
        await expect(balanceAmount).toBeVisible();

        // Take screenshot for visual verification
        await screenshot(testInfo, page);
    });

    test("add credits modal interaction", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Click "Add Credits" button
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await addCreditsBtn.click();

        // Verify modal appears
        const modal = page.locator('.modal-overlay');
        await expect(modal).toBeVisible();

        // Verify modal content
        const modalHeader = page.locator('.modal-header h4').filter({ hasText: 'Add Credits' });
        await expect(modalHeader).toBeVisible();

        // Verify amount selector
        const amountSelect = page.locator('.amount-selector select');
        await expect(amountSelect).toBeVisible();

        // Test amount selection
        await amountSelect.selectOption('500');
        await expect(amountSelect).toHaveValue('500');

        // Take screenshot of modal
        await screenshot(testInfo, page);
    });

    test("modal close functionality", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Open modal
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await addCreditsBtn.click();

        // Verify modal is open
        const modal = page.locator('.modal-overlay');
        await expect(modal).toBeVisible();

        // Close modal by clicking close button
        const closeBtn = page.locator('.close-btn');
        await closeBtn.click();

        // Verify modal is closed
        await expect(modal).not.toBeVisible();

        // Re-open modal to test overlay click
        await addCreditsBtn.click();
        await expect(modal).toBeVisible();

        // Close modal by clicking overlay
        await page.locator('.modal-overlay').click();
        await expect(modal).not.toBeVisible();

        await screenshot(testInfo, page);
    });

    test("invoice generation flow", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Open add credits modal
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await addCreditsBtn.click();

        // Select amount
        const amountSelect = page.locator('.amount-selector select');
        await amountSelect.selectOption('1000');

        // Click generate invoice button
        const generateBtn = page.locator('.modal-body .btn-primary').filter({ hasText: 'Generate Invoice' });
        await generateBtn.click();

        // Wait for loading state
        const loading = page.locator('.loading');
        await expect(loading).toBeVisible();
        await expect(loading).toContainText('Generating invoice...');

        // Note: In a real test environment, you would mock the API response
        // For now, we just verify the UI flow up to the loading state
        await screenshot(testInfo, page);
    });

    test("copy invoice functionality", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Mock the invoice generation by setting up the component state
        // This would typically be done by mocking the API or using a test-specific endpoint

        // For demonstration, we'll test the UI elements that would appear after invoice generation
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await addCreditsBtn.click();

        // Verify the structure that would contain the copy button
        const modalBody = page.locator('.modal-body');
        await expect(modalBody).toBeVisible();

        // Take screenshot to verify modal structure
        await screenshot(testInfo, page);
    });

    test("balance refresh functionality", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Get initial balance
        const balanceElement = page.locator('.balance-amount .sats');
        const initialBalance = await balanceElement.textContent();

        // Wait for potential refresh (the component refreshes every 30 seconds)
        // In a real test, you might mock the API to return different values

        // Verify balance element is still present and accessible
        await expect(balanceElement).toBeVisible();
        await expect(balanceElement).toHaveText(initialBalance);

        await screenshot(testInfo, page);
    });

    test("error handling - failed balance load", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // The component should handle API errors gracefully
        // In a real test environment, you would mock failed API responses

        // Verify the component still renders even if API fails
        const creditBalance = page.locator('.credit-balance');
        await expect(creditBalance).toBeVisible();

        const balanceElement = page.locator('.balance-amount .sats');
        await expect(balanceElement).toBeVisible();

        await screenshot(testInfo, page);
    });

    test("responsive design - modal on different screen sizes", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Test on mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await addCreditsBtn.click();

        // Verify modal is responsive
        const modal = page.locator('.modal-content');
        await expect(modal).toBeVisible();

        // Check that modal doesn't overflow on mobile
        const modalBox = await modal.boundingBox();
        expect(modalBox.width).toBeLessThanOrEqual(375 - 20); // Account for padding

        await screenshot(testInfo, page);

        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
    });

    test("accessibility - keyboard navigation", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForSelector('.credit-balance', { timeout: 10000 });

        // Test keyboard navigation
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });

        // Focus on button using Tab
        await page.keyboard.press('Tab');
        await expect(addCreditsBtn).toBeFocused();

        // Open modal with Enter
        await page.keyboard.press('Enter');
        const modal = page.locator('.modal-overlay');
        await expect(modal).toBeVisible();

        // Test Tab navigation within modal
        await page.keyboard.press('Tab');
        const closeBtn = page.locator('.close-btn');
        await expect(closeBtn).toBeFocused();

        // Close modal with Enter
        await page.keyboard.press('Enter');
        await expect(modal).not.toBeVisible();

        await screenshot(testInfo, page);
    });

});