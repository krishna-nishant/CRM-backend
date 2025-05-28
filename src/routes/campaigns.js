const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');

// Protect all routes except delivery receipt webhook
router.use((req, res, next) => {
  if (req.path === '/delivery/receipt') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Campaign routes
router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.get('/:id', campaignController.getCampaign);
// router.put('/:id', campaignController.updateCampaign);
// router.delete('/:id', campaignController.deleteCampaign);

// Campaign utility routes
router.post('/preview', campaignController.previewAudience);
router.post('/natural-language', campaignController.convertNaturalLanguageRules);

// Campaign delivery routes
router.post('/:campaignId/start', deliveryController.startCampaign);
router.get('/:campaignId/stats', deliveryController.getCampaignStats);
router.post('/delivery/receipt', deliveryController.handleDeliveryReceipt);

module.exports = router; 