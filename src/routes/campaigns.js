const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

// Protect all routes
router.use(authenticateToken);

router.get('/', campaignController.getCampaigns);

router.post('/', campaignController.createCampaign);

router.post('/preview', campaignController.previewAudience);

router.get('/:id', campaignController.getCampaign);

// route for natural language processing
router.post('/natural-language', campaignController.convertNaturalLanguageRules);

module.exports = router; 