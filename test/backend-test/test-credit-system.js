const test = require("node:test");
const assert = require("node:assert");
const { R } = require("redbean-node");
const Database = require("../../server/database");
const Credits = require("../../server/model/credits");
const AnonymousSession = require("../../server/model/anonymous-session");
const CreditUsage = require("../../server/model/credit-usage");

// Setup database for tests
test.before(async () => {
    // Set test environment
    process.env.TEST_BACKEND = "1";
    process.env.DATA_DIR = "./data/test";

    // Initialize database
    await Database.initDataDir({ "data-dir": "./data/test" });
    await Database.connect(true); // testMode = true
});

test.after(async () => {
    // Clean up database
    await Database.close();
});

test("Credit system - Anonymous session creation", async (t) => {
    // Create anonymous session
    const session = await AnonymousSession.create("test-agent", "127.0.0.1");
    assert.ok(session.id);
    assert.ok(session.session_id);
    assert.strictEqual(session.active, true);

    // Check credits are auto-created
    const credits = await AnonymousSession.getCredits(session);
    assert.ok(credits.id);
    assert.strictEqual(credits.balance, 0);

    // Clean up
    await R.exec("DELETE FROM anonymous_session WHERE id = ?", [session.id]);
    await R.exec("DELETE FROM credits WHERE anonymous_session_id = ?", [session.id]);
});

test("Credit system - Add and deduct credits", async (t) => {
    // Create anonymous session
    const session = await AnonymousSession.create("test-agent", "127.0.0.1");

    // Add credits
    await AnonymousSession.addCredits(session, 100);
    let balance = await AnonymousSession.getBalance(session);
    assert.strictEqual(balance, 100);

    // Deduct credits
    const success = await AnonymousSession.deductCredits(session, 50);
    assert.strictEqual(success, true);
    balance = await AnonymousSession.getBalance(session);
    assert.strictEqual(balance, 50);

    // Try to deduct more than available
    const fail = await AnonymousSession.deductCredits(session, 100);
    assert.strictEqual(fail, false);
    balance = await AnonymousSession.getBalance(session);
    assert.strictEqual(balance, 50);

    // Clean up
    await R.exec("DELETE FROM anonymous_session WHERE id = ?", [session.id]);
});

test("Credit system - Usage logging", async (t) => {
    // Create anonymous session
    const session = await AnonymousSession.create("test-agent", "127.0.0.1");
    await AnonymousSession.addCredits(session, 100);

    // Log usage
    const usage = await CreditUsage.logUsage(
        null, // user_id
        session.id, // session_id
        null, // monitor_id
        10, // amount
        "test_action" // action
    );

    assert.ok(usage.id);
    assert.strictEqual(usage.amount, 10);
    assert.strictEqual(usage.action, "test_action");

    // Clean up
    await R.exec("DELETE FROM credit_usage WHERE id = ?", [usage.id]);
    await R.exec("DELETE FROM anonymous_session WHERE id = ?", [session.id]);
});

test("Credit system - User credits", async (t) => {
    // Create user credits (assuming user ID 1 exists)
    const credits = await Credits.getOrCreateForUser(1);
    assert.ok(credits.id);

    // Add credits
    await Credits.addCredits(credits, 200);
    assert.strictEqual(credits.balance, 200);

    // Deduct credits
    const success = await Credits.deductCredits(credits, 50);
    assert.strictEqual(success, true);
    assert.strictEqual(credits.balance, 150);

    // Reset balance for cleanup
    credits.balance = 0;
    await R.store(credits);
});