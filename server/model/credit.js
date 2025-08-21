const { BeanModel } = require("redbean-node/dist/bean-model");
const { R } = require("redbean-node");

class Credit extends BeanModel {

    /**
     * Find credits by user ID
     * @param {number} userId The user ID
     * @returns {Promise<Credit|null>} The credit record or null
     */
    static async findByUserId(userId) {
        return await Credit.findOne(" user_id = ? ", [userId]);
    }

    /**
     * Find credits by anonymous session ID
     * @param {number} sessionId The anonymous session ID
     * @returns {Promise<Credit|null>} The credit record or null
     */
    static async findByAnonymousSessionId(sessionId) {
        return await Credit.findOne(" anonymous_session_id = ? ", [sessionId]);
    }

    /**
     * Add credits to the balance
     * @param {number} amount Amount to add in sats
     * @returns {Promise<void>}
     */
    async addCredits(amount) {
        this.balance = parseInt(this.balance) + parseInt(amount);
        this.updated_date = new Date();
        await this.save();
    }

    /**
     * Deduct credits from the balance
     * @param {number} amount Amount to deduct in sats
     * @returns {Promise<boolean>} True if deduction was successful, false if insufficient balance
     */
    async deductCredits(amount) {
        const currentBalance = parseInt(this.balance);
        const deductAmount = parseInt(amount);

        if (currentBalance < deductAmount) {
            return false;
        }

        this.balance = currentBalance - deductAmount;
        this.updated_date = new Date();
        await this.save();
        return true;
    }

    /**
     * Check if the account has sufficient credits
     * @param {number} amount Amount to check in sats
     * @returns {boolean} True if sufficient credits
     */
    hasCredits(amount) {
        return parseInt(this.balance) >= parseInt(amount);
    }

    /**
     * Get the owner (user or anonymous session)
     * @returns {Promise<User|AnonymousSession|null>} The owner
     */
    async getOwner() {
        if (this.user_id) {
            const { User } = require("./user");
            return await User.findById(this.user_id);
        } else if (this.anonymous_session_id) {
            const { AnonymousSession } = require("./anonymous-session");
            return await AnonymousSession.findById(this.anonymous_session_id);
        }
        return null;
    }

    /**
     * Log credit usage
     * @param {number} amount Amount used
     * @param {string} action The action performed
     * @param {number} monitorId Optional monitor ID
     * @returns {Promise<void>}
     */
    async logUsage(amount, action, monitorId = null) {
        const { CreditUsage } = require("./credit-usage");

        const usage = new CreditUsage();
        usage.user_id = this.user_id;
        usage.anonymous_session_id = this.anonymous_session_id;
        usage.monitor_id = monitorId;
        usage.amount = amount;
        usage.action = action;

        await usage.save();
    }

}

module.exports = Credit;