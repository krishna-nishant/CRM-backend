const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');
const messageProcessor = require('../services/messageProcessor');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

exports.startCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);
    
    const campaign = await Campaign.findById(campaignObjectId)
      .populate('rules');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Convert campaign rules to MongoDB query
    const query = {};
    campaign.rules.forEach(rule => {
      const field = rule.condition;
      const value = rule.value;
      
      switch(rule.operator) {
        case 'gt':
          query[field] = { $gt: value };
          break;
        case 'lt':
          query[field] = { $lt: value };
          break;
        case 'eq':
          query[field] = value;
          break;
      }
    });

    console.log('Finding customers with query:', query);

    // Find matching customers based on rules
    const customers = await Customer.find(query);
    console.log(`Found ${customers.length} matching customers`);

    if (customers.length === 0) {
      return res.status(400).json({ error: 'No customers match the campaign rules' });
    }

    // Delete any existing communication logs for this campaign
    await CommunicationLog.deleteMany({ campaignId: campaignObjectId });

    // Create communication logs for each customer
    console.log('Creating communication logs...');
    const logs = await Promise.all(customers.map(customer => 
      CommunicationLog.create({
        campaignId: campaignObjectId,
        customerId: customer._id,
        message: campaign.message,
        status: 'QUEUED'
      })
    ));
    console.log(`Created ${logs.length} communication logs`);

    // Update campaign status and audience size
    campaign.status = 'active';
    campaign.audienceSize = customers.length;
    campaign.delivered = 0;
    campaign.failed = 0;
    await campaign.save();

    // Start processing messages in the background
    console.log('Starting message processing...');
    messageProcessor.processCampaign(campaignId)
      .then(async (result) => {
        console.log(`Campaign ${campaignId} completed, processed ${result} messages`);
        const stats = await messageProcessor.getStats(campaignId);
        await Campaign.findByIdAndUpdate(campaignObjectId, {
          status: 'completed',
          delivered: stats.sent,
          failed: stats.failed
        });
      })
      .catch(async error => {
        console.error(`Error processing campaign ${campaignId}:`, error);
        await Campaign.findByIdAndUpdate(campaignObjectId, { 
          status: 'failed',
          error: error.message
        });
      });

    res.json({ 
      message: 'Campaign started successfully',
      audienceSize: customers.length
    });
  } catch (error) {
    console.error('Campaign start error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.handleDeliveryReceipt = async (req, res) => {
  try {
    const { messageId, status, timestamp } = req.body;

    if (!messageId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = await CommunicationLog.findOne({ vendorMessageId: messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.status = status.toUpperCase();
    message.deliveredAt = new Date(timestamp);
    await message.save();

    // Update campaign stats
    const stats = await messageProcessor.getStats(message.campaignId.toString());
    const campaign = await Campaign.findById(message.campaignId);
    
    if (campaign && stats.queued === 0) {
      campaign.status = 'completed';
      campaign.delivered = stats.sent;
      campaign.failed = stats.failed;
      campaign.completedAt = new Date();
      await campaign.save();
    }

    res.json({ message: 'Delivery receipt processed' });
  } catch (error) {
    console.error('Delivery receipt error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCampaignStats = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

    const [stats, campaign] = await Promise.all([
      messageProcessor.getStats(campaignId),
      Campaign.findById(campaignObjectId)
    ]);

    const response = {
      ...stats,
      status: campaign?.status || 'unknown',
      audienceSize: campaign?.audienceSize || 0,
      completedAt: campaign?.completedAt
    };

    res.json(response);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
}; 