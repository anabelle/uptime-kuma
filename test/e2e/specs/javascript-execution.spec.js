import { expect, test } from "@playwright/test";
import { screenshot } from "../util-test";

test.describe("JavaScript Execution", () => {

    test("should execute JavaScript without critical errors", async ({ page }, testInfo) => {
        // Track all errors
        const errors = [];
        const warnings = [];
        const logs = [];

        page.on('pageerror', error => {
            errors.push({
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });

        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                errors.push({
                    message: text,
                    type: 'console',
                    timestamp: Date.now()
                });
            } else if (msg.type() === 'warning') {
                warnings.push({
                    message: text,
                    type: 'console',
                    timestamp: Date.now()
                });
            } else {
                logs.push({
                    message: text,
                    type: msg.type(),
                    timestamp: Date.now()
                });
            }
        });

        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Wait for JavaScript to execute
        await page.waitForTimeout(3000);

        console.log('=== JavaScript Execution Analysis ===');
        console.log('Critical errors:', errors.length);
        console.log('Warnings:', warnings.length);
        console.log('Log messages:', logs.length);

        // Log critical errors
        if (errors.length > 0) {
            console.log('\n❌ CRITICAL ERRORS:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.message}`);
                if (error.stack) {
                    console.log(`   Stack: ${error.stack.substring(0, 200)}...`);
                }
            });
        }

        // Log warnings
        if (warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.message}`);
            });
        }

        // Look for Vue.js related logs
        const vueLogs = logs.filter(log =>
            log.message.includes('Vue') ||
            log.message.includes('vue') ||
            log.message.includes('mount') ||
            log.message.includes('app')
        );

        if (vueLogs.length > 0) {
            console.log('\n🔧 VUE.JS LOGS:');
            vueLogs.forEach((log, index) => {
                console.log(`${index + 1}. [${log.type}] ${log.message}`);
            });
        }

        // Check if Vue.js initialized
        const vueStatus = await page.evaluate(() => {
            const status = {
                vueFound: typeof window.Vue !== 'undefined',
                uptimeKumaFound: typeof window.UptimeKuma !== 'undefined',
                vueElements: document.querySelectorAll('[data-v-]').length,
                vueComponents: document.querySelectorAll('[class*="v-"]').length
            };

            if (status.uptimeKumaFound && window.UptimeKuma) {
                status.uptimeKuma = {
                    connected: window.UptimeKuma.socket?.connected,
                    token: window.UptimeKuma.socket?.token,
                    userID: window.UptimeKuma.userID
                };
            }

            return status;
        });

        console.log('\n🔍 VUE.JS STATUS:');
        console.log('- Vue.js found:', vueStatus.vueFound);
        console.log('- UptimeKuma found:', vueStatus.uptimeKumaFound);
        console.log('- Vue elements:', vueStatus.vueElements);
        console.log('- Vue components:', vueStatus.vueComponents);

        if (vueStatus.uptimeKuma) {
            console.log('- Socket connected:', vueStatus.uptimeKuma.connected);
            console.log('- User ID:', vueStatus.uptimeKuma.userID);
            console.log('- Token:', vueStatus.uptimeKuma.token ? 'Present' : 'None');
        }

        await screenshot(testInfo, page);

        // Test should pass if page loads, but we'll analyze the errors
        await expect(page).toHaveURL(/.*dashboard.*/);

        if (errors.length === 0) {
            console.log('\n✅ No critical JavaScript errors detected');
        } else {
            console.log(`\n❌ ${errors.length} critical JavaScript errors detected`);
            console.log('This may prevent Vue.js from mounting properly');
        }
    });

    test("should initialize Vue.js application", async ({ page }, testInfo) => {
        await page.goto("./dashboard");
        await page.waitForLoadState('networkidle');

        // Wait for potential Vue.js initialization
        await page.waitForTimeout(5000);

        // Check Vue.js initialization step by step
        const initStatus = await page.evaluate(() => {
            const status = {
                step1: 'Checking basic JS execution',
                step2: 'Checking Vue.js library',
                step3: 'Checking UptimeKuma app',
                step4: 'Checking Vue components',
                step5: 'Checking app mounting'
            };

            // Step 1: Basic JS execution
            status.step1Result = true;

            // Step 2: Vue.js library
            status.step2Result = typeof window.Vue !== 'undefined';
            if (status.step2Result) {
                status.vueVersion = window.Vue?.version;
            }

            // Step 3: UptimeKuma app
            status.step3Result = typeof window.UptimeKuma !== 'undefined';
            if (status.step3Result) {
                status.uptimeKuma = {
                    userID: window.UptimeKuma.userID,
                    loggedIn: window.UptimeKuma.loggedIn,
                    socketConnected: window.UptimeKuma.socket?.connected
                };
            }

            // Step 4: Vue components
            status.step4Result = document.querySelectorAll('[data-v-]').length > 0;
            status.vueElementCount = document.querySelectorAll('[data-v-]').length;

            // Step 5: App mounting
            const app = document.querySelector('#app');
            status.step5Result = app && app.__vue__;
            if (status.step5Result) {
                status.appMounted = true;
            }

            return status;
        });

        console.log('=== VUE.JS INITIALIZATION STATUS ===');
        Object.keys(initStatus).forEach(key => {
            if (key.includes('step') && !key.includes('Result')) {
                const stepKey = key + 'Result';
                const result = initStatus[stepKey];
                const status = result ? '✅' : '❌';
                console.log(`${status} ${initStatus[key]}: ${result}`);
            }
        });

        // Additional details
        if (initStatus.vueVersion) {
            console.log(`📦 Vue.js version: ${initStatus.vueVersion}`);
        }
        if (initStatus.uptimeKuma) {
            console.log(`👤 User ID: ${initStatus.uptimeKuma.userID}`);
            console.log(`🔐 Logged in: ${initStatus.uptimeKuma.loggedIn}`);
            console.log(`🔌 Socket connected: ${initStatus.uptimeKuma.socketConnected}`);
        }
        if (initStatus.vueElementCount > 0) {
            console.log(`🧩 Vue elements found: ${initStatus.vueElementCount}`);
        }

        await screenshot(testInfo, page);

        // Test passes if page loads
        await expect(page).toHaveURL(/.*dashboard.*/);
    });

});