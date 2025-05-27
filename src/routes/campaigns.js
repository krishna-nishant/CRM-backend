const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

router.get('/', campaignController.getCampaigns);

router.post('/', campaignController.createCampaign);

router.post('/preview', campaignController.previewAudience);

router.get('/:id', campaignController.getCampaign);

module.exports = router; 