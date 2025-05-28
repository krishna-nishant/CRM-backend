const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['QUEUED', 'SENT', 'FAILED'],
    default: 'QUEUED'
  },
  vendorMessageId: {
    type: String,
    sparse: true
  },
  failureReason: String,
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

communicationLogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

communicationLogSchema.index({ campaignId: 1, status: 1 });
communicationLogSchema.index({ vendorMessageId: 1 }, { sparse: true });

module.exports = mongoose.model('CommunicationLog', communicationLogSchema); 