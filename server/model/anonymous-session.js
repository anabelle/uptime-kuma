const { R } = require("redbean-node");
const { v4: uuidv4 } = require("uuid");

const AnonymousSession = {
    /**
     * Create a new anonymous session
     * @param {string} userAgent User agent string
     * @param {string} ipAddress IP address
     * @returns {Promise<Object>} Created session
     */
    async create(userAgent = null, ipAddress = null) {
        let session = R.dispense("anonymous_session");
        session.session_id = uuidv4();
        session.user_agent = userAgent;
        session.ip_address = ipAddress;
        session.active = true;
        session.created_date = R.isoDateTime();
        session.last_active = R.isoDateTime();

        let id = await R.store(session);
        session.id = id;
        return session;
    },

    /**
     * Find session by session ID
     * @param {string} sessionId Session UUID
     * @returns {Promise<Object|null>} Session or null if not found
     */
    async findBySessionId(sessionId) {
        return await R.findOne("anonymous_session", " session_id = ? AND active = 1 ", [sessionId]);
    },

    /**
     * Update last active timestamp
     * @param {Object} session Session object
     * @returns {Promise<void>}
     */
    async updateLastActive(session) {
        session.last_active = R.isoDateTime();
        await R.store(session);
    },

    /**
     * Deactivate session
     * @param {Object} session Session object
     * @returns {Promise<void>}
     */
    async deactivate(session) {
        session.active = false;
        await R.store(session);
    },

    /**
     * Get or create credits record for this session
     * @param {Object} session Session object
     * @returns {Promise<Object>} Credits record
     */
    async getCredits(session) {
        let credits = await R.findOne("credits", " anonymous_session_id = ? ", [session.id]);
        if (!credits) {
            credits = R.dispense("credits");
            credits.anonymous_session_id = session.id;
            credits.balance = 0;
            credits.created_date = R.isoDateTime();
            credits.updated_date = R.isoDateTime();
            await R.store(credits);
        }
        return credits;
    },

    /**
     * Add credits to this session
     * @param {Object} session Session object
     * @param {number} amount Amount to add in sats
     * @returns {Promise<void>}
     */
    async addCredits(session, amount) {
        let credits = await this.getCredits(session);
        credits.balance += amount;
        credits.updated_date = R.isoDateTime();
        await R.store(credits);
    },

    /**
     * Deduct credits from this session
     * @param {Object} session Session object
     * @param {number} amount Amount to deduct in sats
     * @returns {Promise<boolean>} True if deduction successful, false if insufficient balance
     */
    async deductCredits(session, amount) {
        let credits = await this.getCredits(session);
        if (credits.balance >= amount) {
            credits.balance -= amount;
            credits.updated_date = R.isoDateTime();
            await R.store(credits);
            return true;
        }
        return false;
    },

    /**
     * Get current credit balance
     * @param {Object} session Session object
     * @returns {Promise<number>} Balance in sats
     */
    async getBalance(session) {
        let credits = await this.getCredits(session);
        return credits.balance;
    }
};

module.exports = AnonymousSession;