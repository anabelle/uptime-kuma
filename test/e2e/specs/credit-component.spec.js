import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("Credit Balance Component", () => {

    test("should show credit balance component in dashboard", async ({ page }, testInfo) => {
        await page.goto("/dashboard");
        await page.waitForLoadState('networkidle');

        // This test will initially fail - demonstrating what we want to implement
        // Once the CreditBalance component is added to the dashboard, this should pass

        // Look for the credit balance component
        const creditBalance = page.locator('.credit-balance');
        await expect(creditBalance).toBeVisible();

        // Should show credit balance display
        const balanceDisplay = page.locator('.balance-display');
        await expect(balanceDisplay).toBeVisible();

        // Should show balance amount
        const balanceAmount = page.locator('.balance-amount .sats');
        await expect(balanceAmount).toBeVisible();

        // Should show "Add Credits" button
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await expect(addCreditsBtn).toBeVisible();

        // Take screenshot to document the working credit component
        await screenshot(testInfo, page);

        console.log('✅ Credit balance component is visible');
        console.log('✅ Balance display is working');
        console.log('✅ Add credits functionality is available');
    });

    test("should show credit balance for anonymous users", async ({ page }, testInfo) => {
        await page.goto("/dashboard");
        await page.waitForLoadState('networkidle');

        // Should have created an anonymous session
        const sessionId = await page.evaluate(() => {
            return localStorage.getItem('anonymous_session_id');
        });
        expect(sessionId).toBeTruthy();
        expect(sessionId.length).toBeGreaterThan(0);

        // Should display balance (even if 0 for new anonymous users)
        const balanceAmount = page.locator('.balance-amount .sats');
        await expect(balanceAmount).toBeVisible();

        const balanceText = await balanceAmount.textContent();
        expect(balanceText).toBeTruthy();

        // Should be able to parse as number
        const balanceValue = parseInt(balanceText.replace(/[^\d]/g, ''));
        expect(isNaN(balanceValue)).toBe(false);

        console.log('✅ Anonymous session created:', sessionId);
        console.log('✅ Credit balance displayed:', balanceValue, 'sats');

        await screenshot(testInfo, page);
    });

    test("should allow adding credits", async ({ page }, testInfo) => {
        await page.goto("/dashboard");
        await page.waitForLoadState('networkidle');

        // Click "Add Credits" button
        const addCreditsBtn = page.locator('.credit-balance .btn-primary').filter({ hasText: 'Add Credits' });
        await addCreditsBtn.click();

        // Should open add credits modal
        const modal = page.locator('.modal-overlay');
        await expect(modal).toBeVisible();

        // Should show amount selector
        const amountSelect = page.locator('.amount-selector select');
        await expect(amountSelect).toBeVisible();

        // Should have multiple amount options
        const options = await amountSelect.locator('option').allTextContents();
        expect(options.length).toBeGreaterThan(1);

        // Should show generate invoice button
        const generateBtn = page.locator('.modal-body .btn-primary').filter({ hasText: 'Generate Invoice' });
        await expect(generateBtn).toBeVisible();

        console.log('✅ Add credits modal opens');
        console.log('✅ Amount selection available');
        console.log('✅ Invoice generation ready');

        await screenshot(testInfo, page);
    });

});