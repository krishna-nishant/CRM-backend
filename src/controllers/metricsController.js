const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');

const getMetrics = async (req, res) => {
  try {
    // Get basic metrics with a single aggregation
    const customerStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          averageSpent: { $avg: '$totalSpent' },
          lowSpenders: { 
            $sum: { $cond: [{ $lte: ['$totalSpent', 5000] }, 1, 0] }
          },
          mediumSpenders: {
            $sum: { $cond: [
              { $and: [
                { $gt: ['$totalSpent', 5000] },
                { $lte: ['$totalSpent', 15000] }
              ]}, 1, 0
            ]}
          },
          highSpenders: {
            $sum: { $cond: [{ $gt: ['$totalSpent', 15000] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total campaigns count
    const totalCampaigns = await Campaign.countDocuments();

    const stats = customerStats[0] || {
      totalCustomers: 0,
      totalRevenue: 0,
      averageSpent: 0,
      lowSpenders: 0,
      mediumSpenders: 0,
      highSpenders: 0
    };

    res.json({
      totalCustomers: stats.totalCustomers,
      totalCampaigns,
      totalRevenue: stats.totalRevenue,
      averageSpent: Math.round(stats.averageSpent || 0),
      spendingDistribution: {
        low: stats.lowSpenders,
        medium: stats.mediumSpenders,
        high: stats.highSpenders
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

module.exports = {
  getMetrics
}; 