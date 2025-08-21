<template>
  <div class="credit-balance">
    <div class="balance-display">
      <h3>Credit Balance</h3>
      <div class="balance-amount">
        <span class="sats">{{ balance }}</span>
        <span class="unit">sats</span>
      </div>
    </div>

    <div class="actions">
      <button @click="showAddCredits = true" class="btn btn-primary">
        Add Credits
      </button>
    </div>

    <!-- Add Credits Modal -->
    <div v-if="showAddCredits" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Add Credits</h4>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="amount-selector">
            <label>Amount (sats):</label>
            <select v-model="selectedAmount" class="form-control">
              <option value="100">100 sats</option>
              <option value="500">500 sats</option>
              <option value="1000">1000 sats</option>
              <option value="5000">5000 sats</option>
              <option value="10000">10000 sats</option>
            </select>
          </div>

          <div v-if="invoiceData" class="invoice-display">
            <p>Pay this Lightning invoice:</p>
            <div class="invoice-code">{{ invoiceData.payment_request }}</div>
            <button @click="copyInvoice" class="btn btn-secondary">Copy Invoice</button>
          </div>

          <div v-else-if="loading" class="loading">
            Generating invoice...
          </div>

          <div v-else>
            <button @click="generateInvoice" class="btn btn-primary">
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreditBalance',
  props: {
    sessionId: String,
    userId: String
  },
  data() {
    return {
      balance: 0,
      showAddCredits: false,
      selectedAmount: 100,
      invoiceData: null,
      loading: false
    };
  },
  mounted() {
    this.loadBalance();
    // Refresh balance every 30 seconds
    this.interval = setInterval(this.loadBalance, 30000);
  },
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  methods: {
    async loadBalance() {
      try {
        const params = new URLSearchParams();
        if (this.sessionId) params.append('session_id', this.sessionId);
        if (this.userId) params.append('user_id', this.userId);

        const response = await fetch(`/api/credits/balance?${params}`);
        const data = await response.json();

        if (data.balance !== undefined) {
          this.balance = data.balance;
        }
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    },

    async generateInvoice() {
      this.loading = true;
      try {
        const response = await fetch('/api/credits/invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseInt(this.selectedAmount),
            session_id: this.sessionId,
            user_id: this.userId
          })
        });

        const data = await response.json();

        if (data.invoice_id) {
          this.invoiceData = data;
        } else {
          alert('Failed to generate invoice: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Failed to generate invoice:', error);
        alert('Failed to generate invoice');
      } finally {
        this.loading = false;
      }
    },

    async copyInvoice() {
      if (this.invoiceData && this.invoiceData.payment_request) {
        try {
          await navigator.clipboard.writeText(this.invoiceData.payment_request);
          alert('Invoice copied to clipboard!');
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = this.invoiceData.payment_request;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Invoice copied to clipboard!');
        }
      }
    },

    closeModal() {
      this.showAddCredits = false;
      this.invoiceData = null;
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.credit-balance {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #f9f9f9;
}

.balance-display {
  text-align: center;
  margin-bottom: 20px;
}

.balance-amount {
  font-size: 2em;
  font-weight: bold;
  color: #2c3e50;
}

.sats {
  color: #f39c12;
}

.unit {
  font-size: 0.6em;
  color: #7f8c8d;
  margin-left: 5px;
}

.actions {
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.amount-selector {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.invoice-display {
  text-align: center;
  margin-top: 20px;
}

.invoice-code {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
  margin: 10px 0;
  border: 1px solid #ddd;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}
</style>