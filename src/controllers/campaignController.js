const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const { convertNaturalLanguageToRules } = require('../services/aiService');

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const { name, message, rules } = req.body;
    
    // Calculate audience size
    const audienceSize = await calculateAudienceSize(rules);
    
    const campaign = new Campaign({
      name,
      message,
      rules,
      audienceSize
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaign by ID
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Preview audience size for campaign rules
exports.previewAudience = async (req, res) => {
  try {
    const { rules } = req.body;
    const audienceSize = await calculateAudienceSize(rules);
    
    res.json({
      audienceSize,
      estimatedDeliveryTime: calculateEstimatedDeliveryTime(audienceSize)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Convert natural language to campaign rules
exports.convertNaturalLanguageRules = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const rules = await convertNaturalLanguageToRules(prompt);
    
    const audienceSize = await calculateAudienceSize(rules);
    
    res.json({
      rules,
      audienceSize,
      estimatedDeliveryTime: calculateEstimatedDeliveryTime(audienceSize)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Helper function to calculate audience size based on rules
async function calculateAudienceSize(rules) {
  if (!rules || rules.length === 0) return 0;

  // Build MongoDB query from rules
  const query = rules.reduce((acc, rule) => {
    const { condition, operator, value } = rule;
    
    switch (operator) {
      case 'gt':
        acc[condition] = { $gt: value };
        break;
      case 'lt':
        acc[condition] = { $lt: value };
        break;
      case 'eq':
        acc[condition] = value;
        break;
    }
    
    return acc;
  }, {});

  return await Customer.countDocuments(query);
}

// Helper function to estimate delivery time
function calculateEstimatedDeliveryTime(audienceSize) {
  const messagesPerMinute = 100;
  const minutes = Math.ceil(audienceSize / messagesPerMinute);
  
  if (minutes < 1) return 'Less than a minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
} 