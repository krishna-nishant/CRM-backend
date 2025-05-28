const crypto = require('crypto');
const axios = require('axios');

class VendorService {
  constructor() {
    this.SUCCESS_RATE = 0.9; // 90% success rate
  }

  async sendMessage(message, customerId) {
    // Simulate network delay (100-500ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    // Generate a unique message ID
    const messageId = crypto.randomBytes(16).toString('hex');

    // Simulate success/failure based on SUCCESS_RATE
    const isSuccess = Math.random() < this.SUCCESS_RATE;

    if (!isSuccess) {
      throw new Error('Vendor API: Message delivery failed');
    }

    // Simulate async delivery receipt (after 1-3 seconds)
    setTimeout(async () => {
      try {
        await axios.post(`${process.env.BACKEND_URL}/api/delivery/receipt`, {
          messageId,
          status: 'delivered',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to send delivery receipt:', error.message);
      }
    }, 1000 + Math.random() * 2000);

    return {
      messageId,
      status: 'accepted',
      timestamp: new Date().toISOString()
    };
  }

  async sendBatch(messages) {
    return Promise.all(
      messages.map(async ({ message, customerId }) => {
        try {
          const result = await this.sendMessage(message, customerId);
          return {
            success: true,
            customerId,
            ...result
          };
        } catch (error) {
          return {
            success: false,
            customerId,
            error: error.message
          };
        }
      })
    );
  }
}

module.exports = new VendorService(); 