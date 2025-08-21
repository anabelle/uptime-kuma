const { R } = require("redbean-node");

class CreditUsage {

    /**
     * Log credit usage
     * @param {number|null} userId User ID (null for anonymous)
     * @param {number|null} sessionId Anonymous session ID (null for registered users)
     * @param {number|null} monitorId Monitor ID (null if not monitor-related)
     * @param {number} amount Amount deducted in sats
     * @param {string} action Action performed (monitor_created, alert_sent, check_performed)
     * @returns {Promise<CreditUsage>} Created usage record
     */
    static async logUsage(userId, sessionId, monitorId, amount, action) {
        let usage = R.dispense("credit_usage");
        usage.user_id = userId;
        usage.anonymous_session_id = sessionId;
        usage.monitor_id = monitorId;
        usage.amount = amount;
        usage.action = action;
        usage.created_date = R.isoDateTime();

        let id = await R.store(usage);
        usage.id = id;
        return usage;
    }

    /**
     * Get usage history for a user
     * @param {number} userId User ID
     * @param {number} limit Number of records to return
     * @returns {Promise<Array<CreditUsage>>} Usage records
     */
    static async getUserHistory(userId, limit = 50) {
        return await R.find("credit_usage", " user_id = ? ORDER BY created_date DESC LIMIT ?", [userId, limit]);
    }

    /**
     * Get usage history for an anonymous session
     * @param {number} sessionId Anonymous session ID
     * @param {number} limit Number of records to return
     * @returns {Promise<Array<CreditUsage>>} Usage records
     */
    static async getSessionHistory(sessionId, limit = 50) {
        return await R.find("credit_usage", " anonymous_session_id = ? ORDER BY created_date DESC LIMIT ?", [sessionId, limit]);
    }

    /**
     * Get total credits used by a user
     * @param {number} userId User ID
     * @returns {Promise<number>} Total credits used
     */
    static async getUserTotalUsage(userId) {
        let result = await R.getRow("SELECT SUM(amount) as total FROM credit_usage WHERE user_id = ?", [userId]);
        return result.total || 0;
    }

    /**
     * Get total credits used by an anonymous session
     * @param {number} sessionId Anonymous session ID
     * @returns {Promise<number>} Total credits used
     */
    static async getSessionTotalUsage(sessionId) {
        let result = await R.getRow("SELECT SUM(amount) as total FROM credit_usage WHERE anonymous_session_id = ?", [sessionId]);
        return result.total || 0;
    }

}

module.exports = CreditUsage;