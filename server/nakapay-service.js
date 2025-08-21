const axios = require("axios");
const { log } = require("../src/util");

class NakaPayService {
    constructor() {
        // NakaPay API configuration
        this.baseURL = "https://api.nakapay.app"; // Update with actual API URL
        this.apiKey = process.env.NAKAPAY_API_KEY || null;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Create a Lightning invoice
     * @param {number} amount Amount in sats
     * @param {string} description Invoice description
     * @param {string} callbackUrl Callback URL for payment confirmation
     * @returns {Promise<Object>} Invoice data
     */
    async createInvoice(amount, description, callbackUrl = null) {
        try {
            if (!this.apiKey) {
                throw new Error("NakaPay API key not configured");
            }

            const payload = {
                amount: amount,
                description: description,
                currency: "sats"
            };

            if (callbackUrl) {
                payload.callback_url = callbackUrl;
            }

            const response = await axios.post(`${this.baseURL}/api/v1/invoices`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            log.info("nakapay", `Created invoice: ${response.data.id} for ${amount} sats`);
            return response.data;

        } catch (error) {
            log.error("nakapay", `Failed to create invoice: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check invoice status
     * @param {string} invoiceId Invoice ID
     * @returns {Promise<Object>} Invoice status
     */
    async getInvoiceStatus(invoiceId) {
        try {
            if (!this.apiKey) {
                throw new Error("NakaPay API key not configured");
            }

            const response = await axios.get(`${this.baseURL}/api/v1/invoices/${invoiceId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            log.error("nakapay", `Failed to get invoice status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get supported payment methods
     * @returns {Promise<Array>} Payment methods
     */
    async getPaymentMethods() {
        try {
            if (!this.apiKey) {
                throw new Error("NakaPay API key not configured");
            }

            const response = await axios.get(`${this.baseURL}/api/v1/payment-methods`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            log.error("nakapay", `Failed to get payment methods: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate webhook signature (if NakaPay supports webhooks)
     * @param {string} payload Raw request body
     * @param {string} signature Webhook signature
     * @param {string} secret Webhook secret
     * @returns {boolean} True if signature is valid
     */
    validateWebhookSignature(payload, signature, secret) {
        // Implementation depends on NakaPay's webhook signature method
        // This is a placeholder - update based on actual NakaPay documentation
        const crypto = require("crypto");
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");

        return signature === expectedSignature;
    }

    /**
     * Get exchange rate (if needed for fiat conversions)
     * @param {string} fromCurrency Source currency
     * @param {string} toCurrency Target currency
     * @returns {Promise<number>} Exchange rate
     */
    async getExchangeRate(fromCurrency = "USD", toCurrency = "BTC") {
        try {
            const response = await axios.get(`${this.baseURL}/api/v1/exchange-rates`, {
                params: {
                    from: fromCurrency,
                    to: toCurrency
                },
                timeout: this.timeout
            });

            return response.data.rate;

        } catch (error) {
            log.error("nakapay", `Failed to get exchange rate: ${error.message}`);
            throw error;
        }
    }
}

module.exports = NakaPayService;