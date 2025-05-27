const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true,
    enum: ['totalSpent', 'visits', 'lastVisit']
  },
  operator: {
    type: String,
    required: true,
    enum: ['gt', 'lt', 'eq']
  },
  value: {
    type: Number,
    required: true
  }
});

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  rules: [ruleSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'failed'],
    default: 'draft'
  },
  audienceSize: {
    type: Number,
    default: 0
  },
  delivered: {
    type: Number,
    default: 0
  },
  failed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

campaignSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema); 