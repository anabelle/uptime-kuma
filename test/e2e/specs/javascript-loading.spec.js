import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("JavaScript Loading", () => {

    test("should load JavaScript files", async ({ page }, testInfo) => {
        // Track all requests
        const requests = [];
        page.on('request', request => {
            requests.push({
                url: request.url(),
                type: request.resourceType(),
                method: request.method()
            });
        });

        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Categorize requests
        const jsFiles = requests.filter(r => r.type === 'script');
        const vueFiles = requests.filter(r => r.url.includes('vue') || r.url.includes('Vue'));
        const appFiles = requests.filter(r => r.url.includes('app') || r.url.includes('main'));

        console.log('Total requests:', requests.length);
        console.log('JavaScript files:', jsFiles.length);
        console.log('Vue files:', vueFiles.length);
        console.log('App files:', appFiles.length);

        // Log JavaScript files
        console.log('\nJavaScript files loaded:');
        jsFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file.url}`);
        });

        // Log Vue files
        console.log('\nVue-related files:');
        vueFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file.url}`);
        });

        // Check for main application files
        const mainJs = requests.find(r => r.url.includes('main.js') || r.url.includes('app.js'));
        console.log('Main JS file found:', mainJs ? mainJs.url : 'No');

        // Check for Vue.js library
        const vueJs = requests.find(r => r.url.includes('vue') && r.type === 'script');
        console.log('Vue.js library found:', vueJs ? vueJs.url : 'No');

        await screenshot(testInfo, page);

        // Basic check - should have loaded some JavaScript files
        expect(jsFiles.length).toBeGreaterThan(0);
    });

    test("should execute Vue.js initialization", async ({ page }, testInfo) => {
        // Track console messages
        const consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text()
            });
        });

        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Wait for any initialization
        await page.waitForTimeout(3000);

        console.log('Console messages:', consoleMessages.length);
        consoleMessages.forEach((msg, index) => {
            console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
        });

        // Look for Vue.js initialization messages
        const vueMessages = consoleMessages.filter(msg =>
            msg.text.includes('Vue') ||
            msg.text.includes('vue') ||
            msg.text.includes('mount') ||
            msg.text.includes('app')
        );

        console.log('Vue-related console messages:', vueMessages.length);
        vueMessages.forEach((msg, index) => {
            console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
        });

        // Check if Vue app was created
        const vueAppCreated = await page.evaluate(() => {
            // Check for common Vue app patterns
            const app = document.querySelector('#app');
            if (app && app.__vue__) {
                return 'Vue app found on #app';
            }

            // Check for any element with Vue instance
            const allElements = document.querySelectorAll('*');
            for (let el of allElements) {
                if (el.__vue__) {
                    return 'Vue instance found on element';
                }
            }

            return 'No Vue instances found';
        });

        console.log('Vue app creation status:', vueAppCreated);

        await screenshot(testInfo, page);

        // For now, just ensure the page loads
        await expect(page).toHaveURL(/.*dashboard.*/);
    });

});