const { R } = require("redbean-node");

class Payment {

    /**
     * Create a new payment record
     * @param {number|null} userId User ID (null for anonymous)
     * @param {number|null} sessionId Anonymous session ID (null for registered users)
     * @param {string} invoiceId NakaPay invoice ID
     * @param {number} amount Amount in sats
     * @returns {Promise<Payment>} Created payment record
     */
    static async create(userId, sessionId, invoiceId, amount) {
        let payment = R.dispense("payment");
        payment.user_id = userId;
        payment.anonymous_session_id = sessionId;
        payment.invoice_id = invoiceId || ''; // Provide empty string if null
        payment.amount = amount;
        payment.status = 'pending';
        payment.created_date = R.isoDateTime();

        let id = await R.store(payment);
        payment.id = id;
        return payment;
    }

    /**
     * Find payment by invoice ID
     * @param {string} invoiceId NakaPay invoice ID
     * @returns {Promise<Payment|null>} Payment record or null
     */
    static async findByInvoiceId(invoiceId) {
        return await R.findOne("payment", " invoice_id = ? ", [invoiceId]);
    }

    /**
     * Update payment status
     * @param {string} status New status (pending, paid, failed, expired)
     * @returns {Promise<void>}
     */
    async updateStatus(status) {
        this.status = status;
        if (status === 'paid') {
            this.paid_date = R.isoDateTime();
        }
        await R.store(this);
    }

    /**
     * Get all pending payments
     * @returns {Promise<Array<Payment>>} Array of pending payments
     */
    static async getPendingPayments() {
        return await R.find("payment", " status = ? ", ["pending"]);
    }

    /**
     * Mark payment as paid and add credits to user/session
     * @returns {Promise<void>}
     */
    async markAsPaid() {
        await this.updateStatus('paid');

        // Add credits to user or session
        if (this.user_id) {
            const Credits = require("./credits");
            let credits = await Credits.getOrCreateForUser(this.user_id);
            await credits.addCredits(this.amount);
        } else if (this.anonymous_session_id) {
            const AnonymousSession = require("./anonymous-session");
            let session = await R.findOne("anonymous_session", " id = ? ", [this.anonymous_session_id]);
            if (session) {
                await session.addCredits(this.amount);
            }
        }
    }

}

module.exports = Payment;