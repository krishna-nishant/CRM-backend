const express = require('express');
const router = express.Router();
const { getMetrics } = require('../controllers/metricsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Metrics:
 *       type: object
 *       properties:
 *         totalCustomers:
 *           type: integer
 *           description: Total number of customers
 *         totalCampaigns:
 *           type: integer
 *           description: Total number of campaigns
 *         totalRevenue:
 *           type: number
 *           description: Total revenue from all customers
 *         averageSpent:
 *           type: number
 *           description: Average amount spent per customer
 *         spendingDistribution:
 *           type: object
 *           properties:
 *             low:
 *               type: integer
 *               description: Number of customers in low spending range (₹1k-5k)
 *             medium:
 *               type: integer
 *               description: Number of customers in medium spending range (₹5k-15k)
 *             high:
 *               type: integer
 *               description: Number of customers in high spending range (₹15k+)
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get CRM metrics and analytics
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics and analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metrics'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Failed to fetch metrics
 */

// All routes require authentication
router.use(authenticateToken);

router.get('/', getMetrics);

module.exports = router; 