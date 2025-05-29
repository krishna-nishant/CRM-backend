const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - name
 *         - rules
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the campaign
 *         rules:
 *           type: array
 *           description: Segmentation rules for the campaign
 *           items:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *               operator:
 *                 type: string
 *               value:
 *                 type: number
 *         status:
 *           type: string
 *           enum: [draft, active, completed, paused]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PreviewRequest:
 *       type: object
 *       required:
 *         - rules
 *       properties:
 *         rules:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *               operator:
 *                 type: string
 *               value:
 *                 type: number
 *     NaturalLanguageRequest:
 *       type: object
 *       required:
 *         - prompt
 *       properties:
 *         prompt:
 *           type: string
 *           description: Natural language description of campaign rules
 *     CampaignStats:
 *       type: object
 *       properties:
 *         delivered:
 *           type: number
 *         failed:
 *           type: number
 *         pending:
 *           type: number
 *         total:
 *           type: number
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: List of campaigns
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 *   post:
 *     summary: Create a new campaign
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 */

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Campaign'
 */

/**
 * @swagger
 * /api/campaigns/preview:
 *   post:
 *     summary: Preview audience size for campaign rules
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreviewRequest'
 *     responses:
 *       200:
 *         description: Audience size preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 */

/**
 * @swagger
 * /api/campaigns/natural-language:
 *   post:
 *     summary: Convert natural language to campaign rules
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NaturalLanguageRequest'
 *     responses:
 *       200:
 *         description: Converted campaign rules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rules:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/campaigns/{campaignId}/start:
 *   post:
 *     summary: Start a campaign
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         schema:
 *           type: string
 *         required: true
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign started successfully
 */

/**
 * @swagger
 * /api/campaigns/{campaignId}/stats:
 *   get:
 *     summary: Get campaign statistics
 *     security:
 *       - bearerAuth: []
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         schema:
 *           type: string
 *         required: true
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CampaignStats'
 */

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