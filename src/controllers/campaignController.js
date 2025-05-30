const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const { convertNaturalLanguageToRules, generateCampaignSuggestions } = require('../services/aiService');

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

// Get campaign suggestions
exports.getCampaignSuggestions = async (req, res) => {
  try {
    const suggestions = await generateCampaignSuggestions();
    
    // For each suggestion, calculate the audience size if it has rules
    const suggestionsWithStats = await Promise.all(
      suggestions.map(async (suggestion) => {
        if (suggestion.rules) {
          const audienceSize = await calculateAudienceSize(suggestion.rules);
          return {
            ...suggestion,
            audienceSize,
            estimatedDeliveryTime: calculateEstimatedDeliveryTime(audienceSize)
          };
        }
        return suggestion;
      })
    );
    
    res.json({ suggestions: suggestionsWithStats });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Helper function to calculate audience size based on rules
async function calculateAudienceSize(rules) {
  if (!rules || rules.length === 0) return 0;

  // Build MongoDB query from rules
  const query = { $and: [] };

  for (const rule of rules) {
    const { condition, operator, value, value2, conjunction } = rule;
    let conditionQuery = {};
    
    switch (operator) {
      case 'gt':
        conditionQuery[condition] = { $gt: Number(value) };
        break;
      case 'lt':
        conditionQuery[condition] = { $lt: Number(value) };
        break;
      case 'eq':
        conditionQuery[condition] = Number(value);
        break;
      case 'between':
        conditionQuery[condition] = { 
          $gte: Number(value), 
          $lte: Number(value2) 
        };
        break;
    }
    
    // Handle AND/OR logic
    if (conjunction === 'OR' && query.$and.length > 0) {
      // Convert the existing $and to an $or with the new condition
      const existingConditions = query.$and;
      query.$or = [{ $and: existingConditions }, conditionQuery];
      query.$and = [];
    } else {
      query.$and.push(conditionQuery);
    }
  }

  // If no AND conditions were added, remove the empty $and
  if (query.$and.length === 0) {
    delete query.$and;
  }

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