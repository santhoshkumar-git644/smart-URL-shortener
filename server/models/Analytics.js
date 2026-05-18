const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Unknown'
  },
  referrer: {
    type: String,
    default: 'Direct'
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
