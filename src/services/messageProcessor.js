const CommunicationLog = require('../models/CommunicationLog');
const vendorService = require('./vendorService');
const mongoose = require('mongoose');

class MessageProcessor {
  constructor() {
    this.BATCH_SIZE = 50;
    this.BATCH_DELAY = 1000; // 1 second delay between batches
    this.isProcessing = false;
  }

  async processCampaign(campaignId) {
    if (this.isProcessing) {
      throw new Error('Message processor is already running');
    }

    try {
      this.isProcessing = true;
      let processedCount = 0;
      let hasMore = true;

      // Convert string ID to ObjectId
      const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

      while (hasMore) {
        // Get next batch of queued messages
        const messages = await CommunicationLog.find({
          campaignId: campaignObjectId,
          status: 'QUEUED'
        })
        .limit(this.BATCH_SIZE)
        .populate('customerId', 'name email');

        if (messages.length === 0) {
          hasMore = false;
          continue;
        }

        console.log(`Processing batch of ${messages.length} messages for campaign ${campaignId}`);

        // Process the batch
        const results = await vendorService.sendBatch(
          messages.map(msg => ({
            message: this.personalizeMessage(msg.message, msg.customerId),
            customerId: msg.customerId._id
          }))
        );

        // Update message statuses
        await Promise.all(results.map(async (result, index) => {
          const message = messages[index];
          if (result.success) {
            await CommunicationLog.findByIdAndUpdate(message._id, {
              status: 'SENT',
              vendorMessageId: result.messageId,
              updatedAt: new Date()
            });
          } else {
            await CommunicationLog.findByIdAndUpdate(message._id, {
              status: 'FAILED',
              failureReason: result.error,
              updatedAt: new Date()
            });
          }
        }));

        processedCount += messages.length;
        console.log(`Processed ${processedCount} messages so far for campaign ${campaignId}`);

        // Add delay between batches to prevent overwhelming the vendor API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
        }
      }

      return processedCount;
    } catch (error) {
      console.error(`Error processing campaign ${campaignId}:`, error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  personalizeMessage(template, customer) {
    return template.replace(/{name}/g, customer.name);
  }

  async getStats(campaignId) {
    // Convert string ID to ObjectId
    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

    const stats = await CommunicationLog.aggregate([
      { $match: { campaignId: campaignObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);


    const result = { queued: 0, sent: 0, failed: 0 };
    stats.forEach(stat => {
      result[stat._id.toLowerCase()] = stat.count;
    });

    return result;
  }
}

module.exports = new MessageProcessor(); 