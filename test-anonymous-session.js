// Simple test to verify anonymous session functionality
const puppeteer = require('puppeteer');

async function testAnonymousSession() {
    console.log('Starting anonymous session test...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Navigate to the add monitor page
        console.log('Navigating to /add page...');
        await page.goto('http://localhost:3000/add', { waitUntil: 'networkidle0' });

        // Wait for page to load
        await page.waitForTimeout(2000);

        // Check if we're on the add monitor page
        const title = await page.title();
        console.log('Page title:', title);

        // Check for anonymous session creation
        const hasAnonymousSession = await page.evaluate(() => {
            return localStorage.getItem('anonymous_session_id') !== null;
        });

        console.log('Has anonymous session:', hasAnonymousSession);

        if (hasAnonymousSession) {
            const sessionId = await page.evaluate(() => {
                return localStorage.getItem('anonymous_session_id');
            });
            console.log('Anonymous session ID:', sessionId);
        }

        // Check if the form is visible (indicating no login error)
        const formVisible = await page.evaluate(() => {
            const form = document.querySelector('form');
            return form && form.style.display !== 'none';
        });

        console.log('Monitor form is visible:', formVisible);

        // Check for any error messages
        const errorMessages = await page.evaluate(() => {
            const errors = [];
            document.querySelectorAll('.alert-danger, .toast-error').forEach(el => {
                errors.push(el.textContent.trim());
            });
            return errors;
        });

        console.log('Error messages found:', errorMessages);

        // Check for "Creating anonymous session" message
        const creatingSessionMessage = await page.evaluate(() => {
            const alerts = [];
            document.querySelectorAll('.alert-info').forEach(el => {
                alerts.push(el.textContent.trim());
            });
            return alerts.some(text => text.includes('Creating anonymous session'));
        });

        console.log('Creating anonymous session message visible:', creatingSessionMessage);

        // Test result
        if (hasAnonymousSession && formVisible && errorMessages.length === 0) {
            console.log('✅ SUCCESS: Anonymous session functionality is working!');
            console.log('   - Anonymous session created');
            console.log('   - Monitor form is accessible');
            console.log('   - No login errors');
        } else {
            console.log('❌ ISSUES FOUND:');
            if (!hasAnonymousSession) console.log('   - No anonymous session created');
            if (!formVisible) console.log('   - Monitor form not accessible');
            if (errorMessages.length > 0) console.log('   - Error messages:', errorMessages);
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testAnonymousSession();