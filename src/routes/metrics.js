const express = require('express');
const router = express.Router();
const { getMetrics } = require('../controllers/metricsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', getMetrics);

module.exports = router; 