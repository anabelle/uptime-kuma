const { R } = require("redbean-node");

const Credits = {
    /**
     * Get credits for a user
     * @param {number} userId User ID
     * @returns {Promise<Object|null>} Credits record or null
     */
    async getForUser(userId) {
        return await R.findOne("credits", " user_id = ? ", [userId]);
    },

    /**
     * Get credits for an anonymous session
     * @param {number} sessionId Anonymous session ID
     * @returns {Promise<Object|null>} Credits record or null
     */
    async getForSession(sessionId) {
        return await R.findOne("credits", " anonymous_session_id = ? ", [sessionId]);
    },

    /**
     * Get or create credits record for a user
     * @param {number} userId User ID
     * @returns {Promise<Object>} Credits record
     */
    async getOrCreateForUser(userId) {
        let credits = await this.getForUser(userId);
        if (!credits) {
            credits = R.dispense("credits");
            credits.user_id = userId;
            credits.balance = 0;
            credits.created_date = R.isoDateTime();
            credits.updated_date = R.isoDateTime();
            await R.store(credits);
        }
        return credits;
    },

    /**
     * Get or create credits record for an anonymous session
     * @param {number} sessionId Anonymous session ID
     * @returns {Promise<Object>} Credits record
     */
    async getOrCreateForSession(sessionId) {
        let credits = await this.getForSession(sessionId);
        if (!credits) {
            credits = R.dispense("credits");
            credits.anonymous_session_id = sessionId;
            credits.balance = 0;
            credits.created_date = R.isoDateTime();
            credits.updated_date = R.isoDateTime();
            await R.store(credits);
        }
        return credits;
    },

    /**
     * Add credits to balance
     * @param {Object} credits Credits record
     * @param {number} amount Amount to add in sats
     * @returns {Promise<void>}
     */
    async addCredits(credits, amount) {
        credits.balance += amount;
        credits.updated_date = R.isoDateTime();
        await R.store(credits);
    },

    /**
     * Deduct credits from balance
     * @param {Object} credits Credits record
     * @param {number} amount Amount to deduct in sats
     * @returns {Promise<boolean>} True if successful, false if insufficient balance
     */
    async deductCredits(credits, amount) {
        if (credits.balance >= amount) {
            credits.balance -= amount;
            credits.updated_date = R.isoDateTime();
            await R.store(credits);
            return true;
        }
        return false;
    },

    /**
     * Check if user/session has sufficient credits
     * @param {Object} credits Credits record
     * @param {number} amount Amount needed in sats
     * @returns {boolean} True if sufficient credits
     */
    hasCredits(credits, amount) {
        return credits.balance >= amount;
    }
};

module.exports = Credits;